# Output Validation — 出力検証フロー

生成 HTML の品質を機械的にチェックするためのガイド。
ユーザーが「品質を検証して」「出力を確認して」と求めた場合にこのフローを実行する。

---

## 検証フローの起動条件

ユーザーが明示的に検証を要求した場合に**のみ**実行する
（SKILL.md Step 5-B と同一の規則。デフォルトでは実行しない）。

なお、生成 HTML が 10 枚以上・グラフ＋画像の両方を含む等の複雑な出力では、
出力提示時に「検証しますか？」と**提案してよい**（実行はユーザーの同意後）。

---

## 検証項目一覧

| # | カテゴリ | チェック内容 | 判定 |
|---|---------|-------------|------|
| 1 | HTML 構文 | DOCTYPE / html / head / body の存在 | PASS/FAIL |
| 2 | スライド枚数 | 3〜12 枚の範囲内か | PASS/FAIL/WARN |
| 3 | 必須要素 | theme-toggle / view-toggle / nav-arrow / progress-bar / slide-counter / export-menu / palette-menu | PASS/FAIL |
| 4 | JS 構文 | `<script>` 全体が `node --check` でパース可能か | PASS/FAIL/WARN |
| 5 | 必須関数 | fitSlide / toggleTheme / toggleView / navigate / exportPDF / exportSinglePNG / setPalette | PASS/FAIL |
| 6 | 出典リンク | 最終スライドに `<a href=` が存在するか | PASS/WARN |
| 7 | CSS/JSリーク | `<style>`/`<script>` 外にCSS定義・JS定義が漏れていないか | PASS/FAIL |
| 8 | テンプレート残留 | `{TITLE}` `{SOURCE}` 等の未置換プレースホルダ | PASS/FAIL |
| 9 | 禁止ライブラリ | Chart.js / D3.js / ECharts / mermaid.js / `<canvas>` の参照 | PASS/FAIL |

### JS 構文チェック（項目4）について

`node --check` で `<script>` ブロック全体をパースし、構文エラーの有無を確認する。
**項目5（必須関数）は `grep` による文字列存在チェックのため、関数定義の文字列自体があっても
それより前で構文エラーが起きて `<script>` 全体の実行が失敗しているケースを検出できない。**
項目4はこの盲点を埋めるためのゲートであり、必ず項目5より前に実行する。

- 実例: `showExportError()` 内の `].join('\n');` の `\n`（エスケープシーケンス）が
  実際の改行文字に置き換わり、シングルクォート文字列が閉じられず構文エラーとなった。
  この1箇所だけで `<script>` 内の全関数（`toggleTheme` 等）が定義されず、
  生成された HTML 上のボタンがすべて無反応になった。
- `node` が使えない環境では WARN でスキップする（Errors には数えない）。

---

## スクリプト実行方法

Claude Code 環境・ローカル環境での実行:

```bash
bash assets/scripts/validate-output.sh path/to/output.html
```

Claude.ai 環境での実行（bash_tool 経由）:

```bash
bash assets/scripts/validate-output.sh /mnt/user-data/outputs/{テーマ}-slides.html
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
