/* palette-toggle.js
 * カラーパレット（--accent / --accent-light / --accent-dim）の切り替えと、
 * localStorage による選択状態の永続化。
 * 統合順の正は SKILL.md（参照ファイルガイド／Step 4）を参照。
 *
 * 依存: なし（単独で動作。base-template.html の #palette-dropdown /
 *       [data-palette-opt] ボタン群を参照する）
 *
 * 設計原則:
 *   1. パレット値は許可リスト（PALETTES）で照合し、未知の値は既定値へ
 *      フォールバックする。
 *   2. is-active クラスは [data-palette-opt] を持つ全ボタンに対して
 *      毎回同期する。
 *   3. localStorage キーは「デッキ別」（'slide-palette::' + document.title）。
 *      これにより、MD frontmatter の palette 指定（<html data-palette> 焼き込み）と
 *      保存値の優先順位を「初回表示は frontmatter 優先・このデッキで操作した後は
 *      その保存値優先」にできる。別デッキの選択が流れ込むことも構造的になくなる。
 *      （〜v0.6.x の共有キー 'slide-palette' は新デッキでは参照しない。
 *        旧デッキは旧 JS を内蔵しているため影響なし＝自己完結）
 *   4. 未知値のフォールバック先は「そのデッキの焼き込み値（あれば）→ ocean」。
 *   5. ドロップダウンの開閉は export-menu と同じ規約（hidden 属性・外側クリック/
 *      Escape で閉じる）。
 */

/* ==========================================================================
 * 1. 定数定義
 * ========================================================================== */

const PALETTES = ['ocean', 'forest', 'sunset', 'plum', 'graphite'];

/* デッキ生成時に frontmatter palette があれば <html data-palette="..."> が
 * 焼き込まれている。読み込み時点の値を「このデッキの既定」として捕捉する。 */
const PALETTE_DOC_DEFAULT = (function () {
  const d = document.documentElement.dataset.palette;
  return PALETTES.includes(d) ? d : 'ocean';
})();

/* デッキ別 localStorage キー */
const PALETTE_STORAGE_KEY = 'slide-palette::' + (document.title || 'slides');

/* ==========================================================================
 * 2. パレットの適用
 * ========================================================================== */

/**
 * パレットを適用し、このデッキの localStorage に保存する。
 * 未知の値が渡された場合はデッキ既定（焼き込み値→ocean）にフォールバックする。
 *
 * @param {string} name - パレット名（'ocean' | 'forest' | 'sunset' | 'plum' | 'graphite'）
 */
function setPalette(name) {
  const palette = PALETTES.includes(name) ? name : PALETTE_DOC_DEFAULT;
  document.documentElement.dataset.palette = palette;
  updatePaletteActive(palette);
  try { localStorage.setItem(PALETTE_STORAGE_KEY, palette); } catch (e) {}
}

/**
 * ドロップダウン内の選択中表示（is-active）を同期する。
 *
 * @param {string} palette - 現在適用中のパレット名
 */
function updatePaletteActive(palette) {
  document.querySelectorAll('[data-palette-opt]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.paletteOpt === palette);
  });
}

/* ==========================================================================
 * 3. パレットメニュー（ドロップダウン）のトグル制御
 * ========================================================================== */

function togglePaletteMenu() {
  const dropdown = document.getElementById('palette-dropdown');
  if (dropdown) dropdown.toggleAttribute('hidden');
}

function closePaletteMenu() {
  const dropdown = document.getElementById('palette-dropdown');
  if (dropdown) dropdown.setAttribute('hidden', '');
}

/* ==========================================================================
 * 4. 外側クリック / Escape でメニューを閉じる
 * ========================================================================== */

document.addEventListener('click', (e) => {
  if (!e.target.closest('.palette-menu')) {
    closePaletteMenu();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const dropdown = document.getElementById('palette-dropdown');
    if (dropdown && !dropdown.hasAttribute('hidden')) {
      closePaletteMenu();
      e.preventDefault();
    }
  }
});

/* ==========================================================================
 * 5. 初期化
 * ==========================================================================
 * 優先順位:
 *   (1) このデッキの localStorage 保存値（＝ユーザーがこのデッキで操作済み）
 *   (2) <html data-palette> の焼き込み値（＝MD frontmatter の指定）
 *   (3) ocean（既定）
 */
(function initPalette() {
  try {
    const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (saved && PALETTES.includes(saved)) {
      setPalette(saved);
      return;
    }
  } catch (e) {}
  /* 保存値なし → 焼き込み値（なければ ocean）を表示に反映。
   * ここでは localStorage に書かない（「操作した」ときだけ保存する）。 */
  document.documentElement.dataset.palette = PALETTE_DOC_DEFAULT;
  updatePaletteActive(PALETTE_DOC_DEFAULT);
})();
