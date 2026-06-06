# Output Validation — 出力検証フロー

生成 HTML の品質を機械的にチェックするためのガイド。
ユーザーが「品質を検証して」「出力を確認して」と求めた場合にこのフローを実行する。

---

## 検証フローの起動条件

以下のいずれかに該当する場合に実行する：

1. ユーザーが明示的に検証を要求した
2. 生成 HTML の枚数が 10 枚以上（複雑な出力）
3. グラフ＋画像の両方を含む出力

---

## 検証項目一覧

| # | カテゴリ | チェック内容 | 判定 |
|---|---------|-------------|------|
| 1 | HTML 構文 | DOCTYPE / html / head / body の存在 | PASS/FAIL |
| 2 | スライド枚数 | 3〜12 枚の範囲内か | PASS/FAIL/WARN |
| 3 | 必須要素 | theme-toggle / view-toggle / nav-arrow / progress-bar / slide-counter / export-menu | PASS/FAIL |
| 4 | 必須関数 | fitSlide / toggleTheme / toggleView / navigate / exportPDF / exportSinglePNG | PASS/FAIL |
| 5 | 出典リンク | 最終スライドに `<a href=` が存在するか | PASS/WARN |
| 6 | CSS/JSリーク | `<style>`/`<script>` 外にCSS定義・JS定義が漏れていないか | PASS/FAIL |
| 7 | テンプレート残留 | `{TITLE}` `{SOURCE}` 等の未置換プレースホルダ | PASS/FAIL |
| 8 | 禁止ライブラリ | Chart.js / D3.js / ECharts / `<canvas>` の参照 | PASS/FAIL |

---

## スクリプト実行方法

Claude Code 環境・ローカル環境での実行:

```bash
bash scripts/validate-output.sh path/to/output.html
```

Claude.ai 環境での実行（bash_tool 経由）:

```bash
bash scripts/validate-output.sh /mnt/user-data/outputs/{テーマ}-slides.html
```

---

## 判定基準

- **FAIL が 0 件** → 品質合格（PASS）
- **FAIL が 1 件以上** → 該当箇所を修正して再検証
- **WARN のみ** → ユーザーに通知の上で許容可

---

## CSS/JS リーク検出パターン

`<style>` / `<script>` タグ内を除外した本文テキストに対し、以下のパターンを検索する。

### CSS リークパターン

| パターン | 検出例 |
|---------|-------|
| `[data-theme=` | `[data-theme="dark"] style is handled by CSS vars` |
| `:root {` | CSS 変数定義が本文に漏れたケース |
| `.slide-scaler {` | CSS ルールが本文に漏れたケース |
| `.chart-series-` | チャート CSS が本文に漏れたケース |
| `@media print` | 印刷 CSS が本文に漏れたケース |

### JS リークパターン

| パターン | 検出例 |
|---------|-------|
| `function xxx(` | JS 関数定義が本文に漏れたケース |

※ `onclick="..."` 属性内は除外（正常な HTML 属性）

### テンプレートプレースホルダ残留

| パターン | 所在 |
|---------|------|
| `{TITLE}` | グラフタイトル |
| `{SOURCE}` | グラフ出典 |
| `{AXIS_X_LABEL}` / `{AXIS_Y_LABEL}` | 軸ラベル |
| `{Y_MAX}` / `{Y_MIN}` | Y 軸目盛り |
| `{P1_X}` / `{P1_Y}` | データ点座標 |
| `{SERIES_1_NAME}` | 凡例名 |
| `{PCT_1}` | ドーナツの構成比 |
| `{CENTER_LABEL}` / `{CENTER_VALUE}` | ドーナツ中央テキスト |

---

## slide-fit 関連チェック

一覧テーブルスライドに `slide-fit` クラスが正しく付与されているかを確認する。

| チェック | 対象 |
|---------|------|
| 10 行超テーブルに `slide-fit` あり | `<section class="slide slide-fit">` |
| 通常スライドに `slide-fit` なし | タイトル・概要・メインには付与しない |
| list モードで全件表示されるか | 目視確認（hero では下部切れが仕様） |
