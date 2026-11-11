# legacy-build — レガシートラックの生成手順（CLI が使えないときだけ）

> `workflows/build.md`「Step 2.5」でレガシートラックになったときだけ読む。
> CLIトラックでは読まない。変換以外の手順（lint 以外の判定・Step 5 の出力と自己検証）は
> `workflows/build.md` のまま。

## 参照ファイル（レガシートラック）

| ファイル | 読むタイミング |
|---------|--------------|
| `references/slide-layouts.md` | Step 3 構成設計、[レガシー] Step 4 各スライド作成時 |
| `references/markdown-format.md` | Step 2.5（`--print-spec`非対応時の実効仕様）・HTML→MD逆抽出時：スライドMDの仕様。[レガシー]トラックでは必読 |
| `references/design-tokens.md` | [レガシー] Step 4：CSS変数・カラー埋め込み |
| `references/image-embedding.md` | Step 2 画像収集、[レガシー] Step 4 画像埋め込み |
| `references/chart-generation.md` | Step 3-0 グラフ化判定、[レガシー] Step 4 グラフ埋め込み |
| `references/diagram-generation.md` | Step 3-0 図解判定、[レガシー] Step 4 図解（インラインSVG）埋め込み |
| `references/export-recipes.md` | [レガシー] Step 4：エクスポート機能（PDF/PNG/ZIP）組み込み |
| `references/output-validation.md` | [レガシー] Step 5：品質検証・修正確認 |
| `assets/base-template.html` | [レガシー] Step 4 開始時に必ずコピーして土台にする |
| `assets/styles/*.css` | [レガシー] 全 8 ファイルを統合（theme-vars → slide-core → nav-controls → figure → chart → diagram → list-view → print） |
| `assets/scripts/*.js` | [レガシー] 全 7 ファイルを統合（fit-slide → theme-toggle → view-toggle → navigation → export-pdf → export-png → palette-toggle） |
| `assets/fallback-image.html` | [レガシー] 画像埋め込み時に `createFallback()` をコピー |
| `assets/chart-templates/*.svg` | [レガシー] グラフ埋め込み時に該当テンプレートをコピー |
| `assets/scripts/validate-output.sh` | [レガシー] Step 5-B：生成 HTML の機械的チェック。生成直後に毎回実行する（CLIトラックはlintで代替） |

> **CSS/JS 統合順の Single Source of Truth（SSoT）は本表と下の生成手順。**
> SKILL.md・他の workflows・assets/ 配下の各 CSS/JS のヘッダーコメント・他の references には
> 統合順を再掲しない。

### 生成手順 [レガシートラックのみ]

**CLIトラックの場合は以下を一切行わない**（Step 4-BのCLIコマンド1回で完結する）。
レガシートラックの場合のみ、以下の手順でLLMが直接HTMLを組み立てる。

1. `assets/base-template.html` をコピーして土台にする
2. `assets/styles/` の **8 ファイル**を `<style>` に統合（`theme-vars → slide-core → nav-controls → figure → chart → diagram → list-view → print` の順、print.css は必ず最後）
3. `references/slide-layouts.md` を参照し、各スライドを `<section class="slide">` で記述
  - 10 行超のテーブル・20 項目超の一覧を含むスライドには `class="slide slide-fit"` を付与
4. **画像埋め込み**（ビジュアル方針「グラフ作成＋画像あり」のときのみ）
  - `references/image-embedding.md` の判断フローを実行
  - 1 件でも埋め込む場合、`assets/fallback-image.html` の `createFallback()` を `<script>` の先頭にコピー
  - 全 `<img>` に `onerror` でフォールバックを設定
  - HTML パターンは `image-embedding.md` を参照
5. **グラフ埋め込み**（Step 3-0 で採用されたときのみ）
  - 「[グラフ採用リスト]」の対象スライドに、採用テンプレートの SVG をコピー
  - プレースホルダー `{TITLE}` `{SOURCE}` データ値を実値に置換
  - `<div class="slide-chart">` でラップして配置
  - HTML パターンと座標計算は `chart-generation.md` を参照
  - 制約: SVG はインライン展開のみ。色は `chart-series-N` / `chart-line-N` クラス経由（ハードコード禁止）。外部グラフライブラリ禁止
6. **図解埋め込み**（Step 3-0 で図解採用のときのみ）
  - `references/diagram-generation.md` の座標テーブルに従い、`<svg class="diagram-svg" viewBox="0 0 960 480">` を `<div class="slide-diagram">` でラップして配置
  - パターン（横フロー / 縦レイヤー / サイクル）とノード数を選び、**既定座標にテキストを流し込む**（座標計算はしない）
  - 制約: SVG はインライン展開のみ。色は `diagram-*` クラス経由（`fill="#"` 禁止）。外部 `href` / `xlink:href` 禁止（完全自己完結）。長いラベルは `<tspan>` で手動 2 行に分割
  - グラフ・図解・画像は同一スライドに共存させない
7. `assets/scripts/` の **7 ファイル**を `<script>` に統合（`fit-slide → theme-toggle → view-toggle → navigation → export-pdf → export-png → palette-toggle` の順）
8. `.control-cluster` 内に `.export-menu` ブロックが含まれることを確認（base-template に標準で含まれている）。キーボードショートカット（P / Shift+S / Shift+P）は navigation.js 改修版に組み込み済み

### 機能チェック表 [レガシートラックのみ]

