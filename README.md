# skill-websearch-slide-ja

Web検索で情報収集して、スライド形式のHTMLページを生成するClaude.aiスキル。

## 使い方のトリガー例

### スラッシュコマンド
```
/websearch-slide-ja
前述までの会話履歴をスライド資料にしてください
```

### 自動判定
> 「〇〇についてスライドにまとめて」
> 「GitHubのトレンドをスライドで見せて」
> 「Xで話題の〇〇をHTMLスライドにして」
> 「〇〇のデータをグラフ付きスライドでまとめて」

## 特徴

- Web検索による情報収集 → 構造化 → HTMLスライド生成を一気通貫で実行
- ライト/ダークテーマ切り替え対応
- **カラーパレット切替対応（v0.6.0〜）** — 生成HTML右上の 🎨 から選択（localStorage 保持・印刷/PDF にも反映）。従来方式は 5 色（Ocean / Forest / Sunset / Plum / Graphite）、CLI連携時は `mdss-convert` が持つ色（v0.6.1 では Ruby / Gold を加えた 7 色）
- ヒーロースライダー ⇄ 一覧表示モード切り替え対応
- 利用者の職種別の検索クエリ最適化（エンジニア・PM・マーケ等）
- **Web検索した画像をスライドに自動埋め込み**（出典リンク・フォールバック対応）
- **数値データを含むテーマでSVGグラフを自動生成**（横棒・折れ線・ドーナツ・散布図）
  - ライト/ダーク両テーマでグラフ色が自動追従
  - 外部ライブラリ不使用・完全自己完結HTML
- **構造・流れ・関係をインラインSVG図解で自動生成（v0.5.0〜）**
  - 横フロー（処理の流れ）／縦レイヤー（構成・階層）／サイクル（循環）の3パターン
  - グラフ同様に外部ライブラリ不使用・色はテーマ追従・PDF/PNGでも崩れない
- **生成HTMLをそのままエクスポート（v0.3.0〜）**
  - `P` キー → PDF（印刷ダイアログ経由・1スライド=1ページ・オフライン動作）
  - `Shift+S` → 現在スライドを PNG ダウンロード（1920×1080）
  - `Shift+P` → 全スライドを ZIP ダウンロード（連番PNG）
  - 📥 メニューからも操作可能
- **大量コンテンツのはみ出し自動対応（v0.4.0〜）**
  - 10行超テーブル・20項目超一覧を含むスライドで `slide-fit` クラスを自動付与
  - 一覧モード（`V`）切替時にコンテンツ全体を表示。hero モードの16:9固定は維持
- **生成HTML品質チェックスクリプト（v0.4.0〜）**
  - `bash assets/scripts/validate-output.sh <file.html>` でHTML構文・必須要素・CSS/JSリーク・画像形式等を10カテゴリ自動検証
  - 「検証して」の指示で実行。FAILがある場合は修正するか確認してから対応
