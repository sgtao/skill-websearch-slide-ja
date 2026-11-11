---
name: websearch-slide-ja
description: >
  GitHubやX（Twitter）などのネット上の公開情報を Web検索で収集し、
  スライド形式のHTMLページとして生成するスキル。
  「スライドを作って」「プレゼン資料にして」「HTMLスライドで説明して」
  「〇〇についてスライドにまとめて」「GitHubのトレンドをスライドで」
  「Xで話題の〇〇をスライドに」などのフレーズが含まれる場合は必ずこのスキルを使う。
  また、スライドMarkdown（中間形式）に対応：生成時は .md と .html を両方出力し、
  「このMD（スライドMD）をスライドに変換して」「Markdownからスライドを生成して」
  「スライドをMarkdownで出力して」「このスライドHTMLをMDに逆変換して」でも起動する。
  WebページやPDFをMarkdownに変換するだけの依頼（スライド化を伴わないもの）は対象外。
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
3-0. ビジュアル化判定（グラフ / 図解）
3.   スライド構成の設計
4-0. CLI環境診断（プリフライト）★新設
4.   HTMLスライド生成（エクスポート機能込み）
5.   ファイル出力・提示・検証
```

### エントリポイント判定（最初に必ず行う）

依頼と添付物から、以下のいずれかで開始する。

| 入力 | フロー |
|---|---|
| A) テーマの依頼（従来） | Step 0 → 1 → 2 → 3 → 4-0 → 4-A → 4-B → 5 |
| B) スライドMD添付＋「変換して」 | 簡易確認 → Step 4-0 → 4-B → 5（Step 1〜3 と検索はスキップ） |
| C) スライドHTML添付＋「MDにして」「編集して」 | Step 4-0 → 逆抽出（`--extract-md` またはmarkdown-format.md §7。`cli-conversion.md` §5参照）→ .md 提示 →（編集後）Step 4-B → 5 |
| D) 未準拠Markdown／CSV／会話履歴・プレーンテキスト | 入力タイプ判定 → 変換確認フロー（B-2）→ Step 4-0 → 4-B → 5 |

Step 4-0 はいずれの経路でも会話内で一度だけ実行し、以降 4-A・4-B・逆抽出で結果を使い回す
（詳細は `references/cli-conversion.md`）。

B / C では `source-selection.md` のゲート群を通らず、Web検索も行わない。
スライドMD の仕様は `references/markdown-format.md` を参照。

### 入力タイプ判定

エントリポイント判定の直後、入力を以下の基準で自動分類する。

| タイプ | 判定条件 | 遷移先 |
|---|---|---|
| 完全スライドMD | frontmatter に `title:` があり、かつ `<!-- slide: ... -->` が1つ以上 | B) 直接 Step 4-B |
| 未準拠Markdown | Markdown 見出し(`#`)またはリスト(`-`)があるが上記を満たさない | D) 変換確認フローへ |
| CSV / TSV | 拡張子が `.csv`/`.tsv`、または明確な区切り表データ | D) 変換確認フローへ |
| 会話履歴／プレーンテキスト | 上記いずれでもない | D) 変換確認フローへ |

「frontmatter はあるが slide directive が無い」場合は**未準拠Markdown扱い**とする
（安全側の判定。誤って直接変換しない）。

### 変換確認フロー（エントリポイント D）

1. 入力を想定様式のスライドMDに変換する。
   - **1スライドの分量はユーザー指定がなければ「情報グループ優先」**で決める
     （見出し単位で自然に分割。従来の6〜10枚規則には縛られない）
   - frontmatter の `title` は入力から推定、`palette` は未指定なら `ocean`
   - 箇条書き→`points`、表→`table`、数値データ→`chart`、手順→`points`/`summary`
     等、内容に応じて type を割り当てる（`markdown-format.md` 参照）
   - CSV の場合: 数値列があれば `chart` 候補として構造化する。出典は
     「ユーザー提供データ」である旨を明記し、`chart-generation.md` の
     数値・単位・出典ルールに準拠させる
2. **変換したスライドMDの全文をユーザーに提示**し、承認を得る
   （例: 「この構成でHTMLスライドを生成しますか？ 修正があれば指示してください」）
