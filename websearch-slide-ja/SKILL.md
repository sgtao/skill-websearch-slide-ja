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
  「このスキルの使い方を教えて」「websearch-slide-ja のヘルプ」「スライドはどう頼めばいい？」
  のように使い方を尋ねられたときも起動する（スライドは作らずに使い方を答える）。
  WebページやPDFをMarkdownに変換するだけの依頼（スライド化を伴わないもの）は対象外。
---

# Slide Generator Skill with Web Search (Japanese)

ネット上の情報を調査・収集し、スライド形式のHTMLページを生成するスキル。

**このファイルは入口**。依頼からモードを 1 つ決め、そのモードのファイルだけを読んで進める。
手順の本文は `workflows/` にある（パスはすべてスキルのフォルダが基準）。

## 実行環境（最初に確認する）

このスキルは、ツール名や保存先を「選択式で確認する」「成果物を保存して提示する」のように
**操作の名前**で書いている。実際に使うツールとパス（Claude.ai / Claude Code / その他）は
`references/environment.md` の読み替え表に従う。**開始時に必ず読む。**

## モード判定（最初に必ず行う）

依頼と添付物から、以下のいずれかで開始する。

| 入力 | モード | 読むファイル |
|---|---|---|
| A) テーマの依頼（従来） | create | `workflows/create.md` |
| B) スライドMD添付＋「変換して」 | convert-md | `workflows/convert-md.md` |
| C) スライドHTML添付＋「MDにして」「編集して」 | extract | `workflows/extract.md` |
| D) 未準拠Markdown／CSV／会話履歴・プレーンテキスト | convert-raw | `workflows/convert-raw.md` |
| この会話で作ったスライドの修正（「3枚目を2カラムにして」等）、編集した MD の再変換 | edit | `workflows/edit.md` |
| 使い方の質問（「使い方を教えて」「どう頼めばいい？」「既定値を設定したい」） | help | `workflows/help.md` |

help では**スライドを作らない**（作成可否の質問もしない）。

添付物が Markdown・テキスト・表データのときは、次の「入力タイプ判定」で B か D かを決める。

### 入力タイプ判定

モード判定の直後、入力を以下の基準で自動分類する。

| タイプ | 判定条件 | 遷移先 |
|---|---|---|
| 完全スライドMD | frontmatter に `title:` があり、かつ `<!-- slide: ... -->` が1つ以上 | B) convert-md |
| 未準拠Markdown | Markdown 見出し(`#`)またはリスト(`-`)があるが上記を満たさない | D) convert-raw |
| CSV / TSV | 拡張子が `.csv`/`.tsv`、または明確な区切り表データ | D) convert-raw |
| 会話履歴／プレーンテキスト | 上記いずれでもない | D) convert-raw |

「frontmatter はあるが slide directive が無い」場合は**未準拠Markdown扱い**とする
（安全側の判定。誤って直接変換しない）。

## モード別の必読ファイル

**この表が、どのモードで何を読むかの唯一の正**。●＝必ず読む、–＝読まない。
条件つきの欄は、その条件に当たったときだけ読む。

| ファイル | create | convert-md | convert-raw | extract | edit | help |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `workflows/<モード>.md` | ● | ● | ● | ● | ● | ● |
| `references/environment.md` | ● | ● | ● | ● | ● | シェルの手段だけ |
| `references/cli-conversion.md` | ● | ● | ● | ● | ● | – |
| `workflows/build.md`（CLI診断・変換・出力と自己検証） | ● | ● | ● | 「Step 2.5」だけ | ● | – |
| `workflows/write-md.md`（type の選び分け・MD を書く規則） | ● | – | ● | – | 内容を書き足すとき | – |
| `references/audience-purpose.md` / `source-selection.md` / `role-signals.md` | ● | – | – | – | – | – |
| `references/search-patterns/*`（該当 1 本） | Web検索時 | – | – | – | – | – |
| `references/slide-layouts.md` / `example-outputs/README.md` | 構成設計時 | – | – | – | レガシーの `layout:` | – |
| `references/chart-generation.md` / `diagram-generation.md` / `image-embedding.md` | グラフ・図解・画像を使うとき | – | 数値データを `chart` にするとき | – | – | – |
| `references/markdown-format.md` | `--print-spec` 非対応、またはレガシー | 同左 | 同左 | CLI で逆抽出できないとき | 同左 | – |
| `references/self-review.md` | 生成後 | 生成後 | 生成後 | – | 生成後 | – |
| `workflows/legacy-build.md` と `assets/**`、`references/design-tokens.md` / `export-recipes.md` / `output-validation.md` | CLI が使えないときだけ | 同左 | 同左 | – | 同左 | – |
| `references/usage-guide.md`（頼み方の例・既定値の雛形と扱い） | 既定値があるとき | – | – | – | – | ● |

- どのモードでも、他のモードの `workflows/*.md` は読まない
- CLI が使える環境では `workflows/legacy-build.md` を読まない

## Step 番号と手順の場所

各ファイルは従来の Step 番号で互いを指す。番号がどのファイルにあるかは次のとおり。

| Step | 内容 | 場所 |
|---|---|---|
| 0 / 1-A / 1-B / 1-C / 2 | 作成可否と目的・情報ソース・テーマとロール・検索フレーズとビジュアル方針・Web検索 | `workflows/create.md` |
| 2.5 | CLI環境診断＋実効仕様の取得 | `workflows/build.md` |
| 3-0 / 3 | ビジュアル化判定・構成の設計 | `workflows/create.md`（type の選び分けは `workflows/write-md.md`） |
| 4-A | スライドMD生成 | `workflows/write-md.md` |
| 4-B | MD→HTML変換 | `workflows/build.md`（レガシーの生成手順は `workflows/legacy-build.md`） |
| 5（5-A / 5-B） | 出力・完了報告・自己検証 | `workflows/build.md` |
| スタイル変更の対話 | 生成後の修正 | `workflows/edit.md` |
| クオリティチェックリスト | A / B / C〜J | `workflows/create.md` / `workflows/build.md` / `workflows/legacy-build.md` |

## 共通原則（全モード）

- **トラックは 2 つ**: CLIトラック（`mdss-convert` に変換を委譲）とレガシートラック（LLM が直接
  HTML を生成）。Step 2.5 で決まり、会話内で一度だけ診断して結果を使い回す
- **スライドMD が正**（Single Source of Truth）。HTML は MD から毎回フル再生成する。
  HTML だけを直接書き換えない
- **確認できない内容は書かない**。出典でもユーザー提供でも確認できない数値・固有名詞・実績は、
  値を書かずに `（要確認: ○○）` と書く（`workflows/write-md.md`「Step 4-A」）
- **ユーザーが用意した MD・文章の本文は書き換えない**（B / D）。指摘は伝えて、直すかを確認する
- **勝手に決めない**。作成可否・目的・情報ソース・ビジュアル方針は選択式で確認する。
  プロジェクトの指示に既定値があるときだけ、その項目の質問を省き、一覧で 1 回確認する
  （`workflows/create.md`「既定値の読み取り」。作成可否は省略しない）
- **提示の前に自己検証を行う**（保存 → 自己検証 → 提示の順）。足りない道具を自動でインストールしない
- **HTML を提示するたびに完了報告の 7 項目を各 1 行で出す**（生成物／トラック／lint／要確認／
  情報ソース／未実施の検証／次にできること）。行っていない確認を「問題ありません」と書かない。
  書き方は `workflows/build.md`「Step 5」
- B / C では `source-selection.md` のゲート群を通らず、Web検索も行わない
