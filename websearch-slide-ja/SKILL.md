---
name: websearch-slide-ja
description: >
  GitHubやX（Twitter）などのネット上の公開情報を Web検索で収集し、
  スライド形式のHTMLページとして生成するスキル。
  「スライドを作って」「プレゼン資料にして」「HTMLスライドで説明して」
  「〇〇についてスライドにまとめて」「GitHubのトレンドをスライドで」
  「Xで話題の〇〇をスライドに」などのフレーズが含まれる場合は必ずこのスキルを使う。
  生成HTMLは PDF（印刷経由）と PNG（個別 / zip）のエクスポートに対応。
---

# Slide Generator Skill with Web Search (Japanese)

ネット上の情報を調査・収集し、スライド形式のHTMLページを生成するスキル。

## ワークフロー概要

```
0.   スライド作成の確認（Yes / No）
1-A. 情報ソース確認（会話のみ / ハイブリッド / Web検索メイン）
1-B. テーマ・ロール確認
1-C. 検索フレーズ提案＋ビジュアル方針確認
2.   Web検索・情報収集
3-0. グラフ化判定
3.   スライド構成の設計
4.   HTMLスライド生成（エクスポート機能込み）
5.   ファイル出力・提示・検証
```

## 参照ファイルガイド

各ステップで該当ファイルを必ず読むこと。

| ファイル | 読むタイミング |
|---------|--------------|
| `references/source-selection.md` | Step 1-A：情報ソース判定・下限チェック |
| `references/role-signals.md` | Step 1-B 開始時に**必ず**読む |
| `references/search-patterns/index.md` | ロールが「汎用」のとき |
| `references/search-patterns/tech.md` | 技術系（エンジニア / EM / DS / デザイナー） |
| `references/search-patterns/business.md` | ビジネス系（PM / 経営 / マーケ / 営業 / 財務 / コンサル / オペレーション / 人事） |
| `references/search-patterns/specialist.md` | 専門職（法務 / 研究者 / 医療 / 教育者 / 学生 / ライター） |
| `references/slide-layouts.md` | Step 3 構成設計、Step 4 各スライド作成時 |
| `references/design-tokens.md` | Step 4：CSS変数・カラー埋め込み |
| `references/image-embedding.md` | Step 2 画像収集、Step 4 画像埋め込み |
| `references/chart-generation.md` | Step 3-0 グラフ化判定、Step 4 グラフ埋め込み |
| `references/export-recipes.md` | Step 4：エクスポート機能（PDF/PNG/ZIP）組み込み |
| `references/output-validation.md` | Step 5：品質検証・修正確認 |
| `references/example-outputs/README.md` | Step 3 構成設計：テーマ傾向が近いお手本の構成スケルトンを参照（実HTMLは原則開かない／トークン肥大防止） |
| `assets/base-template.html` | Step 4 開始時に必ずコピーして土台にする |
| `assets/styles/*.css` | 全 7 ファイルを統合（theme-vars → slide-core → nav-controls → figure → chart → list-view → print） |
| `assets/scripts/*.js` | 全 6 ファイルを統合（fit-slide → theme-toggle → view-toggle → navigation → export-pdf → export-png） |
| `assets/fallback-image.html` | 画像埋め込み時に `createFallback()` をコピー |
| `assets/chart-templates/*.svg` | グラフ埋め込み時に該当テンプレートをコピー |
| `scripts/validate-output.sh` | Step 5：生成 HTML の機械的チェック |

## ステップ別スキップ条件（早見表）

| ビジュアル方針 / モード | Step 2 画像収集 | Step 2 数値抽出 | Step 3-0 グラフ化 |
|---|---|---|---|
| Web検索あり × グラフ作成＋画像あり | 実行 | 実行 | 実行 |
| Web検索あり × グラフ作成＋画像なし | スキップ | 実行 | 実行 |
| Web検索あり × テキストのみ | スキップ | スキップ | スキップ |
| 会話のみモード（3枚ミニ含む） | スキップ | 原則スキップ | 原則スキップ |

---

## Step 0: スライド作成の確認

スキルが呼び出された時点で、最初に `ask_user_input_v0` で作成意思を確認する。

```
質問: HTMLベースのスライド資料を作成しますか？
選択肢:
  - 「はい、作成する」
  - 「いいえ、やめる」
```

- **「はい、作成する」** → Step 1-A へ進む
- **「いいえ、やめる」** → 「了解しました。」と回答してスキルの処理を終了する（検索・生成は一切行わない）

---

## Step 1-A: 情報ソース確認

`references/source-selection.md` を参照し、`ask_user_input_v0` で 3 択を提示する。

