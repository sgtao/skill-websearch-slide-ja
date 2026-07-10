# Slide Layouts

スライド構成の設計パターンと、各スライドタイプのレイアウト定義。
Step 3（構成設計）と Step 4（HTML生成）で参照すること。

---

## 標準構成テンプレート（6〜10枚）

```
Slide 1   : タイトルスライド
              タイトル、サブタイトル、出典バッジ（GitHub ⭐ / X 🐦）

Slide 2   : 概要・背景
              なぜこのテーマが重要か（数字・トレンドで裏付け）

Slide 3〜N-2 : メインコンテンツ（テーマごとに柔軟に設計）
              例）トップリポジトリ / 人気Skill紹介
                  使い方パターン / Tips集
                  ユースケース事例 / 比較・対比

Slide N-1 : まとめ・ポイント整理
              3〜5つのキーポイント

Slide N   : 参考リンク・出典
              収集したURL一覧
```

---

## スライドタイプ別レイアウト

### タイトルスライド

```
┌─────────────────────────────────┐
│                                 │
│   [大きなタイトル]               │
│   [サブタイトル]                 │
│                                 │
│   [出典バッジ: GitHub ⭐ / X 🐦] │
│                                 │
└─────────────────────────────────┘
```

**HTML実装のポイント**
- タイトルは `font-size: 2.4rem` 以上・`font-weight: 700`
- アクセントラインを左ボーダーまたは下線で表現
- バッジは `background: var(--accent-dim)` + `color: var(--accent)` で統一

---

### リスト系スライド（Tips・ポイント羅列）

```
┌─────────────────────────────────┐
│ [スライドタイトル]               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                 │
│  • ポイント1（簡潔に20字以内）   │
│  • ポイント2                    │
│  • ポイント3                    │
│  • ポイント4                    │
│                                 │
│ [補足メモ（小文字・右下）]       │
└─────────────────────────────────┘
```

**HTML実装のポイント**
- `li` に `padding: 0.4em 0` で行間を確保
- 先頭の `•` は `color: var(--accent)` で強調
- 補足メモは `font-size: 0.75rem; color: var(--text-secondary)`

---

### カード系スライド（比較・リポジトリ紹介）

```
┌─────────────────────────────────┐
│ [スライドタイトル]               │
│                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐   │
│ │ 項目A │ │ 項目B │ │ 項目C │   │
│ │ 説明  │ │ 説明  │ │ 説明  │   │
│ │ ⭐数  │ │ ⭐数  │ │ ⭐数  │   │
│ └───────┘ └───────┘ └───────┘   │
└─────────────────────────────────┘
```

**HTML実装のポイント**
- `display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem`
- カード: `background: var(--bg-surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem`
- カード上部に `border-top: 3px solid var(--accent)` でアクセント

---

### 2カラム比較スライド

```
┌─────────────────────────────────┐
│ [スライドタイトル]               │
│                                 │
│ ┌────────────┐ ┌────────────┐   │
│ │  [左項目]  │ │  [右項目]  │   │
│ │  ・説明A   │ │  ・説明A   │   │
│ │  ・説明B   │ │  ・説明B   │   │
│ └────────────┘ └────────────┘   │
└─────────────────────────────────┘
```

**HTML実装のポイント**
- `display: grid; grid-template-columns: 1fr 1fr; gap: 2rem`
- 左右のヘッダ行に異なる `background` で対比を演出

---

### 一覧テーブルスライド（Phase 5 追加）

表形式データが 960×540px のスライド枠に収まらない場合に使用する。
通常の `<section class="slide">` に `slide-fit` クラスを追加することで、
一覧（list）モード時にコンテンツ全体が表示される。

```
┌─────────────────────────────────────────┐
│ [スライドタイトル]                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                           │
│ ┌──────┬──────┬──────────────┬──────────┐ │
│ │ No   │ 日付 │ タイトル      │ 備考     │ │
│ ├──────┼──────┼──────────────┼──────────┤ │
│ │  1   │ ... │ ...          │ ...      │ │
│ │  2   │ ... │ ...          │ ...      │ │
│ │ ...  │ ... │ ...          │ ...      │ │
│ │  N   │ ... │ ...          │ ...      │ │
│ └──────┴──────┴──────────────┴──────────┘ │
│ [出典（小文字・下部）]                      │
│                                           │
└─────────────────────────────────────────┘
  ↑ list モードでは高さが行数に応じて伸びる
```

**HTML実装のポイント**