CLIトラックでは以下がmdss-convert側で構造的に保証されるため、チェック不要。

| 機能 | 実装方法 |
|------|---------|
| 16:9 固定 + スケーリング | `.slide-scaler` + `fitSlide()` |
| ライト/ダーク切替 | `[data-theme="dark"]` + `toggleTheme()` |
| hero ⇄ list 切替 | `[data-view="list"]` + `toggleView()` |
| 左右ナビ矢印 | `.nav-arrow` + `navigate()` |
| プログレスバー・番号 | `#progress-bar` + `#slide-counter` |
| PDF 印刷出力 | `exportPDF()` + `print.css` の `@media print` |
| 単一 PNG 出力 | `exportSinglePNG()` + html2canvas |
| 全 ZIP 出力 | `exportAllPNG()` + JSZip |
| エクスポートメニュー | `.export-menu` + `toggleExportMenu()` |
| パレット切替（5 色） | `[data-palette]` + `setPalette()` + localStorage 永続化 |
| Feature ショーケース（左右2カラム） | `.feature-showcase` + `.feature-left` / `.feature-right` |
| Before/After 比較（ドーナツ×2） | `.slide-with-description` + `.slide-chart.comparison` |
| 一覧テーブル高さ可変 | `.slide-fit` + `list-view.css` + `print.css` |
| キーボード操作 | `←→` 移動 / `Space` 次へ / `F` フルスクリーン / `V` ビュー切替 / `P` PDF / `Shift+S` PNG / `Shift+P` ZIP |


---

## クオリティチェックリスト（C〜J）

出力前に以下の観点で確認する。A は `workflows/create.md`、B は `workflows/build.md`。

### C. レイアウト・テーマ
- [ ] 960×540px（16:9）固定で `transform: scale()` フィットが動作するか
- [ ] ライト／ダーク切替が動作するか
- [ ] 🎨 パレット切替が 5 色すべてで動作し、リロード後も選択が保持されるか
- [ ] hero／list 切替が動作し、list でクリックすると hero に戻るか
- [ ] 日本語フォントが正しく読み込まれているか

### D. ナビゲーション
- [ ] 左右ナビ矢印が最初・最後で非表示になるか
- [ ] スライド番号・プログレスバーが正しく動作するか
- [ ] キーボードナビゲーション（←→ / Space / F / V）が動作するか

### E. 画像
- [ ] 全画像に出典リンク（figcaption）が明記されているか
- [ ] `createFallback()` が `<script>` に含まれ、全 `<img>` の `onerror` に設定されているか
- [ ] 「画像なし」「テキストのみ」「会話のみ」選択時に画像が埋め込まれていないか

### F. グラフ
- [ ] グラフに軸ラベル（X / Y）と出典が SVG 内に明記されているか
- [ ] 色が `var(--chart-N)` / `var(--accent)` 経由でライト・ダーク両対応か（`fill="#..."` ハードコード禁止）
- [ ] 数値ラベルとグラフ要素（バー・線・セクター）の両方が存在するか
- [ ] 1 スライドあたりグラフ最大 1 つ（`comparison-chart` を除く）、画像とグラフは同一スライドに共存していないか
- [ ] 「テキストのみ」「会話のみ」選択時にグラフが生成されていないか
- [ ] Chart.js・D3.js 等の外部ライブラリ・`<canvas>`・CDN script を使用していないか

### G. エクスポート
- [ ] 📥メニューがコントロールクラスタの右端に表示されるか
- [ ] `P` で印刷ダイアログが開き、1 ページ = 1 スライドで PDF 保存できるか（hero 起点でも崩れないか）
- [ ] `Shift+S` で現在スライドの PNG がダウンロードできるか
- [ ] `Shift+P` で全スライド ZIP がダウンロードできるか
- [ ] CORS エラー / ネット切断時に alert でエラー通知が出るか
- [ ] 印刷時にダークテーマがライトに上書きされ、コントロール類が非表示になるか

### H. コンテンツ漏洩チェック [レガシートラックのみ。CLIトラックは型システムにより原理的に発生しないため対象外]
- [ ] `<section>` / `<div class="slide-inner">` の直下に CSS 定義テキスト（`[data-theme="dark"]`、`var(--`、`:root {` 等）が表示されていないか
- [ ] JavaScript コード断片（`function `、`const `、`document.`）がスライドの可視テキストとして漏れていないか
- [ ] SVG テンプレートのプレースホルダー（`{TITLE}`、`{SOURCE}`、`{AXIS_X_LABEL}` 等）が未置換のまま残っていないか

### I. オーバーフロー対策
- [ ] 10 行超のテーブルや 20 項目超の一覧を含むスライドに `slide-fit` クラスが付与されているか
- [ ] `slide-fit` が通常の概要・メインコンテンツスライドに誤って付与されていないか

### J. JS 構文の健全性 [レガシートラックのみ。CLIトラックはコンパイル済みJSを配布するため対象外]
- [ ] `<script>` 内にエスケープシーケンス（`\n` 等）を含むコードを転記する際、実際の改行文字に化けていないか
- [ ] JS/CSS ソースをテキストとして手で書き写さず、ファイル読み込み＋機械的な文字列結合で扱っているか
- [ ] 生成直後に `validate-output.sh` を実行し（Step 5-B の L2）、JS 構文チェック（項目4）が PASS するか（H節のリークチェックとは別に、構文そのものが壊れていないかを確認する）