```
質問: スライド作成にどの情報を使いますか？
選択肢:
  - 「会話の内容だけでOK」
  - 「Web検索も追加する（会話 ＋ 検索）」
  - 「Web検索メインで（検索中心）」
```

### 「会話の内容だけでOK」選択時の下限チェック

`source-selection.md` の 4 観点（トピック数・具体性・分量・構造化可能性）をチェック。

- **不足なし**（2観点未満が該当）→ 通常モード（6〜10枚）で Step 1-B へ
- **不足あり**（2観点以上が該当）→ 再確認の 3 択を提示：
  - 「Web検索で補う」→ ハイブリッドモード → Step 1-C へ
  - 「3枚でOK」→ 3 枚ミニモード確定 → Step 1-B へ
  - 「作成を中止する」→ 終了メッセージを出して処理を止める（検索・生成は一切行わない）

その他の選択時:
- 「Web検索も追加する」→ ハイブリッドモード → Step 1-B へ
- 「Web検索メインで」→ Web メインモード → Step 1-B へ

---

## Step 1-B: テーマ・ロール確認

会話履歴から **テーマ / 対象読者 / ユーザーロール** を抽出。不足分のみヒアリングする。
スライド枚数は選択モードに従う（3 枚 or 6〜10 枚）。

**ロール推定の手順**

1. `references/role-signals.md` を読み込む（必ず実施）
2. 会話履歴のシグナルワードを照合し、2 個以上ヒットしたカテゴリを採用
3. 推定できた場合はヒアリングをスキップして Step 1-C へ
4. 推定できなかった場合は `role-signals.md` のヒアリング指針に従って確認

---

## Step 1-C: 検索フレーズ提案＋ビジュアル方針確認

> **スキップ条件**: Step 1-A で「会話のみ」かつ「3 枚でOK」確定時はスキップして Step 3 へ。

### 手順

1. `role-signals.md` の「参照ファイル」列で該当の `search-patterns/[カテゴリ].md` を読む（汎用なら `index.md`）
2. ロール × テーマで **デフォルト 3 個**の検索フレーズ候補を生成（広範テーマは最大 5 個まで）
3. ユーザーに提示し、修正・追加・削除を受け付ける

**提示例（テーマ「Claude Code」、ロール「エンジニア」）**

```
以下の検索フレーズで情報を集めようと思います。修正・追加はありますか？
1. claude code skill github stars
2. claude code tips tricks 2025
3. claude code 使い方 まとめ site:zenn.dev
```

4. 同時に `ask_user_input_v0` でビジュアル方針を確認：

```
質問: スライドにグラフや画像を含めますか？
選択肢:
  - 「グラフ作成＋画像あり（Web 検索で取得）」
  - 「グラフ作成＋画像なし」
  - 「テキストのみでOK」
```

5. 確定したフレーズとビジュアル方針を記録して Step 2 へ

---

## Step 2: Web検索・情報収集

> **スキップ条件**: Step 1-A で「会話のみ」+ Step 1-C スキップ時は実行しない。会話履歴を構造化して Step 3 へ。
> **ハイブリッドモード**: 会話履歴を一次情報として先に構造化し、不足分のみ Web 検索で補完する。

### 検索クエリと回数

- Step 1-C で確定したフレーズをそのまま使う（**デフォルト 3 回**、最大 5 回）
- 職種別の追加クエリは `search-patterns/[カテゴリ].md` を参照
- 2024〜2026 年の情報を優先。GitHub スター数・X のいいね数を信頼性指標として活用

### 画像 URL の収集

ビジュアル方針が「グラフ作成＋画像あり」のときのみ実行。`references/image-embedding.md` を参照。

1. テーマ関連クエリで `image_search` を **1 回**だけ実行（`web_search` では画像 URL は取れない）
2. 返された URL を `image-embedding.md` の判断基準でフィルタ
3. 1 スライドにつき最大 1 件、結果を以下の形式で必ず出力（0 件でも「なし」と明記）：

```
[画像収集リスト]
スライド 3: 画像URL ... / 出典ページ ... / 説明「...」
スライド 4: なし（適切なURLが見つからなかったため）
```

### 数値データの抽出

ビジュアル方針が「テキストのみ」以外のとき実行。`chart-generation.md` の「データ抽出ルール」に従い、
**数値・単位・出典・取得時点が揃った候補のみ** を「[グラフデータ候補]」形式で記録する。
1 つでも欠ければ抽出しない（推測値の混入禁止）。

> 会話のみモード（3 枚ミニ含む）は原則スキップ。会話内に出典まで明示されている場合のみ例外的に許可。