3. 承認 → Step 4-B（MD→HTML変換）→ Step 5（`.md` ＋ `.html` 両出力）
4. 修正指示があれば MD を修正して再提示する


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
| `references/cli-conversion.md` | **Step 4-0・4-B・逆抽出**：CLI診断アルゴリズム・コマンド組み立て・トラック分岐 |
| `references/slide-layouts.md` | Step 3 構成設計、[レガシー] Step 4 各スライド作成時 |
| `references/markdown-format.md` | Step 4-A（`--print-spec`非対応時の実効仕様）・HTML→MD逆抽出時：スライドMDの仕様。[レガシー]トラックでは必読 |
| `references/audience-purpose.md` | Step 0 目的確認後・Step 3/4：目的別トーン（強調階層・説得レバー）。両トラック共通 |
| `references/design-tokens.md` | [レガシー] Step 4：CSS変数・カラー埋め込み |
| `references/image-embedding.md` | Step 2 画像収集、[レガシー] Step 4 画像埋め込み |
| `references/chart-generation.md` | Step 3-0 グラフ化判定、[レガシー] Step 4 グラフ埋め込み |
| `references/diagram-generation.md` | Step 3-0 図解判定、[レガシー] Step 4 図解（インラインSVG）埋め込み |
| `references/export-recipes.md` | [レガシー] Step 4：エクスポート機能（PDF/PNG/ZIP）組み込み |
| `references/output-validation.md` | [レガシー] Step 5：品質検証・修正確認 |
| `references/example-outputs/README.md` | Step 3 構成設計：テーマ傾向が近いお手本の構成スケルトンを参照（実HTMLは原則開かない／トークン肥大防止） |
| `assets/base-template.html` | [レガシー] Step 4 開始時に必ずコピーして土台にする |
| `assets/styles/*.css` | [レガシー] 全 8 ファイルを統合（theme-vars → slide-core → nav-controls → figure → chart → diagram → list-view → print） |
| `assets/scripts/*.js` | [レガシー] 全 7 ファイルを統合（fit-slide → theme-toggle → view-toggle → navigation → export-pdf → export-png → palette-toggle） |
| `assets/fallback-image.html` | [レガシー] 画像埋め込み時に `createFallback()` をコピー |
| `assets/chart-templates/*.svg` | [レガシー] グラフ埋め込み時に該当テンプレートをコピー |
| `assets/scripts/validate-output.sh` | [レガシー] Step 5：生成 HTML の機械的チェック（CLIトラックはlintで代替。§Step 5-B参照） |

> **CSS/JS 統合順の Single Source of Truth（SSoT）は本表と Step 4 の生成手順。**
> assets/ 配下の各 CSS/JS のヘッダーコメントや他の references には統合順を再掲しない。

## ステップ別スキップ条件（早見表）

| ビジュアル方針 / モード | Step 2 画像収集 | Step 2 数値抽出 | Step 3-0 グラフ化 |
|---|---|---|---|
| Web検索あり × グラフ作成＋画像あり | 実行 | 実行 | 実行 |
| Web検索あり × グラフ作成＋画像なし | スキップ | 実行 | 実行 |
| Web検索あり × テキストのみ | スキップ | スキップ | スキップ |
| 会話のみモード（3枚ミニ含む） | スキップ | 原則スキップ | 原則スキップ |

---

## Step 0: 作成目的の確認

スキルが呼び出された時点で、`ask_user_input_v0` を**逐次2回**呼び出し、
「作成可否」→「作成目的」の順に確認する（1回の呼び出しは2〜4択に収める）。

### 0-1. 目的の推定（入力情報が多い場合・呼び出し1の前に実施）

会話履歴・長文テキスト・CSV 等、判断材料になる入力が既にある場合は、
呼び出し1の前に経緯を解析し、目的を推定する（`references/audience-purpose.md` 参照）。

| 手がかり | 推定される目的 |
|---|---|
| 「振り返り」「学んだこと」「メモ」「自分用」等の語 / 内省的な文体 | 自己学習・振り返り用 |
| 「チームに」「勉強会」「共有」「社内」「議論」等の語 / 業務文脈 | 社内共有・勉強会用 |
| 「発信」「投稿」「顧客」「提案」「訴求」「LP」等の語 / 説得・宣伝の文脈 | SNS発信・顧客プレゼン用 |
| 判断材料が乏しい | 推定しない（通常の順序で進める） |

