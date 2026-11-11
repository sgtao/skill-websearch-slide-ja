# Output Validation — 出力検証フロー

生成 HTML の品質を機械的にチェックするためのガイド（レガシートラック用）。
**生成直後に毎回実行する**（v0.8.6〜。SKILL.md Step 5-B の L2）。
ユーザーが「品質を検証して」「出力を確認して」と求めた場合にも実行する。

---

## 検証フローの起動条件

- **レガシートラックで HTML を生成・再生成した直後**（提示の前）に、毎回実行する。
  ユーザーへの確認は不要。所要は数秒
- FAIL があれば、ユーザーに確認せずに該当箇所を直して再実行する（上限 2 回）。
  残った FAIL と WARN は、完了報告の 6（未実施の検証）に項目名で書く
- ユーザーが検証を求めたときは、もう一度実行して結果を報告する（SKILL.md Step 5-B）
- シェルを実行できない環境では実行できない。完了報告の 6 にその旨を書く（`environment.md` §3）
- CLIトラックは対象外（lint が構造の検証を兼ねる）

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
| 10 | 画像形式 | `<img src>` に非画像ファイル（`.pdf` `.docx` `.pptx` `.xlsx` `.zip` `.html` 等）の URL が混入していないか | PASS/FAIL |

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
- 対象は**最初の `<script>` ブロックのみ**（本スキルの生成物は `<script>` を 1 つだけ持つ前提）。
  複数の `<script>` を持つ HTML では 2 つ目以降は検査されない。

---

## スクリプト実行方法

スキルのフォルダを基準に、成果物のパスを渡して実行する。

```bash
bash assets/scripts/validate-output.sh <成果物の保存先>/{テーマ}-slides.html
```

成果物の保存先とシェルの実行手段は環境で異なる（`environment.md` §1）。
シェルを実行できない環境では、このスクリプトは使えない（同 §3）。

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
