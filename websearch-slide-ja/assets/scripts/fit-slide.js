/* fit-slide.js
 * hero モード時に .slide-scaler をブラウザウィンドウに合わせてスケーリングする。
 * window.resize イベントで再計算し、初期表示時にも即時実行する。
 *
 * v0.5.1: resize リスナーの currentView 参照に typeof ガードを追加。
 *   currentView は view-toggle.js（統合順 3 番目）で宣言されるため、
 *   view-toggle.js が未統合・統合失敗の場合に ReferenceError となる。
 *   navigation.js の export 系ショートカット（typeof exportPDF === 'function'）
 *   と同じ防御規約に統一し、部分統合でも壊れないようにする。
 */
function fitSlide() {
  const scaler = document.querySelector('.slide-scaler');
  if (!scaler) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const ratio = Math.min(vw / 960, vh / 540) * 0.92;
  scaler.style.transform = `translate(-50%, -50%) scale(${ratio})`;
}
window.addEventListener('resize', () => {
  // currentView 未宣言（view-toggle.js 未統合）時は hero 相当として扱う
  if (typeof currentView === 'undefined' || currentView === 'hero') fitSlide();
});
fitSlide();
