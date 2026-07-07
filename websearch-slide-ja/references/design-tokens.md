# Design Tokens

slide-generator が生成するHTMLに埋め込むフォント・CSS変数・デザイン原則のリファレンス。
Step 4 でHTMLを生成するときに参照すること。

> **変数の正（Single Source of Truth）は `assets/styles/theme-vars.css`。**
> 本ファイルは「変数の役割」の説明のみを行い、具体的なカラーコードは再掲しない。
> 値の追加・変更は theme-vars.css のみで行うこと（v0.5.1: 二重管理を解消）。

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

## CSS変数リファレンス

具体値は `assets/styles/theme-vars.css` を参照する
（`:root` = ライトテーマ / `[data-theme="dark"]` = ダークテーマ）。

| 変数 | 役割 |
|------|------|
| `--bg-body` | ページ全体（スライド外）の背景 |
| `--bg-slide` | スライド面の背景 |
| `--bg-surface` | カード・コードブロック・stat 等の面 |
| `--text-primary` | 本文テキスト |
| `--text-secondary` | 補足・キャプション・注記 |
| `--accent` | アクセントカラー（デッキ全体で 1 色のみ使用） |
| `--accent-light` | アクセントの淡色面（callout 背景など） |
| `--accent-dim` | アクセントの淡色面（バッジ・番号丸など） |
| `--border` | 罫線・枠線 |
| `--nav-bg` / `--nav-text` | コントロールクラスタ・ナビ矢印 |
| `--progress-track` | プログレスバーのトラック |
| `--chart-1` 〜 `--chart-5` | グラフ系列色（`--chart-1` は `--accent` に一致させる） |
| `--chart-grid` / `--chart-label` | グラフの軸・グリッド・ラベル |

**使用ルール**
- コンテンツ側 CSS（各デッキの `<style>` 末尾に追記する見出し・カード等）も、
  色は必ず上記変数経由で指定する（`#` 直書き禁止。テーマ切替に追従させるため）
- SVG（グラフ・図解）内の色指定はクラス経由
  （`chart-series-N` / `chart-line-N` / `diagram-*`）。詳細は
  `chart-generation.md` / `diagram-generation.md` を参照

---

## テーマ切り替え

実装の正は以下のファイル。統合時にそのままコピーする（ここには再掲しない）。

| 要素 | 正となるファイル |
|------|----------------|
| 切替ボタン HTML（`.control-cluster`） | `assets/base-template.html` |
| 切替ロジック + localStorage 永続化 | `assets/scripts/theme-toggle.js` |

---

## デザイン原則

| 項目 | 値 |
|------|----|
| アクセントカラー | 1色のみ（`--accent`） |
| 文字中心 | 箇条書き・番号リスト主体。図表は最小限 |
| 余白 | 広めに取り、可読性優先 |
| スライドサイズ | 960px × 540px 固定（16:9）、`transform: scale()` でフィット |