---

## Step 3-0: グラフ化判定

> **スキップ条件**: ビジュアル方針が「テキストのみ」のとき、または「[グラフデータ候補]」が 0 件のとき。

### 手順

1. `references/chart-generation.md` を読み込む
2. 各候補について 4 条件（数値性 / 3 点以上 / 単位・出典 / 種別判定可能性）を判定。**全 YES のみ採用**
3. 採用候補は「データ形状 → グラフ種別マッピング」でテンプレートを決定（bar / line / donut / scatter）
4. 採用結果を以下の形式で記録：

```
[グラフ採用リスト]
スライド N: テンプレート bar-chart.svg / タイトル「...」 / 系列 1 / データ点 5
```

**制約**: 1 スライドあたりグラフは最大 1 つ。画像とグラフは同一スライドに共存させない。

---

## Step 3: スライド構成の設計

`references/slide-layouts.md` を参照して構成を決める。

### テーマ傾向 → お手本対応表

構成設計時、テーマ傾向に近い完成例の **構成スケルトンのみ** を
`references/example-outputs/README.md` から参照する（実HTMLはロードしない／トークン肥大防止）。

| テーマ傾向 | 参照する例 | 主に学べる点 |
|---|---|---|
| 動向・提言の紹介（データ＋写真で説得） | example-trend-fullpath | グラフ＋画像(onerror)＋出典のフルパス構成・stat |
| 製品・ツールの比較 | example-product-comparison | グラフ2本＋`slide-fit`比較テーブル＋2×2カード |
| 手順・チュートリアル | example-tutorial | 1スライド1ステップ＋コードブロック（コード中心） |
| ビジネス提案・意思決定 | example-business-pitch | 課題→施策→効果→依頼の論理＋KPIグラフ＋`callout` |

| モード | 枚数 | 使用条件 |
|--------|------|---------|
| 通常モード | 6〜10 枚 | Web検索あり、またはハイブリッドで情報量十分 |
| 3枚ミニモード | 3 枚固定 | 「会話のみ」かつ情報量不足で「3 枚でOK」選択時 |

**通常モードの構成フレーム**

```
Slide 1     : タイトル（テーマ・出典バッジ）
Slide 2     : 概要・背景（数字・トレンドで裏付け）
Slide 3〜N-2 : メインコンテンツ
Slide N-1   : まとめ（3〜5 個のキーポイント）
Slide N     : 参考リンク・出典 URL 一覧
```

**3 枚ミニモード**は `slide-layouts.md` の「3 枚ミニスライド構成」を参照（サマリ / 本文 / まとめ）。

> グラフ採用がある場合、Step 3-0 のリストから配置スライドを 1 枚決める（概要・背景またはメインコンテンツ中盤が適切）。

---

## Step 4: HTMLスライド生成

### デザイン原則

- フォント: Noto Sans JP（本文）+ JetBrains Mono（コード）
- アクセントカラー 1 色のみ（`--accent`）
- 文字中心・広い余白・箇条書き主体
- スライドサイズ: 960×540px 固定（16:9）、`transform: scale()` でフィット
- 詳細は `references/design-tokens.md`

### エクスポート機能

生成 HTML は以下 3 種に対応。詳細は `references/export-recipes.md`。

| 方式 | 起動 | 依存 | 自己完結性 |
|------|------|------|-----------|
| PDF（印刷経由） | `P` キー / 📥メニュー | 標準 `window.print()` | ◎ オフライン可 |
| 単一 PNG | `Shift+S` / 📥 | html2canvas（CDN 動的ロード） | △ ネット必須 |
| 全スライド ZIP | `Shift+P` / 📥 | html2canvas + JSZip（CDN 動的ロード） | △ ネット必須 |

閲覧は完全自己完結、エクスポート時のみ CDN を動的ロード。`P` キー経由でも `Ctrl+P` 直接でも 1 ページ = 1 スライドになるよう `print.css` が hero モードを上書きする。

### 生成手順

1. `assets/base-template.html` をコピーして土台にする
2. `assets/styles/` の **7 ファイル**を `<style>` に統合（`theme-vars → slide-core → nav-controls → figure → chart → list-view → print` の順、print.css は必ず最後）
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
6. `assets/scripts/` の **6 ファイル**を `<script>` に統合（`fit-slide → theme-toggle → view-toggle → navigation → export-pdf → export-png` の順）
7. `.control-cluster` 内に `.export-menu` ブロックが含まれることを確認（base-template に標準で含まれている）。キーボードショートカット（P / Shift+S / Shift+P）は navigation.js 改修版に組み込み済み

