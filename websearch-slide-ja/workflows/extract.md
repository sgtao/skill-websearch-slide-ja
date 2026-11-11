# extract — スライドHTML をスライドMD に戻す（エントリポイント C）

> 先に読むもの: `references/environment.md`、`references/cli-conversion.md`
> 「エントリポイントC: HTML→MD逆抽出」。
> `workflows/create.md`・`workflows/write-md.md` は読まない。

## 流れ

Step 2.5 → 逆抽出（`--extract-md` または `markdown-format.md`「逆抽出規則（HTML → MD）」）
→ .md 提示 →（編集後）Step 4-B → 5

1. `workflows/build.md` の「Step 2.5」だけを、逆抽出の直前に実行する（会話内で診断済みなら使い回す）
2. 逆抽出する
   - `--extract-md` が使えるとき: `references/cli-conversion.md`「エントリポイントC: HTML→MD逆抽出」
     のとおり CLI に任せる
   - 使えないとき・終了コード 4 のとき: `references/markdown-format.md`「逆抽出規則（HTML → MD）」
     に従って自分で抽出する
3. `.md` を保存して提示する（保存先と提示の手段は `references/environment.md`）
4. ユーザーが編集して「変換して」と送ってきたら、`workflows/edit.md` に進む

## このモードの約束

- `source-selection.md` のゲート群を通らず、Web検索も行わない
- 抽出した MD の本文を書き足さない・言い換えない
- 自分で抽出したとき（CLI に任せられなかったとき）は、元の HTML と一致しない可能性がある箇所を
  提示のときに伝える
