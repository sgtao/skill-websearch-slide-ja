/* navigation.js
 * スライドのナビゲーション（左右移動・矢印・キーボード・フルスクリーン）。
 * slides / total / cur は base-template.html の <script> 冒頭で宣言すること。
 *
 * 依存:
 *   - view-toggle.js (currentView, toggleView)
 *   - export-pdf.js  (exportPDF)             ※ Phase 3
 *   - export-png.js  (exportSinglePNG, exportAllPNG) ※ Phase 3
 *
 * Phase 3 改修:
 *   - キーボードショートカットに P / Shift+S / Shift+P を追加
 *   - Ctrl+Shift+P（DevTools コマンドパレット）との衝突を回避
 */

function navigate(dir) {
  if (currentView === 'list') return; // 一覧モード中は無効
  slides[cur].classList.remove('active');
  cur = Math.max(0, Math.min(total - 1, cur + dir));
  slides[cur].classList.add('active');
  update();
}

function update() {
  // プログレスバー
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = ((cur + 1) / total * 100) + '%';
  // スライド番号
  const counter = document.getElementById('slide-counter');
  if (counter) counter.textContent = `${cur + 1} / ${total}`;
  updateArrows();
}

function updateArrows() {
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  if (prev) prev.hidden = (cur === 0);
  if (next) next.hidden = (cur === total - 1);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

/* ==========================================================================
 * キーボードショートカット
 * ==========================================================================
 * 既存:
 *   ← / Space → 次へ
 *   ←         → 前へ
 *   F         → フルスクリーン切替
 *   V         → ビュー切替（hero ⇄ list）
 *
 * Phase 3 追加:
 *   P         → PDF 印刷ダイアログ起動（exportPDF）
 *   Shift+S   → 現在スライドの PNG ダウンロード（exportSinglePNG）
 *   Shift+P   → 全スライドの ZIP ダウンロード（exportAllPNG）
 *
 * 注意:
 *   - Ctrl/Cmd 同時押しは除外（ブラウザ標準の Ctrl+P / Ctrl+Shift+P を奪わない）
 *   - 入力中（input/textarea/contenteditable）は無視
 * ========================================================================== */
document.addEventListener('keydown', e => {
  // 入力フィールドではショートカットを無効化
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
    return;
  }

  // Ctrl / Cmd 押下時はブラウザ標準動作を尊重（ショートカット全停止）
  if (e.ctrlKey || e.metaKey) return;

  // ─── 既存のショートカット ───
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); navigate(1); return; }
  if (e.key === 'ArrowLeft')                    { e.preventDefault(); navigate(-1); return; }
  if (e.key === 'f' || e.key === 'F')           { toggleFullscreen(); return; }
  if (e.key === 'v' || e.key === 'V')           { toggleView(); return; }

  // ─── Phase 3: エクスポート系ショートカット ───
  // Shift 系を先に判定する（Shift+P の e.key は 'P'、単独 P の e.key は 'p'）

  // Shift+P → 全スライド ZIP
  if (e.shiftKey && e.key === 'P') {
    e.preventDefault();
    if (typeof exportAllPNG === 'function') exportAllPNG();
    return;
  }

  // Shift+S → 現在スライド PNG
  if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
    e.preventDefault();
    if (typeof exportSinglePNG === 'function') exportSinglePNG();
    return;
  }

  // P 単独 → PDF 印刷
  if (!e.shiftKey && (e.key === 'p' || e.key === 'P')) {
    e.preventDefault();
    if (typeof exportPDF === 'function') exportPDF();
    return;
  }
});

// 初期状態を適用
update();
