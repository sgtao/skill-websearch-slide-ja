/* palette-toggle.js
 * カラーパレット（--accent / --accent-light / --accent-dim）の切り替えと、
 * localStorage による選択状態の永続化。
 * 統合順の正は SKILL.md（参照ファイルガイド／Step 4）を参照。
 *
 * 依存: なし（単独で動作。base-template.html の #palette-dropdown /
 *       [data-palette-opt] ボタン群を参照する）
 *
 * 設計原則（v0.6.1 で明文化）:
 *   1. パレット値は許可リスト（PALETTES）で照合し、未知の値は既定値
 *      （ocean）へフォールバックする。localStorage は同一オリジンで
 *      共有されるため、パレット数が異なる別バージョンの生成デッキで
 *      保存された値が流れ込んでも壊れないようにする（Phase 3 の
 *      パレット増強時の後方互換の要）。
 *   2. is-active クラスは [data-palette-opt] を持つ全ボタンに対して
 *      毎回同期する（トグルの取りこぼしによる二重ハイライトを防ぐ）。
 *   3. localStorage キーは 'slide-palette'（theme-toggle.js の
 *      'slide-theme' / view-toggle.js の 'slide-view' と同じ命名規約）。
 *   4. ドロップダウンの開閉は export-menu と同じ規約：hidden 属性の
 *      付け外しのみ・外側クリックと Escape で閉じる・アニメーションなし。
 */

/* ==========================================================================
 * 1. 定数定義
 * ========================================================================== */

const PALETTES = ['ocean', 'forest', 'sunset', 'plum', 'graphite'];
const PALETTE_STORAGE_KEY = 'slide-palette';
const PALETTE_DEFAULT = 'ocean';

/* ==========================================================================
 * 2. パレットの適用
 * ========================================================================== */

/**
 * パレットを適用し、localStorage に保存する。
 * 未知の値が渡された場合は既定値（ocean）にフォールバックする。
 *
 * @param {string} name - パレット名（'ocean' | 'forest' | 'sunset' | 'plum' | 'graphite'）
 */
function setPalette(name) {
  const palette = PALETTES.includes(name) ? name : PALETTE_DEFAULT;
  document.documentElement.dataset.palette = palette;
  updatePaletteActive(palette);
  try { localStorage.setItem(PALETTE_STORAGE_KEY, palette); } catch (e) {}
}

/**
 * ドロップダウン内の選択中表示（is-active）を同期する。
 * [data-palette-opt] を持つ全ボタンを走査し、選択中のみ is-active を付与。
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

/**
 * パレットメニューを開閉する。
 * #palette-dropdown の hidden 属性をトグルするだけのシンプルな実装。
 */
function togglePaletteMenu() {
  const dropdown = document.getElementById('palette-dropdown');
  if (dropdown) dropdown.toggleAttribute('hidden');
}

/**
 * パレットメニューを強制的に閉じる。
 * メニュー内のボタンをクリックした後の自動クローズに使う。
 */
function closePaletteMenu() {
  const dropdown = document.getElementById('palette-dropdown');
  if (dropdown) dropdown.setAttribute('hidden', '');
}

/* ==========================================================================
 * 4. 外側クリックでメニューを閉じる
 * ========================================================================== */

/**
 * .palette-menu の外側をクリックしたらメニューを閉じる。
 * export-pdf.js の export-menu 用ハンドラとは独立して動作する。
 */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.palette-menu')) {
    closePaletteMenu();
  }
});

/* ==========================================================================
 * 5. Escape キーでメニューを閉じる
 * ========================================================================== */

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
 * 6. 初期化：保存済みパレットを復元
 * ========================================================================== */

/**
 * localStorage の保存値を復元する。未知値ガードは setPalette() 側に集約。
 * 保存値がない場合は data-palette を付与せず :root の既定（ocean 相当）の
 * まま表示し、is-active 表示だけ既定値に同期する。
 */
(function initPalette() {
  try {
    const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (saved) {
      setPalette(saved);
    } else {
      updatePaletteActive(PALETTE_DEFAULT);
    }
  } catch (e) {}
})();
