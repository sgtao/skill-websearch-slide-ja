# convert-raw — 未整形の入力をスライドMD にしてから変換する（エントリポイント D）

> 先に読むもの: `references/environment.md`、`workflows/write-md.md`。変換と出力は `workflows/build.md`。
> 対象は、SKILL.md の「入力タイプ判定」で未準拠Markdown／CSV・TSV／会話履歴・プレーンテキストと
> 判定された入力。`workflows/create.md` は読まない。

## 流れ

入力タイプ判定 → Step 2.5 → 変換確認フロー → 4-B → 5

`workflows/build.md` の「Step 2.5」は、**MD を書く前（構成を決める前）に実行する**。使える type・
枚数の目安・パレットは CLI の版で変わるため、先に実効仕様を取得してから構成を決める。

### 変換確認フロー（エントリポイント D）

1. 入力を想定様式のスライドMDに変換する。
   - **1スライドの分量はユーザー指定がなければ「情報グループ優先」**で決める
     （見出し単位で自然に分割。Step 3 の枚数の目安には縛られない）
   - frontmatter の `title` は入力から推定、`palette` は未指定なら `ocean`
   - 箇条書き→`points`、表→`table`、数値データ→`chart` 等、内容に応じて type を
     割り当てる。使える type は Step 2.5 の実効仕様に従う（手順は、CLIトラックなら
     `steps`、レガシートラックなら `points`/`summary`。選び分けは Step 3 の表）
   - CSV の場合: 数値列があれば `chart` 候補として構造化する。出典は
     「ユーザー提供データ」である旨を明記し、`chart-generation.md` の
     数値・単位・出典ルールに準拠させる
2. **変換したスライドMDの全文をユーザーに提示**し、承認を得る
   （例: 「この構成でHTMLスライドを生成しますか？ 修正があれば指示してください」）
3. 承認 → Step 4-B（MD→HTML変換）→ Step 5（`.md` ＋ `.html` 両出力）
4. 修正指示があれば MD を修正して再提示する

「Step 3 の表」は `workflows/write-md.md` の「type の選び分け（トラック別）」を指す。
MD の書き方（記法・共通記法の使いどころ・要確認の明示）は同ファイルの「Step 4-A」に従う。
Step 4-B と Step 5 は `workflows/build.md`。

## このモードの約束

- ユーザーが用意した文章・データの本文は書き換えない。構成のために**自分が足した**内容にだけ
  「確認できない内容は書かない」の規則を当てる（`workflows/write-md.md`「Step 4-A」）
- Web検索は行わない（検索を足したいと言われたら `workflows/create.md` に切り替える）
- 変換後の修正の依頼は `workflows/edit.md`
