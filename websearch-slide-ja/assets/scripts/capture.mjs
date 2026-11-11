#!/usr/bin/env node
/**
 * capture.mjs — 生成したスライド HTML を 1 枚ずつ撮影する（自己検証 L3 用）
 *
 * 使い方:
 *   node capture.mjs <slides.html> [--out <dir>] [--theme light|dark] [--check]
 *
 *   --out    画像の保存先。省略時は HTML と同じフォルダの .work/
 *   --theme  撮影時のテーマ。省略時は HTML の初期値のまま
 *   --check  Playwright が使えるかだけを調べて終了する（撮影しない）
 *
 * 出力:
 *   <out>/sNN.png            各スライド（960×540）
 *   <out>/sNN-list.png       slide-fit のスライドだけ、一覧表示での全体像
 *   <out>/capture-report.json  機械的に測った結果（標準出力にも同じ JSON を出す）
 *
 * 終了コード:
 *   0  撮影できた（--check のときは Playwright が使える）
 *   1  撮影中のエラー
 *   2  引数・ファイルの誤り
 *   3  Playwright が使えない（未導入、またはブラウザ本体が未導入）
 *
 * 方針: Playwright を自動でインストールしない。無ければ 3 を返すだけにし、
 *       呼び出し側（SKILL.md Step 5-B）が撮影を飛ばす。
 * 対応: CLI トラック（mdss-convert）とレガシートラックの両方の HTML。
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EXIT = { OK: 0, ERROR: 1, USAGE: 2, UNAVAILABLE: 3 };

function parseArgs(argv) {
  const a = { html: null, out: null, theme: null, check: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--out') a.out = argv[++i];
    else if (v === '--theme') a.theme = argv[++i];
    else if (v === '--check') a.check = true;
    else if (v === '-h' || v === '--help') a.help = true;
    else if (!a.html) a.html = v;
  }
  return a;
}

/** Playwright を探す。通常の解決 → NODE_PATH → npm のグローバル。無ければ null */
async function loadPlaywright() {
  try {
    const m = await import('playwright');
    return m.default ?? m;
  } catch { /* 次の候補へ */ }
  const roots = [];
  if (process.env.NODE_PATH) roots.push(...process.env.NODE_PATH.split(path.delimiter));
  try {
    roots.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim());
  } catch { /* npm が無い環境 */ }
  for (const root of roots) {
    if (!root) continue;
    try {
      return createRequire(path.join(root, 'noop.js'))('playwright');
    } catch { /* 次の候補へ */ }
  }
  return null;
}

function unavailable(reason) {
  console.log(JSON.stringify({ ok: false, playwright: false, reason }));
  process.exit(EXIT.UNAVAILABLE);
}

const args = parseArgs(process.argv.slice(2));
if (args.help || (!args.html && !args.check)) {
  console.error('usage: node capture.mjs <slides.html> [--out <dir>] [--theme light|dark] [--check]');
  process.exit(args.help ? EXIT.OK : EXIT.USAGE);
}
if (args.theme && !['light', 'dark'].includes(args.theme)) {
  console.error('error: --theme は light か dark');
  process.exit(EXIT.USAGE);
}

const pw = await loadPlaywright();
if (!pw) unavailable('playwright-not-found');

let browser;
try {
  browser = await pw.chromium.launch();
} catch (e) {
  unavailable('browser-not-installed: ' + String(e.message || e).split('\n')[0]);
}

if (args.check) {
  await browser.close();
  console.log(JSON.stringify({ ok: true, playwright: true }));
  process.exit(EXIT.OK);
}

const htmlPath = path.resolve(args.html);
if (!existsSync(htmlPath)) {
  await browser.close();
  console.error('error: ファイルが見つかりません: ' + htmlPath);
  process.exit(EXIT.USAGE);
}
const outDir = path.resolve(args.out ?? path.join(path.dirname(htmlPath), '.work'));
mkdirSync(outDir, { recursive: true });
// 前回の撮影分を消す（枚数が減ったときに古い画像を見ないようにする）
for (const f of readdirSync(outDir)) {
  if (/^s\d+(-list)?\.png$/.test(f) || f === 'capture-report.json') unlinkSync(path.join(outDir, f));
}

