# Export Recipes — PDF / PNG エクスポート実装ガイド

Web 検索で生成したスライド HTML に PDF / PNG エクスポート機能を組み込む際の参照ファイル。
**Step 4（HTML 生成）** でエクスポート機能を組み込むときに参照すること。

---

## 1. エクスポート方式の概要

3 種類のエクスポート機能を提供する。すべて生成 HTML 単体で動作し、追加サーバーは不要。

| 方式 | 起動方法 | 依存ライブラリ | 自己完結性 | 主な用途 |
|------|---------|---------------|-----------|---------|
| **PDF（印刷ダイアログ経由）** | `P` キー / 📥メニュー | なし（標準 `window.print()`） | ◎ オフライン可 | 配布用 PDF、印刷物 |
| **単一 PNG ダウンロード** | `Shift+S` / 📥メニュー | html2canvas（CDN 動的ロード） | △ ネット必須 | SNS 投稿、サムネイル |
| **全スライド ZIP ダウンロード** | `Shift+P` / 📥メニュー | html2canvas + JSZip（CDN 動的ロード） | △ ネット必須 | 一括アーカイブ |

> **設計原則**: スライドの「閲覧」は完全自己完結（外部リソースなし）。
> エクスポート時のみ CDN を動的ロードする。
> ネット不通時は PDF（標準 API のみ）が確実に動く。

---

## 2. PDF エクスポート（標準 API のみ）

### 仕組み

`window.print()` でブラウザの印刷ダイアログを起動する。ユーザーは「保存先：PDF として保存」を選ぶことで PDF 化できる。`print.css` の `@media print` が「1 ページ = 1 スライド」を保証する。

### 重要：hero / list 両モード対応

ユーザーは 2 つのルートで印刷を起動できる:

| ルート | hero モード時の挙動 |
|--------|-------------------|
| **`P` キー / 📥メニュー（`exportPDF()` 経由）** | `body` に `.exporting-pdf` クラスを付与 → list モードへ一時切替 → `window.print()` |
| **ブラウザの `Ctrl+P` 直接押下** | `exportPDF()` を経由しないため、上記の準備処理はスキップされる |

どちらのルートでも 1 ページ = 1 スライドが成立するよう、`print.css` の `@media print` ブロック内で hero モードの CSS（`opacity: 0`・`position: absolute`・`transform: scale()`）をすべて上書きしている。これにより**ユーザーがどのルートで印刷しても同じ結果**になる。

### `exportPDF()` の処理フロー

```
1. body に .exporting-pdf クラスを付与
2. currentView が 'hero' なら list モードに一時切替（applyView() を呼ぶ）
3. requestAnimationFrame ×2 でレイアウト確定を待つ
4. window.print() を呼ぶ
5. afterprint イベントで body のクラスを除去
   （currentView は元に戻さない：ユーザーが手動切替で十分）
```

### よくある問題と対処

| 症状 | 原因 | 対処 |
|------|------|------|
| 1 ページに 1 スライドが収まらない | `@page` のサイズが用紙設定と合っていない | `print.css` の `@page { size: 1280px 720px landscape; }` を確認。ユーザー側で「実際のサイズ」を選ぶよう案内 |
| 余白ページが大量に出力される | `page-break-after: always` が効いていない | 最終スライドだけ `page-break-after: auto` にしているか確認 |
| 文字が白くなり読めない | ダークテーマで印刷した | `print.css` の `@media print` 内で `[data-theme="dark"]` の CSS 変数を上書き済み。それでも問題があればブラウザの「背景のグラフィック」設定を ON に |
| アクセント色が白黒に出力される | ブラウザの色印刷設定が無効 | `print-color-adjust: exact` を全要素に指定済み。ブラウザ印刷ダイアログの「背景のグラフィック」も ON 推奨 |
| hero モードから印刷したら 1 枚しか出ない | `exporting-pdf` クラスが付いていない（古い実装の名残） | `@media print` 内で `opacity: 1 !important` を `.slide` に直接指定しているため、最新版では発生しない |

---

## 3. 単一 PNG エクスポート（html2canvas 動的ロード）

### 仕組み

