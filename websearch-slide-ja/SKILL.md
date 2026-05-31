---
name: websearch-slide-ja
description: >
  GitHubやX（Twitter）などのネット上の公開情報（人気Skill、使い方Tips、技術トレンド等）を
  Web検索で収集し、スライド形式のHTMLページとして生成するスキル。
  「スライドを作って」「プレゼン資料にして」「HTMLスライドで説明して」「〇〇についてスライドにまとめて」
  「GitHubのトレンドをスライドで」「Xで話題の〇〇をスライドに」などのフレーズが含まれる場合は必ずこのスキルを使う。
  ネット情報の収集 → 構造化 → HTMLスライド生成まで一気通貫で行う。
---

# Slide Generator Skill with Web Search (Japanese)

GitHubやX（Twitter）等のネット上の情報を調査・収集し、スライド形式のHTMLページを生成するスキル。

---

## ワークフロー概要

```
1. テーマ確認・情報収集計画
2. Web検索（GitHub / X / 技術ブログ等）
3. 情報の構造化・スライド構成の設計
4. HTMLスライド生成
5. ファイル出力・提示
```

---

## 参照ファイルガイド

このSkillは以下の参照ファイル・アセットを持つ。各ステップで該当ファイルを必ず読むこと。

| ファイル | 読むタイミング |
|---------|--------------|
| `references/search-patterns.md` | Step 2 でユーザーの職種が判明したとき |
| `references/slide-layouts.md` | Step 3 でスライド構成を決めるとき、Step 4 で各スライドを書くとき |
| `references/design-tokens.md` | Step 4 でCSS変数（色・フォント）を埋め込むとき |
| `assets/base-template.html` | Step 4 の開始時に必ずコピーして土台にする |
| `assets/styles/*.css` | テンプレートに埋め込むCSS群（theme-vars / slide-core / nav-controls / list-view の順で統合） |
| `assets/scripts/*.js` | テンプレートに埋め込むJS群（fit-slide / theme-toggle / view-toggle / navigation の順で統合） |

---

## Step 1: テーマ確認

ユーザーから以下を把握する（会話から読み取れる場合はスキップ）。

| 項目 | 内容 |
|------|------|
| テーマ | 何についてのスライドか |
| 対象読者 | エンジニア向け／ビジネス向け／汎用 |
| スライド枚数 | 指定がなければ 6〜10枚を目安 |
| 情報源の優先度 | GitHub優先 / X優先 / 両方 |

---

## Step 2: Web検索・情報収集

### 基本検索クエリ

テーマに応じて以下を組み合わせる。職種が判明している場合は `references/search-patterns.md` を参照してクエリを最適化する。

**GitHub情報**
- `{テーマ} github stars trending`
- `{テーマ} awesome list github`

**X（Twitter）情報**
- `{テーマ} site:twitter.com OR site:x.com`
- `{テーマ} tips tricks popular 2025`

**技術ブログ・解説記事**
- `{テーマ} best practices tutorial`
- `{テーマ} 使い方 まとめ`

### 収集の注意事項

- 最低3〜5回の検索でデータを集める
- 2024〜2025年の情報を優先
- GitHubのスター数・フォーク数、Xのいいね数を信頼性指標として活用

---

## Step 3: スライド構成の設計

収集した情報を整理し、スライド構成を決める。
構成パターンとレイアウトの詳細は `references/slide-layouts.md` を参照すること。

**構成の基本フレーム（6〜10枚）**

```
Slide 1   : タイトル（テーマ・出典バッジ）
Slide 2   : 概要・背景（数字・トレンドで裏付け）
Slide 3〜N-2 : メインコンテンツ（テーマに応じて柔軟に設計）
Slide N-1 : まとめ（3〜5つのキーポイント）
Slide N   : 参考リンク・出典URL一覧
```

---

## Step 4: HTMLスライド生成

### デザイン原則

- フォント: Noto Sans JP（本文）+ JetBrains Mono（コード）
- アクセントカラー: 1色のみ（`--accent` 変数で制御）
- 文字中心・広い余白・箇条書き主体
- スライドサイズ: **960px × 540px 固定（16:9）**、`transform: scale()` でフィット

詳細なCSS変数・カラーパレット → `references/design-tokens.md` を参照。

### 生成手順

1. `assets/base-template.html` をコピーして土台にする
2. `assets/styles/` の4ファイルを `<style>` に統合する（theme-vars → slide-core → nav-controls → list-view の順）
3. `references/slide-layouts.md` を参照しながら、各スライドのHTMLを `<section class="slide">` で記述する
4. `assets/scripts/` の4ファイルを `<script>` に統合する（fit-slide → theme-toggle → view-toggle → navigation の順）

### 機能チェック

生成後に以下が実装されていることを確認する。

| 機能 | 実装方法 |
|------|---------|
| 16:9固定 + スケーリング | `.slide-scaler` + `fitSlide()` |
| ライト/ダーク切替 | `[data-theme="dark"]` CSS変数 + `toggleTheme()` |
| hero ⇄ list モード切替 | `[data-view="list"]` CSS + `toggleView()` |
| 左右ナビ矢印 | `.nav-arrow` + `navigate()` |
| プログレスバー・番号 | `#progress-bar` + `#slide-counter` |
| キーボード操作 | `←→` 移動、`Space` 次へ、`F` フルスクリーン、`V` ビュー切替 |

---

## Step 5: 出力

- ファイル名: `{テーマ}-slides.html`
- 保存先: `/mnt/user-data/outputs/`
- `present_files` で提示

---

## クオリティチェックリスト

出力前に確認する。

- [ ] Web検索から得た実際の情報が含まれているか（架空のデータNG）
- [ ] スライド枚数が 6〜10枚の範囲内か
- [ ] 960×540px（16:9）固定サイズになっているか
- [ ] ブラウザリサイズ時に `transform: scale()` でフィットするか
- [ ] ライト／ダークテーマ切り替えが動作するか
- [ ] ヒーロー／一覧モード切り替えがテーマトグルの右隣にあり動作するか
- [ ] 一覧モードで縦スクロール表示になり、クリックでヒーローに戻るか
- [ ] 左右ナビ矢印が最初・最後で非表示になるか
- [ ] キーボードナビゲーション（←→ / Space / F / V）が動作するか
- [ ] スライド番号・プログレスバーが正しく動作するか
- [ ] 出典URLが参考リンクスライドに含まれているか
- [ ] 日本語フォントが正しく読み込まれているか