const pad = (n) => String(n).padStart(2, '0');

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const failed = [];
  page.on('requestfailed', (r) => { if (/^https?:/.test(r.url())) failed.push(r.url()); });

  await page.goto(pathToFileURL(htmlPath).href + '#1', { waitUntil: 'load' });
  // 外部フォントの読み込みを待つ（オフラインでも 5 秒で先へ進む）
  await Promise.race([page.evaluate(() => document.fonts.ready.then(() => true)), page.waitForTimeout(5000)]);
  // 動きを止め、スライドに重なる操作部品（矢印・ボタン・サムネイル帯）を写さない
  await page.addStyleTag({
    content: '*,*::before,*::after{transition:none!important;animation:none!important}'
      + '.nav-arrow,.control-cluster,#thumb-strip,.thumb-strip,#slide-counter,#progress-bar{display:none!important}',
  });
  if (args.theme) await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, args.theme);

  const total = await page.evaluate(() => document.querySelectorAll('.slide-scaler > .slide, .slide-scaler .slide').length);
  if (!total) throw new Error('スライド（.slide）が見つかりません。対応していない HTML です');

  const slides = [];
  for (let i = 0; i < total; i++) {
    // 1 枚表示に切り替える。CLI は URL #番号、レガシーは active クラスで切り替わる。
    // どちらでも同じ状態になるよう、切替後に表示状態を直接そろえる。
    const info = await page.evaluate((idx) => {
      location.hash = '#' + (idx + 1);
      return new Promise((resolve) => setTimeout(() => {
        const list = Array.from(document.querySelectorAll('.slide-scaler .slide'));
        document.documentElement.dataset.view = 'hero';
        document.body.dataset.view = 'hero';
        list.forEach((s, k) => s.classList.toggle('active', k === idx));
        const scaler = document.querySelector('.slide-scaler');
        scaler.style.transform = 'translate(-50%, -50%) scale(1)'; // 960×540 の等倍で撮る
        const slide = list[idx];
        const inner = slide.querySelector('.slide-inner') || slide;
        const box = slide.getBoundingClientRect();
        // はみ出し: 枠（overflow: hidden）の外に出ている要素を数える
        let over = 0;
        let count = 0;
        inner.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const d = Math.max(box.top - r.top, r.bottom - box.bottom, box.left - r.left, r.right - box.right);
          if (d > 1) { count++; over = Math.max(over, d); }
        });
        // 文字の途中切れ: 省略記号や行数制限で隠れた文字
        let clipped = 0;
        inner.querySelectorAll('*').forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.overflow === 'visible' && cs.overflowX === 'visible') return;
          if (el.scrollHeight - el.clientHeight > 1 || el.scrollWidth - el.clientWidth > 1) clipped++;
        });
        const directive = Array.from(slide.classList).filter((c) => c !== 'slide' && c !== 'active');
        resolve({
          id: slide.id || null,
          classes: directive,
          fit: slide.classList.contains('slide-fit'),
          textLength: (inner.innerText || '').replace(/\s+/g, '').length,
          media: inner.querySelectorAll('svg, img, table, pre').length,
          overflowPx: Math.round(over),
          overflowElements: count,
          clippedElements: clipped,
        });
      }, 120));
    }, i);

    const file = `s${pad(i + 1)}.png`;
    await page.locator('.slide-scaler .slide').nth(i).screenshot({ path: path.join(outDir, file) });
    slides.push({ slide: i + 1, file, ...info });
  }

  // slide-fit は一覧表示でだけ高さが伸びる。1 枚表示では切れるのが仕様なので、一覧での全体像も撮る
  const fitIdx = slides.filter((s) => s.fit).map((s) => s.slide - 1);
  if (fitIdx.length) {
    const switched = await page.evaluate(() => {
      try {
        if (typeof applyView !== 'function') return false;
        currentView = 'list'; // eslint-disable-line no-undef
        applyView(); // eslint-disable-line no-undef
        document.querySelector('.slide-scaler').style.transform = '';
        return true;
      } catch { return false; }
    });
    if (switched) {
      // 縦に長いスライドが画面の下で切れないよう、撮影の間だけ画面を縦に広げる
      await page.setViewportSize({ width: 1280, height: 3000 });
      await page.waitForTimeout(200);
      for (const i of fitIdx) {
        const loc = page.locator('.slide-scaler .slide').nth(i);
        await loc.scrollIntoViewIfNeeded();
        const file = `s${pad(i + 1)}-list.png`;
        await loc.screenshot({ path: path.join(outDir, file) });
        slides[i].listFile = file;
      }
    }
  }

  const report = {
    ok: true,
    playwright: true,
    html: htmlPath,
    outDir,
    total,
    theme: await page.evaluate(() => document.documentElement.dataset.theme || null),
    // 外部のフォント・画像・スクリプトが読めないと、見た目がずれる（self-review.md §5）
    externalFailed: failed.length,
    externalFailedSample: failed.slice(0, 3),
    // 1 枚表示ではみ出している（slide-fit を除く）スライド番号
    overflowSlides: slides.filter((s) => !s.fit && s.overflowPx > 0).map((s) => s.slide),
    slides,
  };
  writeFileSync(path.join(outDir, 'capture-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  process.exit(EXIT.OK);
} catch (e) {
  await browser.close().catch(() => {});
  console.error('error: ' + (e.message || e));
  process.exit(EXIT.ERROR);
}
