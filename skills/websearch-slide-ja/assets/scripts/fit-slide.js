/* fit-slide.js
 * hero モード時に .slide-scaler をブラウザウィンドウに合わせてスケーリングする。
 * window.resize イベントで再計算し、初期表示時にも即時実行する。
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
  if (currentView === 'hero') fitSlide();
});

fitSlide();
