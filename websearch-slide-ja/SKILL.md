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
1-A. 情報ソース確認（会話のみ / ハイブリッド / Web検索メイン）
1-B. テーマ・ロール確認
1-C. 検索フレーズ提案（Web検索する場合のみ）
2.   Web検索・情報収集（「会話のみ」選択時はスキップ）
3.   情報の構造化・スライド構成の設計
4.   HTMLスライド生成
5.   ファイル出力・提示
```
---
## 参照ファイルガイド
このSkillは以下の参照ファイル・アセットを持つ。各ステップで該当ファイルを必ず読むこと。
| ファイル | 読むタイミング |
|---------|--------------|
| `references/source-selection.md` | Step 1-A で情報ソースを判定するとき・下限チェックを行うとき |
| `references/role-signals.md` | Step 1-B 開始時に**必ず**読む（シグナルワード照合・ヒアリング指針） |
| `references/search-patterns/index.md` | ロールが「汎用」と判定されたとき・クロス職種テーマのとき |
| `references/search-patterns/tech.md` | 推定ロールが技術系（エンジニア / EM / DS / デザイナー）のとき |
| `references/search-patterns/business.md` | 推定ロールがビジネス系（PM / 経営 / マーケ / 営業 / 財務 / コンサル / オペレーション / 人事）のとき |
| `references/search-patterns/specialist.md` | 推定ロールが専門職（法務 / 研究者 / 医療 / 教育者 / 学生 / ライター）のとき |
| `references/slide-layouts.md` | Step 3 でスライド構成を決めるとき、Step 4 で各スライドを書くとき |
| `references/design-tokens.md` | Step 4 でCSS変数（色・フォント）を埋め込むとき |
| `assets/base-template.html` | Step 4 の開始時に必ずコピーして土台にする |
| `assets/styles/*.css` | テンプレートに埋め込むCSS群（theme-vars / slide-core / nav-controls / **figure** / list-view の順で統合・全5ファイル） |
| `assets/scripts/*.js` | テンプレートに埋め込むJS群（fit-slide / theme-toggle / view-toggle / navigation の順で統合） |
| `assets/fallback-image.html` | Step 4 で画像を埋め込む場合、`<script>` に `createFallback()` をコピーする |
---
## Step 1-A: 情報ソース確認
`references/source-selection.md` を参照し、以下の手順で情報ソースを確定する。
### 1. `ask_user_input_v0` で選択肢を提示
スキル起動直後に必ず以下の選択肢をユーザーに提示する。
```
質問: スライド作成にどの情報を使いますか？
選択肢:
  - 「会話の内容だけでOK」
  - 「Web検索も追加する（会話 ＋ 検索）」
  - 「Web検索メインで（検索中心）」
```
### 2. 「会話の内容だけでOK」選択時 — 下限チェック
`references/source-selection.md` の4観点チェックを実施する。
- **不足なし**（2観点未満が該当）→ **通常モード（6〜10枚）** で Step 1-B へ
- **不足あり**（2観点以上が該当）→ 以下の再確認を行う
**再確認メッセージ（例）**
> 「会話の情報量が少ないため、サマリ・本文・まとめの3枚スライドで提案します。
> どうしますか？」
再確認の選択肢:
- 「Web検索で補う（6〜10枚）」→ **ハイブリッドモード** → Step 1-C へ
- 「3枚でOK（ミニモード）」  → **3枚ミニモード確定** → Step 1-B へ
- 「作成を中止する」         → **スキルを終了** → 終了メッセージを出して処理を止める
> **中止時の終了メッセージ例**
> 「承知しました。テーマや情報が整ったら改めてお声がけください。」
> → それ以上の処理（検索・生成）は一切行わない。
### 3. その他の選択時
- 「Web検索も追加する」→ **ハイブリッドモード** → Step 1-B へ
- 「Web検索メインで」 → **Webメインモード**（従来動作） → Step 1-B へ
---
## Step 1-B: テーマ・ロール確認
会話履歴から以下を自動抽出し、不足分のみユーザーにヒアリングする。
| 項目 | 抽出方法 | 不足時の対応 |
|------|---------|------------|
| テーマ | 会話履歴の主題から推定 | 「何についてのスライドですか？」と質問 |
| 対象読者 | 文脈から推定（社内向け／顧客向けなど） | 「誰に見せるスライドですか？」と質問 |
| ユーザーロール | `references/search-patterns.md` の「ロール推定ヒント」で照合 | 職種シグナルが0件の場合のみ確認 |
| スライド枚数 | 選択モードに応じて自動決定（3枚 or 6〜10枚） | 明示的な指定がある場合はそちらを優先 |
**ロール推定の手順**
1. `references/role-signals.md` を読み込む（Step 1-B 開始時に**必ず**実施）
2. 会話履歴をスキャンし、シグナルワード対応表を照合する
3. 2個以上ヒットしたカテゴリを推定ロールとして採用し、対応する `参照ファイル` 列を確認する
4. 推定できた場合はヒアリングをスキップし、Step 1-C へ進む
5. 推定できなかった場合は `role-signals.md` のヒアリング指針に従って確認する
---
## Step 1-C: 検索フレーズ提案
> **スキップ条件**: Step 1-A で「会話の内容だけでOK」が確定し、かつ下限チェックで
> 「3枚でOK」が選択された場合は、このステップをスキップし Step 3 へ進む。
`references/role-signals.md` で特定した推定ロールに対応するファイルを読み込み、クエリを生成する。
### 手順
1. `role-signals.md` の「参照ファイル」列で該当ファイルを確認する
2. 該当の `search-patterns/[カテゴリ].md` を読み込む（汎用の場合は `search-patterns/index.md`）
3. ロールに対応するクエリパターンにテーマを代入し、**デフォルト3個**の検索フレーズ候補を生成する
   - 3個がデフォルト（トークン節約・検索回数削減のため）
   - テーマが広い・複数視点が必要な場合は最大5個まで増やしてよい
4. 候補をユーザーに提示し、修正・追加・削除を受け付ける
**提示例（テーマ「Claude Code」、ロール「エンジニア」の場合）**
```
以下の検索フレーズで情報を集めようと思います。修正・追加はありますか？
（デフォルト3本。追加が必要なら教えてください）
1. claude code skill github stars
2. claude code tips tricks 2025
3. claude code 使い方 まとめ site:zenn.dev
```
5. 検索フレーズの確認と同時に、`ask_user_input_v0` で以下も尋ねる：

```
質問: スライドに画像を含めますか？
選択肢:
  - 「画像あり（Web 検索で取得）」
  - 「テキストのみでOK」
```

6. ユーザーの確認・修正後、確定したフレーズと画像方針を記録して Step 2 へ進む
---
## Step 2: Web検索・情報収集
> **スキップ条件**: Step 1-A で「会話の内容だけでOK」が選択され、
> かつ Step 1-C をスキップした場合は、このステップを実行しない。
> 代わりに会話履歴から情報を構造化し、Step 3 へ直接進む。
>
> **ハイブリッドモード**: 会話履歴の情報を先に構造化し、
> 不足するトピック・具体例・数値を以下の検索で補完する。
### 基本検索クエリ
テーマに応じて以下を組み合わせる。職種が判明している場合は Step 1-C で読み込んだ `search-patterns/[カテゴリ].md` のクエリを優先する。
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
- 検索回数は **デフォルト3回**（Step 1-C で確定したフレーズをそのまま使う）
- ユーザーがフレーズを追加した場合・テーマが広い場合は最大5回まで実施してよい
- 2024〜2026年の情報を優先（技術トレンドの変化により、古い情報は価値が下がる可能性が高いため）
- GitHubのスター数・フォーク数、Xのいいね数を信頼性指標として活用

### 画像 URL の収集（「画像あり」選択時のみ）

Step 1-C で「画像あり」が選択された場合のみ実行する。「テキストのみ」の場合はスキップ。

テキスト検索の完了後、**`image_search` ツールを1回実行**して画像候補を取得する。

**手順**
1. テーマに関連するクエリで `image_search` を1回呼ぶ（例：`VSCode extensions popular icons`）
2. 返された画像 URL と出典ページ URL を `references/image-embedding.md` の判断基準でフィルタする
3. 1スライドにつき **最大 1 件** を目安に候補を絞る
4. 収集結果を以下の形式で**必ず出力する**（0件の場合も「なし」と明記する）：

```
[画像収集リスト]
スライド 3: 画像URL https://... / 出典ページ https://... / 説明「〇〇のスクリーンショット」
スライド 5: 画像URL https://... / 出典ページ https://... / 説明「〇〇のロゴ」
スライド 4: なし（適切なURLが見つからなかったため）
```

> **重要**: `web_search` はテキストスニペットのみを返す。画像 URL の取得には必ず `image_search` ツールを使うこと。
> **会話のみモード（3枚ミニ含む）の場合は画像収集をスキップする。**
---
## Step 3: スライド構成の設計
収集した情報を整理し、スライド構成を決める。
構成パターンとレイアウトの詳細は `references/slide-layouts.md` を参照すること。
**構成モードの選択**
| モード | 枚数 | 使用条件 |
|--------|------|---------|
| 通常モード | 6〜10枚 | Web検索あり・またはハイブリッドで情報量十分 |
| 3枚ミニモード | 3枚固定 | 「会話のみ」かつ情報量不足でユーザーが「3枚でOK」を選択 |
**通常モードの構成フレーム（6〜10枚）**
```
Slide 1   : タイトル（テーマ・出典バッジ）
Slide 2   : 概要・背景（数字・トレンドで裏付け）
Slide 3〜N-2 : メインコンテンツ（テーマに応じて柔軟に設計）
Slide N-1 : まとめ（3〜5つのキーポイント）
Slide N   : 参考リンク・出典URL一覧
```
**3枚ミニモードの構成フレーム**
`references/slide-layouts.md` の「3枚ミニスライド構成」セクションを参照すること。
```
Slide 1 : サマリ（タイトル ＋ 概要・背景を融合）
Slide 2 : 本文（要点を1枚に凝縮、箇条書き主体）
Slide 3 : まとめ（結論 ＋ 参考リンクを融合）
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
2. `assets/styles/` の5ファイルを `<style>` に統合する（theme-vars → slide-core → nav-controls → figure → list-view の順）
3. `references/slide-layouts.md` を参照しながら、各スライドのHTMLを `<section class="slide">` で記述する
4. **画像埋め込み（Web 検索モード時のみ）** — `references/image-embedding.md` と `assets/fallback-image.html` を参照

    `references/image-embedding.md` の判断フローを実行する。

    ```
    Step 2 の「[画像収集リスト]」を確認
    ↓
    各候補について image-embedding.md の 1〜4 を順に判定
    ↓
    OK → <figure class="slide-figure"> で埋め込む
    NG / なし → 画像埋め込みをスキップ（テキストのみ）
    ```

    埋め込む画像が1件でもある場合、`assets/fallback-image.html` を開いて
    `createFallback()` 関数を `<script>` ブロックの先頭にコピーする（必須）。
    全 `<img>` の `onerror` 属性にこの関数を設定する。

    HTMLパターン例:
    ```html
    <figure class="slide-figure">
      <img
        src="https://example.com/image.png"
        alt="VSCode 拡張機能 ABC のスクリーンショット"
        onerror="this.parentElement.replaceWith(createFallback('https://example.com/page', 'ABC スクリーンショット'))"
      >
      <figcaption>
        出典: <a href="https://example.com/page" target="_blank" rel="noopener">example.com</a>
      </figcaption>
    </figure>
    ```
5. `assets/scripts/` の4ファイルを `<script>` に統合する（fit-slide → theme-toggle → view-toggle → navigation の順）
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
- [ ] スライド枚数が 6〜10枚の範囲内か（通常モード）
- [ ] 960×540px（16:9）固定サイズになっているか
- [ ] ブラウザリサイズ時に `transform: scale()` でフィットするか
- [ ] ライト／ダークテーマ切り替えが動作するか
- [ ] ヒーロー／一覧モード切り替えがテーマトグルの右隣にあり動作するか
- [ ] 一覧モードで縦スクロール表示になり、クリックでヒーローに戻るか
- [ ] 左右ナビ矢印が最初・最後で非表示になるか
- [ ] キーボードナビゲーション（←→ / Space / F / V）が動作するか
- [ ] スライド番号・プログレスバーが正しく動作するか
- [ ] 出典URLが参考リンクスライドに含まれているか
- [ ] 画像を埋め込んだ場合、全画像に出典リンク（figcaption）が明記されているか
- [ ] 画像の `onerror` フォールバック（`createFallback()`）が `<script>` に含まれているか
- [ ] 会話のみモード（3枚ミニ含む）で画像収集・埋め込みが実行されていないか
- [ ] 日本語フォントが正しく読み込まれているか
- [ ] 情報ソース（会話のみ / ハイブリッド / Web検索メイン）がユーザーに確認されているか
- [ ] 検索する場合、検索フレーズ候補3〜5個がユーザーに提示・承認されているか
- [ ] 3枚ミニモード時、スライド枚数が厳密に3枚になっているか
- [ ] 情報量不足・中止選択時、検索やHTML生成が実行されていないか