推定できた場合は、後述の呼び出し2でその目的を選択肢の先頭に「（推奨）」付きで示す。
**推定はあくまで提案であり、必ずユーザーに確認を取る**（勝手に決めない）。

### 0-2. 呼び出し1（作成可否）

```
質問: HTMLベースのスライド資料を作成しますか？
選択肢:
  - 「はい、作成する」
  - 「いいえ、やめる」
```

- **「いいえ、やめる」** → 「了解しました。」と回答してスキルの処理を終了する
  （検索・生成は一切行わない）。呼び出し2は行わない
- **「はい、作成する」** → 呼び出し2 へ

### 0-3. 呼び出し2（作成目的・「はい」のときのみ）

```
質問: どんなスライド資料を作りますか？（目的に合わせて構成とトーンを最適化します）
選択肢:
  - 自己学習・振り返り用（思考を深める／教訓を残す）
  - 社内共有・勉強会用（チームに伝える／議論の土台にする）
  - SNS発信・顧客プレゼン用（相手の感情と行動を動かす）
  - まだ決めていない（おまかせ）
```

- 目的3種のいずれか → `references/audience-purpose.md` の該当トーンを適用して Step 1-A へ
- 「まだ決めていない（おまかせ）」→ 未選択フォールバック
  （`audience-purpose.md` の「目的が未選択・未確定のときのフォールバック」＝
  社内共有相当の中庸トーン）で Step 1-A へ

選択された目的は Step 3（構成設計）・Step 4（生成）・スタイル変更対話まで一貫して適用する。
スライドMD の frontmatter に `purpose:` として任意で記録してよい（`markdown-format.md` 参照）。

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

## Step 3-0: ビジュアル化判定（グラフ / 図解）

> **スキップ条件**: ビジュアル方針が「テキストのみ」のとき。

### 手順

まず「伝えたいもの」で手段を振り分ける（ビジュアル化判定表）。

| 伝えたいもの | 使う手段 | 参照 |
|---|---|---|
| 数量比較・推移・割合 | グラフ | chart-generation.md |
| 構造・流れ・関係・循環 | 図解（インラインSVG） | diagram-generation.md |
| 実物・外部の権威ある図 | 画像 | image-embedding.md |
| 上記以外 | テキスト | — |

**グラフ採用判定**（「[グラフデータ候補]」が 1 件以上のとき）
1. `references/chart-generation.md` を読み込む
2. 各候補について 4 条件（数値性 / 3 点以上 / 単位・出典 / 種別判定可能性）を判定。**全 YES のみ採用**
3. 採用候補は「データ形状 → グラフ種別マッピング」でテンプレートを決定（bar / line / donut / scatter）

**図解採用判定**（構造・流れ・循環を説明したいとき）
1. `references/diagram-generation.md` を読み込む
2. パターンを選ぶ：手順・処理の流れ → 横フロー／構成・階層 → 縦レイヤー／循環 → サイクル
3. 図に描く要素・矢印は **出典で確認できた関係に限る**（推測の接続を足さない）

採用結果を以下の形式で記録：

```
[グラフ採用リスト]
スライド N: テンプレート bar-chart.svg / タイトル「...」 / 系列 1 / データ点 5
[図解採用リスト]
スライド M: パターン 横フロー / ノード 4 / タイトル「...」
```

**制約**: 1 スライドあたりグラフは最大 1 つ。グラフ・図解・画像は同一スライドに共存させない。

**例外**: `comparison-chart` レイアウト（Before/After比較）に限り、同一指標の Before/After ドーナツ2つを1スライドに共存させてよい。異なる指標のグラフを2つ並べることは引き続き禁止。

---

## Step 3: スライド構成の設計

`references/slide-layouts.md` を参照して構成を決める。

> Step 0 で確認した作成目的のトーン（`references/audience-purpose.md`）に従い、
> 強調する階層・推奨 type・引き算方針を適用する。

### テーマ傾向 → お手本対応表

構成設計時、テーマ傾向に近い完成例の **構成スケルトンのみ** を
`references/example-outputs/README.md` から参照する（実HTMLはロードしない／トークン肥大防止）。

