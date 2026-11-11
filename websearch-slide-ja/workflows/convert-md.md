# convert-md — スライドMD を HTML に変換する（エントリポイント B）

> 先に読むもの: `references/environment.md`。変換と出力は `workflows/build.md`。
> 対象は、SKILL.md の「入力タイプ判定」で**完全スライドMD**と判定された入力。
> `workflows/create.md`・`workflows/write-md.md`・`references/audience-purpose.md` は読まない。

## 流れ

簡易確認 → Step 2.5 → 4-B → 5（Step 1〜3 と検索はスキップ）

1. `workflows/build.md` の「Step 2.5」を、変換の直前に実行する（会話内で診断済みなら使い回す）
2. `workflows/build.md` の「Step 4-B」で変換する（Step 4-A はスキップ）
3. `workflows/build.md` の「Step 5」で保存・自己検証・提示・完了報告を行う

## このモードの約束

- `source-selection.md` のゲート群を通らず、Web検索も行わない
- ユーザーが用意した MD の本文は書き換えない
- 出典が無いグラフ・図があるときは、勝手に削らず、まず出典をユーザーに確認する
  （`workflows/build.md`「Step 4-B」の「lintの扱い」）
- 自己検証で見つけた指摘は、スライド番号つきで伝え、直すかどうかを選択式で確認する
  （`references/self-review.md`「ユーザーが用意した MD のとき」）
- 完了報告の 5（情報ソース）は「ユーザー提供の MD」と書く
- 変換後の修正の依頼は `workflows/edit.md`