[html2canvas](https://html2canvas.hertzen.com/) を CDN から動的に読み込み、現在表示中のスライド DOM をキャンバスに描画 → PNG として `<a download>` でダウンロード。

```
CDN: https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
```

### `exportSinglePNG()` の処理フロー

```
1. loadScript(HTML2CANVAS_CDN) で動的読込（2 回目以降はキャッシュ）
2. document.querySelectorAll('.slide')[cur] で現在スライドを取得
3. html2canvas(slide, { width: 960, height: 540, scale: 2, useCORS: true })
4. canvas.toBlob() → URL.createObjectURL() → <a download> クリック
5. URL.revokeObjectURL() でメモリ解放
```

### オプション設定の根拠

| オプション | 値 | 理由 |
|-----------|----|----|
| `width` / `height` | `960` / `540` | スライドのネイティブサイズ。`transform: scale()` の影響を受けないよう原寸を指定 |
| `scale` | `2` | レティナ相当（1920×1080）で書き出す。SNS 投稿・スライドサムネイルとして十分な品質 |
| `useCORS` | `true` | CORS 対応の外部画像をキャプチャ可能にする |
| `backgroundColor` | `getComputedStyle(document.body).backgroundColor` | 現在のテーマ（ライト/ダーク）の背景色を引き継ぐ |

> **注意**: PDF エクスポートと違い、PNG はユーザーの現在テーマで出力される。
> ダークテーマで PNG が必要な場合はそのままダーク背景、ライトテーマならライト背景になる。

---

## 4. 全スライド ZIP エクスポート（html2canvas + JSZip）

### 仕組み

全 `.slide` 要素を順に html2canvas でキャプチャ → 各 PNG を JSZip に追加 → 生成された ZIP blob を `<a download>` でダウンロード。

```
JSZip CDN: https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
```

### `exportAllPNG()` の処理フロー

```
1. loadScript(HTML2CANVAS_CDN)  → 並行ロード可能
2. loadScript(JSZIP_CDN)        → 並行ロード可能
3. const zip = new JSZip();
4. for (let i = 0; i < allSlides.length; i++) {
     const canvas = await html2canvas(allSlides[i], { ... });
     const base64 = canvas.toDataURL('image/png').split(',')[1];
     zip.file(`slide-${String(i+1).padStart(2,'0')}.png`, base64, { base64: true });
   }
5. const blob = await zip.generateAsync({ type: 'blob' });
6. <a download="slides.zip"> クリック
```

### ファイル名規則

- ZIP ファイル名: `slides.zip`
- 内部の個別 PNG: `slide-01.png`, `slide-02.png`, ... `slide-NN.png`（2 桁 0 埋め）

10 枚以上のスライドでもソート順が崩れないよう、0 埋め必須。

---

## 5. 動的スクリプトロードのヘルパー実装

両 PNG エクスポート関数で共通利用する。

```javascript
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // 既にロード済みならスキップ
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}
```

> 重複ロードを `querySelector` でガードする。ネットワーク再試行は行わず、
> 失敗した時点でユーザーに alert で通知する設計（後述）。

---

## 6. エラーハンドリングと CORS

### CORS（クロスオリジンリソース共有）エラー

スライドに埋め込んだ外部画像が CORS 対応していない場合、html2canvas はキャプチャできずに失敗する。多くのケースで `useCORS: true` で解消するが、サーバー側が `Access-Control-Allow-Origin` ヘッダーを返さなければ失敗は不可避。

### ユーザーへの通知パターン

```javascript
try {
  await loadScript(HTML2CANVAS_CDN);
  const canvas = await html2canvas(slide, { ... });
  // ダウンロード処理
} catch (e) {
  alert(
    'PNGエクスポートに失敗しました。\n' +
    '以下のいずれかが原因の可能性があります：\n' +
    '・ネットワーク接続が不安定（html2canvas のロード失敗）\n' +
    '・外部画像が CORS 未対応\n' +
    '・ブラウザがダウンロードをブロック\n\n' +
    '詳細: ' + e.message
  );
}
```

> `console.error` だけだと一般ユーザーは気づかない。
> alert で明示的に通知し、原因の候補を箇条書きで示す。
> PDF エクスポートは標準 API のみで動くため、PNG が使えない環境では PDF を案内する。

### フォールバック画像の扱い

Phase 2 で導入した `createFallback()` は通常の DOM 要素として生成される（外部リソースなし）。
そのため html2canvas は問題なくキャプチャでき、「画像を読み込めませんでした」というプレースホルダーがそのまま PNG に焼き込まれる。

---

## 7. キーボードショートカット

`navigation.js` の既存キーボードハンドラに以下を追加する:

| キー | 動作 | 実装上の注意 |
|------|------|-------------|
| `P` | PDF 印刷ダイアログを起動 | Shift なし。`Ctrl+P` はブラウザ標準を奪わない |
| `Shift+S` | 現在スライドの PNG ダウンロード | `e.key === 'S'`（大文字判定）で OK |
| `Shift+P` | 全スライドの ZIP ダウンロード | `Ctrl+Shift+P` は DevTools のコマンドパレットと衝突するため `e.ctrlKey` を判定して除外 |

```javascript
if (e.key === 'p' && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); exportPDF(); }
if (e.key === 'P' && e.shiftKey  && !e.ctrlKey) { e.preventDefault(); exportAllPNG(); }
if (e.key === 'S' && e.shiftKey  && !e.ctrlKey) { e.preventDefault(); exportSinglePNG(); }
```

---

## 8. 統合チェックリスト

Step 4 で HTML 生成後、以下を確認する。

### CSS 統合
- [ ] `print.css` を最後に統合した（統合するファイルと順序の正は `workflows/legacy-build.md`）

### JS 統合
- [ ] `export-pdf.js` → `export-png.js` の相対順を守って統合した（全体の統合順の正は `workflows/legacy-build.md`）

### HTML 要素
- [ ] `.control-cluster` 内に `.export-menu` を追加した
- [ ] `#export-dropdown` に 3 つのボタン（PDF / 単一 PNG / ZIP）を含めた
- [ ] `navigation.js` のキーボードハンドラに `P` / `Shift+S` / `Shift+P` を追加した

### 動作確認
- [ ] hero モードで `P` キー → 1 ページ = 1 スライドの印刷プレビュー
- [ ] list モードで `P` キー → 同上
- [ ] hero モードで `Ctrl+P` 直接 → 同上（`print.css` の二重防御を確認）
- [ ] `Shift+S` で現在スライドの PNG がダウンロードされる
- [ ] `Shift+P` で `slides.zip` がダウンロードされ、内部に連番 PNG が含まれる
- [ ] ネット切断状態で PDF は動く、PNG は alert でエラー通知

---

## 9. トラブルシューティング早見表

| 症状 | 確認ポイント | 対処 |
|------|------------|------|
| 印刷で 1 枚しか出ない | `@media print` の `.slide` に `opacity: 1 !important` があるか | `print.css` を最新版に差し替え |
| 印刷で文字が切れる | `@page` のサイズと用紙設定が一致しているか | `@page { size: 1280px 720px landscape; margin: 0; }` |
| PDF が複数ページに分割される（1 スライドが 2 ページに） | スライド内コンテンツが 720px を超えているか | `.slide-inner` の `padding` を縮める or コンテンツ量を減らす |
| アクセント色が出力されない | `print-color-adjust: exact` が指定されているか | `print.css` の `@media print` 内で全要素に指定済み |
| PNG が真っ白になる | html2canvas のバージョンが古いか、CORS エラー | `html2canvas@1.4.1` を確認、ネットワークを確認 |
| ZIP の中身が 0 バイト | JSZip のロード失敗、または base64 変換ミス | コンソールでエラーを確認 |
| Shift+P が DevTools と衝突 | `e.ctrlKey` の判定が抜けている | `!e.ctrlKey` を条件に追加 |
| エクスポートメニューが開かない | `toggleExportMenu()` がグローバル定義されているか | `export-pdf.js` 末尾に定義済みか確認 |
| 印刷後にスライドが list モードのまま | `afterprint` イベントで戻していないため意図通り | ユーザーが手動で `V` キー、または📥メニュー外クリックで対応可 |

---

## 10. 既知の制約

- **html2canvas は CSS の一部に未対応**: `backdrop-filter`、複雑な `clip-path`、CSS グリッドの一部などは正確に再現されない。本スキルのスライドは単純な flex/grid のみ使うので影響は最小限
- **インライン SVG は OK、`<img src="*.svg">` はサーバー設定次第で NG**: Phase 2/3 の方針通り SVG はインライン展開のみ使うので問題なし
- **ブラウザの印刷ダイアログ UI はユーザー操作必須**: ボタンクリックだけで PDF を自動保存する機能は仕様上不可能（セキュリティ）
- **PNG 出力の最大サイズはブラウザ依存**: Chrome は 16384×16384 px が上限。本スキルは 1920×1080 で書き出すため影響なし

---

## 関連ファイル

- `assets/styles/print.css` — 印刷時 CSS（@media print + hero モード対応）
- `assets/scripts/export-pdf.js` — `exportPDF()` + メニュートグル関数
- `assets/scripts/export-png.js` — `exportSinglePNG()` / `exportAllPNG()` + `loadScript()`
- `assets/base-template.html` — `.control-cluster` 内に `.export-menu` を追加
- `assets/scripts/navigation.js` — キーボードショートカット追加