```html
<section class="slide slide-fit" id="sN">
  <div class="slide-inner" style="justify-content:flex-start; padding-top:26px; padding-bottom:16px;">
    <div class="slide-title">参考：動画一覧（全22本）</div>
    <div class="slide-divider"></div>
    <table class="video-table">
      <thead>...</thead>
      <tbody>...</tbody>
    </table>
    <p style="margin-top:0.7rem; font-size:0.72rem; color:var(--text-secondary);">出典: ...</p>
  </div>
</section>
```

**動作仕様**

| モード | 表示 |
|--------|------|
| hero | 960×540 固定。収まらない行は非表示（`overflow: hidden`） |
| list | 高さがコンテンツに追従し、全行が表示される |
| 印刷 | 高さ可変。テーブルが長い場合はページ跨ぎで全件出力 |

**使用判断の目安**

- テーブル行数が 10 行超 → `slide-fit` を付与
- リスト項目が 20 個超 → `slide-fit` を付与
- 通常の概要・メインコンテンツスライドには使わない

---

### まとめスライド

```
┌─────────────────────────────────┐
│ まとめ                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                 │
│  ① キーポイント1                │
│  ② キーポイント2                │
│  ③ キーポイント3                │
│                                 │
└─────────────────────────────────┘
```

**HTML実装のポイント**
- 番号は `color: var(--accent); font-weight: 700; font-size: 1.2rem`
- 各ポイントは `font-size: 1.1rem; margin: 0.5em 0`

---

### 参考リンクスライド

```
┌─────────────────────────────────┐
│ 参考リンク・出典                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                 │
│  • [タイトル] https://...       │
│  • [タイトル] https://...       │
│  • [タイトル] https://...       │
│                                 │
└─────────────────────────────────┘
```

**HTML実装のポイント**
- `<a href="..." target="_blank">` でリンク化
- `color: var(--accent); text-decoration: none`
- URL が長い場合は `font-size: 0.8rem` に縮小

---

### feature-showcase

左ライト・右ダークの2カラムで機能・手順を1つずつ強調紹介する型。

```html
<section class="slide feature-showcase" id="sN">
  <div class="slide-inner">
    <div class="feature-left">
      <div class="eyebrow">EYEBROW</div>
      <h2>見出し<span class="hl">強調</span></h2>
      <p class="feat-lead">説明文</p>
    </div>
    <div class="feature-right">
      <div class="feature-num">02</div>
      <div class="feat-eyebrow">FEATURE</div>
      <div class="feat-heading">機能名</div>
      <div class="feat-sub">補足</div>
      <ul class="feat-list">
        <li><span class="feat-ico">&#9654;</span><span><span class="feat-label">項目</span><span class="feat-desc">説明</span></span></li>
      </ul>
    </div>
  </div>
</section>
```

**動作仕様**

| モード | 挙動 |
|--------|------|
| ライト | 左＝白（--bg-slide）/ 右＝ダーク（--bg-surface-dark） |
| ダーク | 左右とも --bg-slide（統一ダーク） |
| 印刷 | 右ダーク面を維持（構造視認性を優先） |

- 連番は 01 から。リスト項目は3〜4個推奨。強調は `.hl`（--accent・パレット追従）。
- テンプレート固有CSSはデッキ側 `<style>` 末尾に追記（骨格CSSの統合順は不変）。

---

### comparison-chart

同一指標の前後比較を、左に説明文・右にドーナツ×2で見せる型。

```html
<section class="slide" id="sN">
  <div class="slide-inner">
    <div class="slide-with-description">
      <div class="cmp-left">
        <div class="cmp-big">225GB<small>解放</small></div>
        <h2>...<span class="hl">...</span></h2>
        <div class="cmp-divider"></div>
        <p class="cmp-lead">...</p>
        <div class="cmp-stats">...</div>
      </div>
      <div class="cmp-right">
        <div class="slide-chart comparison">
          <svg viewBox="0 0 720 360" class="chart-svg"><!-- ドーナツ×2＋矢印＋凡例 --></svg>
        </div>
      </div>
    </div>
  </div>
</section>
```

- 座標は `chart-generation.md` の「comparison-chart（2ドーナツ）座標テーブル」を参照。
- **1スライド1グラフ制約の例外**（同一指標の Before/After のみ）。

---

## レイアウトバリアント

スライドディレクティブに `layout:` キーを付与すると、同一 type 内で見た目のバリエーションを選べる。
type 自体の意味・データ構造は変えない（見た目のみを変更）。

```markdown
<!-- slide: points, layout: two-col -->
<!-- slide: title, layout: title-xl -->
<!-- slide: points, layout: compact -->
```

| layout 値 | 適用可能な type | 効果 |
|---|---|---|
| （なし・既定） | 全 type | 現行の標準レイアウト |
| `two-col` | points / summary | 1列の箇条書きを2カラムに分割（項目数が多いとき） |
| `title-xl` | title | 大見出しをさらに拡大、余白を広げる |
| `compact` | points / table / summary | 行間・余白を詰めて情報密度を上げる |

