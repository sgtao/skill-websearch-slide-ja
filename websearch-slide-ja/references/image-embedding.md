# Image Embedding Rules

Web 検索で得た画像 URL をスライドに埋め込む際のルール・判断基準。
Step 2（画像 URL 収集）と Step 4（HTML 生成）で参照すること。

---

## 埋め込み判断フロー

以下の順に判定し、すべて OK の場合のみ埋め込む。

1. **URL の形式** — `https://` で始まる完全 URL か？ → NG なら除外
2. **ファイル形式** — URL が明らかに非画像ファイルでないか？
   → 拡張子が `.pdf` `.doc` `.docx` `.ppt` `.pptx` `.xls` `.xlsx`
     `.zip` `.html` `.htm` のいずれかで終わる URL は **除外**（テキストリンクへ）
   → 検索結果ページの「資料」「レポート」等のリンクを画像 URL と取り違えないこと。
     `<img>` の src に使える確証（.jpg/.png/.gif/.webp/.svg 等の拡張子、
     または明確に画像であると確認できる CDN URL）がない場合は埋め込まない
   → **背景**: PDF 等をそのまま `<img src>` に使うと、file:// で直接開いた際に
     ブラウザが内蔵ビューアでフレーム読み込みを試み、コンソールに
     セキュリティエラーが出ることがある（詳細は `references/output-validation.md`）
3. **信頼できるドメイン** — 下記ホワイトリストに含まれるか？
   - `github.com`, `githubusercontent.com`
   - `cdn.*.com` 形式の CDN
   - `*.githubusercontent.com`, `*.cloudfront.net`
   - ニュースサイト・公式ブログの画像ドメイン
   → 判定不能な場合は **テキストリンクにフォールバック**
4. **コンテンツ関連性** — スライドのテーマと直接関連するか？
   → 装飾目的だけの画像は除外
5. **サイズ感** — ロゴ・サムネイル・スクリーンショット系か？
   → 人物写真・アート画像は避ける（著作権リスク）

---

## 出典明記ルール（必須）

すべての埋め込み画像に以下を付与する。省略は禁止。

```html
<figure class="slide-figure">
  <img
    src="{画像URL}"
    alt="{画像の説明（日本語）}"
    onerror="this.parentElement.replaceWith(createFallback('{出典URL}', '{説明}'))"
  >
  <figcaption>
    出典: <a href="{出典ページURL}" target="_blank" rel="noopener">{出典サイト名}</a>
  </figcaption>
</figure>
```
