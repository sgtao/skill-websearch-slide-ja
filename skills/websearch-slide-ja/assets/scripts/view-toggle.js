/* view-toggle.js
 * hero モードと list モードの切り替え。
 * hero: 1スライドずつ中央表示（デフォルト）
 * list: 全スライドを縦スクロールで表示、クリックで hero に戻る
 *
 * 依存: fit-slide.js (fitSlide), navigation.js (cur, update)
 */

let currentView = 'hero'; // 'hero' | 'list'

function toggleView() {
  currentView = (currentView === 'hero') ? 'list' : 'hero';
  applyView();
  try { localStorage.setItem('slide-view', currentView); } catch(e) {}
}

function applyView() {
  // html と body の両方に data-view を設定（overflow制御のため）
  document.documentElement.dataset.view = currentView;
  document.body.dataset.view = currentView;
  document.getElementById('view-toggle').textContent = (currentView === 'hero') ? '☰' : '▭';

  if (currentView === 'hero') {
    fitSlide();
  } else {
    scaleListSlides();
  }
}

/* 一覧モード時の内部コンテンツスケーリング */
function scaleListSlides() {
  // DOMレイアウト確定後に clientWidth を取得（aspect-ratio の計算待ち）
  requestAnimationFrame(() => {
    document.querySelectorAll('.slide').forEach(slide => {
      const inner = slide.querySelector('.slide-inner');
      if (!inner) return;
      const ratio = slide.clientWidth / 960;
      inner.style.transform = `scale(${ratio})`;
    });
  });
}

window.addEventListener('resize', () => {
  if (currentView === 'list') scaleListSlides();
});

// 一覧モード: クリックでヒーローに戻り、そのスライドを表示
document.querySelectorAll('.slide').forEach((slide, i) => {
  slide.dataset.num = `${i + 1} / ${document.querySelectorAll('.slide').length}`;
  slide.addEventListener('click', () => {
    if (currentView !== 'list') return;
    cur = i;
    currentView = 'hero';
    applyView();
    update(); // navigation.js の update() を呼ぶ
  });
});

// 初期化：保存済みビューを復元
(function initView() {
  try {
    const saved = localStorage.getItem('slide-view');
    if (saved === 'list') { currentView = 'list'; applyView(); }
  } catch(e) {}
})();
