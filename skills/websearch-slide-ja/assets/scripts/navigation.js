/* navigation.js
 * スライドのナビゲーション（左右移動・矢印・キーボード・フルスクリーン）。
 * slides / total / cur は base-template.html の <script> 冒頭で宣言すること。
 *
 * 依存: view-toggle.js (currentView)
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

// キーボードショートカット
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); navigate(1); }
  if (e.key === 'ArrowLeft')                    { e.preventDefault(); navigate(-1); }
  if (e.key === 'f' || e.key === 'F')           toggleFullscreen();
  if (e.key === 'v' || e.key === 'V')           toggleView(); // view-toggle.js
});

// 初期状態を適用
update();
