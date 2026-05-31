/* theme-toggle.js
 * ライト/ダークテーマの切り替えと、localStorage による状態の永続化。
 */

function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  document.getElementById('theme-icon').textContent = isDark ? '🌙' : '☀️';
  try { localStorage.setItem('slide-theme', isDark ? 'light' : 'dark'); } catch(e) {}
}

// 初期化：保存済みテーマを復元
(function initTheme() {
  try {
    const saved = localStorage.getItem('slide-theme');
    if (saved) {
      document.documentElement.dataset.theme = saved;
      document.getElementById('theme-icon').textContent = saved === 'dark' ? '☀️' : '🌙';
    }
  } catch(e) {}
})();