| テーマ傾向 | 参照する例 | 主に学べる点 |
|---|---|---|
| 動向・提言の紹介（データ＋写真で説得） | example-trend-fullpath | グラフ＋画像(onerror)＋出典のフルパス構成・stat |
| 製品・ツールの比較 | example-product-comparison | グラフ2本＋`slide-fit`比較テーブル＋2×2カード |
| 手順・チュートリアル | example-tutorial | 1スライド1ステップ＋コードブロック（コード中心） |
| ビジネス提案・意思決定 | example-business-pitch | 課題→施策→効果→依頼の論理＋KPIグラフ＋`callout` |
| 構造・流れ・循環の説明 | example-diagram | インラインSVG図解（横フロー/縦レイヤー/サイクル）・外部依存ゼロ |

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

## Step 4: スライド生成（MD中間層）

> 生成は「4-0: CLI環境診断 → 4-A: スライドMD生成 → 4-B: MD→HTML変換」の3段構成。
> スライドMD が Single Source of Truth（正）であり、HTML は MD から毎回フル再生成する。
> エントリポイント B（MD添付）では 4-0 → 4-B の順で実行する（4-A はスキップ）。

このスキルは **CLIトラック**（`mdss-convert`に変換を委譲）と **レガシートラック**
（従来どおりLLMが直接HTMLを生成）の2経路を持つ。どちらが使われるかは Step 4-0 の診断結果で
決まり、経路によって Step 4-A・4-B の具体的な手順が変わる。詳細な判定ロジックとコマンド組み立ては
`references/cli-conversion.md` を参照。

### Step 4-0: CLI環境診断（プリフライト）

Step 4-A に入る前に、この会話内でまだ診断していなければ必ず実行する（詳細は
`references/cli-conversion.md` §2）。

1. `mdss-convert`（グローバル）または `npx -y mdss-convert@latest` が使えるか確認する
2. 使える場合、`--help` の出力から対応オプション（`--print-spec` / `--strict` /
   `--json-only` / `--extract-md` 等）を確認する
3. 判定結果（利用可否・対応オプション一覧）は会話内で保持し、以降 Step 4-B を
   複数回実行しても再診断しない
4. 利用不可の場合は「今回はCLIが利用できないため、従来方式で作成します」と一言添え、
   以降はレガシートラック（本ステップの [レガシー] 表記の手順）で進める

### Step 4-A: スライドMD生成

Step 3 の構成スケルトンを `.md` に書き起こす。使用する仕様は Step 4-0 の結果で決まる。

- **CLIトラック かつ `--print-spec` 対応**: `mdss-convert --print-spec` の出力（最新の
  スライドMD記法）にそのまま従う。`references/markdown-format.md` は使わない
- **上記以外（CLIトラックで`--print-spec`非対応、または レガシートラック）**:
  `references/markdown-format.md` に従う。この仕様書はレガシートラックのLLM生成にも、
  CLIトラックの変換にもそのまま使える（chart-donut／comparison-chart／diagram-flowの記法が
  mdss-convertでもwarnings 0件・lint 0件で通ることを確認済み）
- frontmatter（`title` / `palette`）→ スライドディレクティブ（`<!-- slide: type -->`）→ 本文
- グラフは `chart` データ記述ブロック（推奨）、図解は `diagram` ブロックまたは `mermaid`
  サブセット（変換時にインラインSVG化。`mermaid.js` は最終HTMLに含めない）
- ファイル名: `{テーマ}-slides.md`

### Step 4-B: MD→HTML変換

```
CLIトラック:
  references/cli-conversion.md §4 のコマンド組み立てに従い、mdss-convert で変換する。
  lintにerrorがあれば（--strict の exit 3、または --json のlint配列で判定）、
  HTMLを提示せずMDを修正して再変換する

レガシートラック [レガシー]:
  以下の「生成手順」（本ステップ従来どおり）でLLMが直接HTMLを生成する
```

frontmatter `palette` があれば `<html data-palette="...">` を焼き込み、
ドロップダウンの該当ボタンへ `is-active` を移す（`markdown-format.md` §6 / CLIトラックでは
mdss-convert側が同等の処理を行う）。

> 文言のトーン・強調・ネクストアクションは、Step 0 で確認した作成目的
> （`references/audience-purpose.md`）に従う。両トラック共通。