- **CLI連携（自動検出）** — `mdss-convert`（[MD Slide Studio](https://github.com/sgtao/md-slide-studio)のCLI）が利用可能な環境では、HTML生成をCLIへ自動委譲し決定論的な変換を行う。CLIが使えない環境では、従来どおりLLMが直接HTMLを生成する（フォールバック）。どちらの経路になるかは実行時に自動判定され、特定バージョンへの依存はない
  - **最新の記法に自動で追従（v0.8.2〜）**: 構成を決める前に CLI から記法仕様（`--print-spec`）と選び分けの指針（`--guide-prompt`）を取得するため、CLI 側で増えたスライド種類をスキルの改修なしに使える。v0.6.1 では手順カード（`steps`）・タイムライン（`diagram-timeline`）・対比（`contrast`）・工程表／体験の推移（`svg-figure`）・スピーカーノート（`note:`）・結論帯（`point:`）に対応
  - **変換結果の確認を強化（v0.8.2〜）**: 出典の無いグラフや未対応のスライド種類は、CLI が警告止まりで通してもスキル側で止め、原稿を直してから HTML を提示する
  - 動作確認済みの版: mdss-convert v0.6.1

### このスキルが目指すもの

単なる検索結果の要約ではなく、
「収集 → 分析 → スライド化」までを一度の指示で完結させることを目的としています。

### 出力イメージ

ブラウザで動作するインタラクティブなHTMLプレゼンテーションを生成します。  
キーボード操作とテーマ切替に対応しており、HTMLファイルとして共有・配布できます。

キーボード操作は生成経路によって一部異なります。

| 操作 | 従来方式（LLM 直接生成） | CLI連携（mdss-convert v0.6.1） |
|---|---|---|
| 移動 | `← →` / `Space` | `← →` / `Space` / `Shift+Space` / `Home` `End` / `J`（ページ番号で移動） |
| 一覧 | `V` 一覧切替 | `V` 一覧切替 / `G` 一覧グリッド / `T` サムネイル帯 |
| 表示 | `F` フルスクリーン | `F` フルスクリーン / `N` スピーカーノート（ノートがあるデッキのみ） |
| 出力 | `P` PDF / `Shift+S` PNG / `Shift+P` ZIP | 同左 |
| ヘルプ | — | `?` で操作一覧を表示 |

CLI連携の操作は `mdss-convert` の版で変わることがあります。生成した HTML で `?` を押すと、その版の一覧を確認できます。

## インストール

方法は 2 つあります。どちらも同じスキルフォルダ（`websearch-slide-ja/`）を配置します。

### 配置先の一覧

| ツール | ワークスペース（リポジトリ）配下 | ユーザー（全プロジェクト共通） |
|---|---|---|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| GitHub Copilot | `.github/skills/` | `~/.copilot/skills/` |
| 標準（Codex など） | `.agents/skills/` | `~/.agents/skills/` |
| Antigravity | `.agents/skills/` | `~/.gemini/config/skills/` |
| [Claude.ai](https://claude.ai/) | — | ZIP を [カスタマイズ＞スキル](https://claude.ai/customize/skills) に登録 |

GitHub Copilot は `.claude/skills/`・`.agents/skills/`・`~/.agents/skills/` も読み込みます。

> インストールできることと、そのツールで期待どおり動くことは別です。本スキルは Claude（Claude.ai / Claude Code）で動作確認しています。他のツールでは、質問の出し方・ファイルの保存先・Web 検索の手段が異なる場合があります。

### 方法 1: `scripts/install.sh`（このリポジトリを clone して使う）

```bash
git clone https://github.com/sgtao/skill-websearch-slide-ja.git
cd skill-websearch-slide-ja

bash scripts/install.sh                      # Claude Code・ユーザー（~/.claude/skills）
bash scripts/install.sh --target copilot     # GitHub Copilot・ユーザー（~/.copilot/skills）
bash scripts/install.sh --target all -y      # 4 つのツールすべて・確認なし
bash scripts/install.sh --list-targets       # 配置先の一覧を表示
```

ワークスペース（リポジトリ）配下に入れるときは、入れたいプロジェクトで実行するか、`--project-dir` で指定します。

```bash
cd ~/work/my-app
bash /path/to/skill-websearch-slide-ja/scripts/install.sh --scope project --target claude,copilot

# または
bash scripts/install.sh --scope project --project-dir ~/work/my-app --target copilot
```

| オプション | 内容 |
|---|---|
| `--target <list>` | `claude`（既定）/ `copilot` / `agents` / `antigravity` / `all`。カンマ区切りで複数指定可 |
| `--scope <scope>` | `user`（既定）/ `project` |
| `--project-dir <path>` | `--scope project` の対象（既定: 実行時のカレントディレクトリ） |
| `--dir <path>` | 任意の配置先を直接指定（上表に無いツール向け） |
| `--uninstall` | 配置先からスキルを削除する |
| `--dry-run` | 何も書き込まず、行う操作だけを表示する |
| `--zip` | Claude.ai 用の ZIP を `dist/` に生成する |
| `-y`, `--yes` | 確認なしで実行する |

- 既存の同名フォルダは、削除してからコピーします（古いファイルを残さないため）。`-y` を付けない場合は削除前に確認します
- 環境変数 `CLAUDE_SKILLS_DIR` で、Claude Code・ユーザーの配置先を変更できます
- macOS 標準の bash 3.2 で動作します

### 方法 2: `npx skills add`（[skills.sh](https://skills.sh/) の CLI。clone 不要）

```bash
# プロジェクト配下に入れる（対話形式でツールを選ぶ）
npx skills add https://github.com/sgtao/skill-websearch-slide-ja --skill websearch-slide-ja

# ユーザー側（-g）に、ツールを指定して入れる
npx skills add https://github.com/sgtao/skill-websearch-slide-ja --skill websearch-slide-ja -g -a claude-code
```

- `-a` には `claude-code` / `github-copilot` / `antigravity` / `codex` などを指定できます（複数可）
- プロジェクト配下では、実体を `.agents/skills/` に置き、Claude Code 用の `.claude/skills/` からはシンボリックリンクになります。コピーにしたい場合は `--copy` を付けます
- CLI は匿名の利用状況を送信します。止めるには `DISABLE_TELEMETRY=1` を付けて実行します
- GitHub Copilot のプロジェクト配下は、`npx skills add` では `.agents/skills/` に入ります。`.github/skills/` に置きたい場合は方法 1 を使ってください

### Claude.ai に登録する

```bash
bash scripts/install.sh --zip      # dist/websearch-slide-ja-<日時>.zip を生成
```

生成した ZIP を [カスタマイズ＞スキル](https://claude.ai/customize/skills) に追加してください（スキルフォルダ `websearch-slide-ja` を手で ZIP にしても同じです）。

## Language

SKILL.md is written in Japanese 🇯🇵

## LICENCE

[MIT Licence](./LICENSE)

---

🤖 Built with [Claude.ai](https://claude.ai/)