未知の `layout:` 値は無視して既定レイアウトにフォールバックする（エラーにしない）。

### two-col（HTML実装のポイント）

```html
<ul class="points layout-two-col">
  <li>...</li>
  <li>...</li>
</ul>
```
```css
.layout-two-col { columns: 2; column-gap: 2rem; }
.layout-two-col li { break-inside: avoid; }
```

### title-xl（HTML実装のポイント）

```html
<div class="slide-inner layout-title-xl">
  <h1>...</h1>
</div>
```
```css
.layout-title-xl h1 { font-size: 3.2rem; }
.layout-title-xl { padding: 64px 88px; }
```

### compact（HTML実装のポイント）

```html
<ul class="points layout-compact">...</ul>
```
```css
.layout-compact li { padding: 0.15em 0; font-size: 0.88rem; }
.layout-compact .slide-inner { gap: 0.3rem; }
```

**注**: 上記CSSはデッキ側 `<style>` 末尾に追記する（骨格CSSの統合順は不変。既存のコンテンツCSS方式を踏襲）。


## スライド選択ガイド

| 情報の種類 | 推奨レイアウト |
|-----------|--------------|
| 単一テーマの紹介 | タイトル → リスト |
| リポジトリ・ツール比較（3〜4件） | カード系 |
| AとBの対比 | 2カラム比較 |
| Tips・テクニック集 | リスト系 |
| 数値・トレンドの提示 | リスト系 + 補足メモ |
| 10行超のテーブル・全件一覧 | 一覧テーブル（`slide-fit`） |
| 締めくくり | まとめ |
| 機能・手順の1つずつ強調 | feature-showcase |
| 同一指標の前後比較 | comparison-chart（ドーナツ×2） |

---

## 3枚ミニスライド構成（情報量不足時の代替テンプレート）

「会話のみ」モードで情報量不足と判定され、かつユーザーが「3枚でOK」を選択した場合に使用する。
3枚固定のコンパクト構成で、空スライドの生成を防ぐ。

### 構成テンプレート

```
Slide 1 : サマリ（タイトル ＋ 概要・背景を融合）
Slide 2 : 本文（要点を1枚に凝縮、箇条書き主体）
Slide 3 : まとめ（結論 ＋ 参考リンクを融合）
```

### 各スライドの詳細

#### Slide 1 — サマリ

```
┌─────────────────────────────────┐
│  [大きなタイトル]                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                 │
│  [概要・背景を2〜3文で記述]      │
│  ・このテーマがなぜ重要か        │
│  ・対象読者にとっての意義        │
│                                 │
└─────────────────────────────────┘
```

**実装のポイント**
- タイトル: `font-size: 2.2rem; font-weight: 700`
- 概要テキスト: `font-size: 1.05rem; line-height: 1.8`
- 通常のタイトルスライドと概要スライドを1枚に統合するため、余白を通常より狭める

#### Slide 2 — 本文

```
┌─────────────────────────────────┐
│  要点                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                 │
│  ① 要点1（20字以内で簡潔に）   │
│     補足説明（1〜2文）          │
│                                 │
│  ② 要点2                       │
│     補足説明（1〜2文）          │
│                                 │
│  ③ 要点3                       │
│     補足説明（1〜2文）          │
│                                 │
└─────────────────────────────────┘
```

**実装のポイント**
- 要点は3〜5個に絞る（会話履歴から抽出できた分のみ）
- 番号: `color: var(--accent); font-weight: 700; font-size: 1.15rem`
- 補足説明: `font-size: 0.9rem; color: var(--text-secondary); margin-left: 1.5rem`

#### Slide 3 — まとめ

```
┌─────────────────────────────────┐
│  まとめ                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                 │
│  [結論を1〜2文で端的に]          │
│                                 │
│  ─────────────────────────      │
│  参考リンク                      │
│  • [タイトル] https://...       │
│  • [タイトル] https://...       │
│                                 │
└─────────────────────────────────┘
```

**実装のポイント**
- 結論テキスト: `font-size: 1.1rem; font-weight: 600`
- 参考リンクセクションは罫線（`border-top: 1px solid var(--border)`）で区切る
- リンクなし（会話のみモード）の場合は参考リンク欄を省略してよい

### 3枚ミニモードの注意事項

- スライド枚数は必ず **3枚固定**。情報量が多くても増やさない
- Web検索で補う場合（ハイブリッドモード）は通常の 6〜10枚モードに切り替える
- クオリティチェックの「スライド枚数が 6〜10枚」チェックは 3枚ミニモード時には適用しない