### スタイル変更の対話

生成後にユーザーが「3枚目を2カラムにして」等と指示した場合:

1. 対象スライドを特定し、そのMDディレクティブに `layout:` を追記
   （例: `<!-- slide: points, layout: two-col -->`）
2. MD→HTML再変換（Step 4-B。トラックはStep 4-0の診断結果をそのまま使い回し、再診断しない）
3. 指示が曖昧なとき（「もっと見やすく」等）は `ask_user_input_v0` で
   「2カラム化 / タイトル拡大 / コンパクト化」を選択式提示する

利用可能な `layout:` 値は、CLIトラックなら Step 4-A で取得した実効仕様、レガシートラックなら
`references/slide-layouts.md`「レイアウトバリアント」を参照。


### デザイン原則

- フォント: Noto Sans JP（本文）+ JetBrains Mono（コード）
- アクセントカラー 1 色のみ（`--accent`）。5 パレット（ocean / forest / sunset / plum / graphite）を定義済みで、生成後に HTML 右上の 🎨 メニューで切替可能（生成時のデフォルト: ocean）
- 文字中心・広い余白・箇条書き主体
- スライドサイズ: 960×540px 固定（16:9）、`transform: scale()` でフィット
- 両トラック共通の見た目方針。詳細な実装（CSS変数の値等）は `references/design-tokens.md`
  [レガシー]（CLIトラックではmdss-convert側が担うため参照不要）

### エクスポート機能

生成 HTML は以下 3 種に対応（両トラック共通）。レガシートラックの実装詳細は
`references/export-recipes.md` [レガシー]。CLIトラックはmdss-convertが標準で備える。

| 方式 | 起動 | 依存 | 自己完結性 |
|------|------|------|-----------|
| PDF（印刷経由） | `P` キー / 📥メニュー | 標準 `window.print()` | ◎ オフライン可 |
| 単一 PNG | `Shift+S` / 📥 | html2canvas（CDN 動的ロード） | △ ネット必須 |
| 全スライド ZIP | `Shift+P` / 📥 | html2canvas + JSZip（CDN 動的ロード） | △ ネット必須 |

閲覧は完全自己完結、エクスポート時のみ CDN を動的ロード。`P` キー経由でも `Ctrl+P` 直接でも 1 ページ = 1 スライドになるよう `print.css` が hero モードを上書きする。

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

## Step 5: 出力・検証

### 5-A. ファイル出力

- ファイル名: `{テーマ}-slides.html` と `{テーマ}-slides.md`
- 保存先: `/mnt/user-data/outputs/`
- **`.md` と `.html` の両方**を `present_files` で提示（`.html` を先頭に）
- 提示時に「`.md` を編集して『変換して』と送れば HTML を再生成できます」と一言添える
  （エントリポイント B）

### 5-B. 品質検証（Phase 5）

ユーザーが「品質を確認して」「検証して」「チェックして」と求めた場合、以下を実行する。
検証は**ユーザーの明示的な要求時のみ**実行する（デフォルトでは実行しない）。

**CLIトラックの場合**: `validate-output.sh` は対象外（レガシートラック向けのHTML実装
チェックのため）。代わりに Step 4-B の `--strict`／lint 判定が既に構造的な検証を兼ねている。
ユーザーには「CLI変換のためlintで検証済みです（warnings/lintの内容）」と結果を伝えて終了する。

**レガシートラックの場合**: `references/output-validation.md` を参照して以下のフローを実行する。

**検証フロー:**

1. `bash assets/scripts/validate-output.sh {出力ファイル}` を実行する
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
- [ ] Step 4-0（CLI環境診断）が実行され、結果に応じたトラックでStep 4-A/4-Bが進んだか

### B. コンテンツ品質
- [ ] Web検索から得た実際の情報が含まれているか（架空データ NG）
- [ ] 出典 URL が参考リンクスライドに含まれているか
- [ ] スライド枚数が選択モードに合致しているか（通常 6〜10 枚 / ミニ 3 枚固定）

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
- [ ] 生成直後に `validate-output.sh` の JS 構文チェック（項目4）が PASS するか（H節のリークチェックとは別に、構文そのものが壊れていないかを確認する）