### 機能チェック表

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
| 一覧テーブル高さ可変 | `.slide-fit` + `list-view.css` + `print.css` |
| キーボード操作 | `←→` 移動 / `Space` 次へ / `F` フルスクリーン / `V` ビュー切替 / `P` PDF / `Shift+S` PNG / `Shift+P` ZIP |

---

## Step 5: 出力・検証

### 5-A. ファイル出力

- ファイル名: `{テーマ}-slides.html`
- 保存先: `/mnt/user-data/outputs/`
- `present_files` で提示

### 5-B. 品質検証（Phase 5）

ユーザーが「品質を確認して」「検証して」「チェックして」と求めた場合、
`references/output-validation.md` を参照して以下のフローを実行する。
検証は**ユーザーの明示的な要求時のみ**実行する（デフォルトでは実行しない）。

**検証フロー:**

1. `bash scripts/validate-output.sh {出力ファイル}` を実行する
2. 結果を確認する：

**ALL PASS の場合:**
- 「検証完了: 全チェック項目を PASS しました。」とユーザーに報告して終了

**FAIL がある場合:**
- FAIL 項目をわかりやすく整理してユーザーに提示する（どのカテゴリで何が FAIL したか）
- `ask_user_input_v0` で修正意思を確認する：

```
質問: チェック結果に問題がありました。修正しますか？
選択肢:
  - 「はい、修正する」
  - 「いいえ、このままでOK」
```

- **「はい、修正する」** → FAIL 箇所を修正して HTML を再生成し、再度 `validate-output.sh` を実行する。ALL PASS になるまで繰り返す
- **「いいえ、このままでOK」** → 「了解しました。」と回答する。ファイルが未提示なら `present_files` で提示、提示済みなら回答のみで終了

---

## クオリティチェックリスト

出力前に以下の観点で確認する。

### A. フロー遵守
- [ ] Step 0 でスライド作成の意思が確認されたか
- [ ] 情報ソース（会話のみ / ハイブリッド / Web検索メイン）がユーザーに確認されたか
- [ ] 検索する場合、検索フレーズ候補がユーザーに提示・承認されたか
- [ ] ビジュアル方針（グラフ＋画像 / グラフのみ / テキストのみ）が確認されたか
- [ ] 情報量不足・中止選択時に検索や HTML 生成が一切行われていないか

### B. コンテンツ品質
- [ ] Web検索から得た実際の情報が含まれているか（架空データ NG）
- [ ] 出典 URL が参考リンクスライドに含まれているか
- [ ] スライド枚数が選択モードに合致しているか（通常 6〜10 枚 / ミニ 3 枚固定）

### C. レイアウト・テーマ
- [ ] 960×540px（16:9）固定で `transform: scale()` フィットが動作するか
- [ ] ライト／ダーク切替が動作するか
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
- [ ] 1 スライドあたりグラフ最大 1 つ、画像とグラフは同一スライドに共存していないか
- [ ] 「テキストのみ」「会話のみ」選択時にグラフが生成されていないか
- [ ] Chart.js・D3.js 等の外部ライブラリ・`<canvas>`・CDN script を使用していないか

### G. エクスポート
- [ ] 📥メニューがコントロールクラスタの右端に表示されるか
- [ ] `P` で印刷ダイアログが開き、1 ページ = 1 スライドで PDF 保存できるか（hero 起点でも崩れないか）
- [ ] `Shift+S` で現在スライドの PNG がダウンロードできるか
- [ ] `Shift+P` で全スライド ZIP がダウンロードできるか
- [ ] CORS エラー / ネット切断時に alert でエラー通知が出るか
- [ ] 印刷時にダークテーマがライトに上書きされ、コントロール類が非表示になるか

### H. コンテンツ漏洩チェック（Phase 5 追加）
- [ ] `<section>` / `<div class="slide-inner">` の直下に CSS 定義テキスト（`[data-theme="dark"]`、`var(--`、`:root {` 等）が表示されていないか
- [ ] JavaScript コード断片（`function `、`const `、`document.`）がスライドの可視テキストとして漏れていないか
- [ ] SVG テンプレートのプレースホルダー（`{TITLE}`、`{SOURCE}`、`{AXIS_X_LABEL}` 等）が未置換のまま残っていないか

### I. オーバーフロー対策（Phase 5 追加）
- [ ] 10 行超のテーブルや 20 項目超の一覧を含むスライドに `slide-fit` クラスが付与されているか
- [ ] `slide-fit` が通常の概要・メインコンテンツスライドに誤って付与されていないか
