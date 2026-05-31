# Design Tokens

slide-generator が生成するHTMLに埋め込むCSS変数・フォント・カラーパレットの定義。
Step 4 でHTMLを生成するとき、このファイルの内容を `<style>` に統合すること。

---

## フォント

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| 用途 | ファミリ |
|------|---------|
| 本文・見出し | `'Noto Sans JP', sans-serif` |
| コード・等幅 | `'JetBrains Mono', monospace` |

---

## CSS変数（ライト／ダークテーマ）

```css
/* ライトテーマ（デフォルト） */
:root {
  --bg-body:        #F0F2F5;
  --bg-slide:       #FFFFFF;
  --bg-surface:     #F8F9FA;
  --text-primary:   #1A1A1A;
  --text-secondary: #6B7280;
  --accent:         #2563EB;
  --accent-light:   #EFF6FF;
  --accent-dim:     #DBEAFE;
  --border:         #E5E7EB;
  --nav-bg:         rgba(0,0,0,0.6);
  --nav-text:       #FFFFFF;
  --progress-track: rgba(255,255,255,0.2);
}

/* ダークテーマ */
[data-theme="dark"] {
  --bg-body:        #0D1117;
  --bg-slide:       #161B22;
  --bg-surface:     #21262D;
  --text-primary:   #E6EDF3;
  --text-secondary: #8B949E;
  --accent:         #58A6FF;
  --accent-light:   #1C2D3F;
  --accent-dim:     #1F3A57;
  --border:         #30363D;
  --nav-bg:         rgba(255,255,255,0.1);
  --nav-text:       #E6EDF3;
  --progress-track: rgba(255,255,255,0.1);
}
```

---

## テーマ切り替えボタン

右上固定のトグルボタン。`control-cluster` 内に配置する。

```html
<div class="control-cluster">
  <button id="theme-toggle" onclick="toggleTheme()" title="テーマ切替">🌙</button>
  <button id="view-toggle"  onclick="toggleView()"  title="表示切替">☰</button>
</div>
```

```js
function toggleTheme() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
  document.getElementById('theme-icon').textContent = isDark ? '🌙' : '☀️';
  try { localStorage.setItem('slide-theme', isDark ? 'light' : 'dark'); } catch(e) {}
}
// 初期化：保存済みテーマを復元
try {
  const saved = localStorage.getItem('slide-theme');
  if (saved) {
    document.documentElement.dataset.theme = saved;
    document.getElementById('theme-icon').textContent = saved === 'dark' ? '☀️' : '🌙';
  }
} catch(e) {}
```

---

## デザイン原則

| 項目 | 値 |
|------|----|
| アクセントカラー | 1色のみ（`--accent`） |
| 文字中心 | 箇条書き・番号リスト主体。図表は最小限 |
| 余白 | 広めに取り、可読性優先 |
| スライドサイズ | 960px × 540px 固定（16:9）、`transform: scale()` でフィット |
