---
name: spec-review
description: external specification artifact を、要求適合、external contract、input / output、validation、serialization、canonicalization、error、state、security、compatibility、相互運用性、検証可能性の観点でレビューし、implementation へ進める品質を判定する。
---

# Specification Review

specification artifact を design、implementation、書き直しの代わりにせず、実装者・利用者・別実装が推測なく同じ契約を扱える品質かを判定する。レビューの対象は、外部から観測できる contract、データ表現、validation、error、state、security、互換性、相互運用性である。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 artifact、review artifact の配置、Source of Truth、repository-specific gate、validation、報告規約を取得する。
2. `../review-common/review-playbook.md`。
3. `reviewers.md`、`review-gates.md`、`output-format.md`。
4. ユーザーが明示した対象、範囲、参照資料。

特定の見出し名、directory、命名、finding prefix、protocol、SDK、network の存在を前提にしない。製品・domain 固有の契約は approved specification、ADR、公式資料から取得する。

## 対象と上流資料

- ユーザーが明示した specification artifact 1件を優先する。
- 未指定の場合は、repository instructions の候補探索規則と既存 artifact 構成から対象を特定する。固定 path、ファイル名、package / application 構成を推測しない。
- 候補が 0 件または複数件、対象を一意に決められない場合は、自動選択せず、insufficient evidence と確認事項を報告する。
- 対応する concept、requirements、design、ADR、前段レビュー、実装者 feedback は、repository instructions が示す範囲で確認する。候補が複数の場合は自動選択しない。
- review artifact の保存場所、命名、連番、finding prefix は repository instructions が定義する場合だけ使用する。定義がなければ固定形式を発明しない。
- 既存レビュー成果物を移動、削除、上書きしない。

## 根拠の範囲

specification 本文、approved requirements / design / ADR、ユーザー提供資料、適用可能な公式 protocol / platform / domain docs を主な根拠とする。

code、test、fixture、SDK、公開 contract は、現在の実装状態、外部事実、仕様適合の evidence として扱う。implementation がそう動くことだけで、未承認の仕様を正当化しない。

repository-specific security、責任、release policy、required evidence は repository instructions から取得する。product-specific contract、protocol、serialization、cryptographic details は正本 docs / ADR / specification から取得し、レビュー Skill の既定値にはしない。

## レビュー観点

- requirements、design、ADR、上流資料、前段レビューの判定・未解決 Critical への traceability と矛盾。
- scope、対象、対象外、actor、component、前提、責任、trust boundary、用語、version。
- external contract、input、output、field、type、presence、range、size、encoding、ordering、default、normalization。
- validation、canonicalization、serialization、deterministic representation、numeric / byte / text 表現。
- success、error、exception、timeout、retry、duplicate、replay、partial result、unknown / unsupported / malformed / truncated input。
- state transition、lifecycle、ownership、concurrency、idempotency、resource limit、compatibility。
- authentication / authorization、privacy、integrity、secret handling、fail-closed、remote / external / opaque data の境界。
- cryptography、signature、key、algorithm、parameter、salt、nonce、AAD、tag、encoding、failure、interoperability（対象仕様に存在する場合）。
- test vector、fixture、example、conformance criteria、別実装との相互運用性。

## Phase boundary と finding

各候補について、仕様として外部契約を一意に実装・検証できない問題なのか、design / implementation の内部詳細なのかを確認する。

finding は、approved source と矛盾する、仕様が外部契約を一意に決められない、security / interoperability / compatibility に直接影響する、または実装者が安全性を推測せざるを得ない場合だけ採用する。より高機能な API、未要求の field、方式の好み、internal class / function は要求しない。

cryptography や serialization の方式が未決定なだけの場合と、承認済み方式が仕様に不完全に記述されている場合を区別する。前者は未決定事項として扱い、後者は必要な契約の欠落として指摘する。

review finding は新しい product requirement の根拠ではない。不足する要求・設計判断・方式は、勝手に補完せず unresolved または upstream / downstream handoff として記録する。

## 実行と判定

`review-common/review-playbook.md` の Phase 0〜3 と、`reviewers.md` の独立観点を適用する。各候補を根拠、影響、最小の完了条件で反証してから採用する。

`review-gates.md` の generic phase gate を適用した後、repository instructions が定める追加 mandatory gate、required evidence、review policy を適用する。repository-specific gate が不明、または必要な evidence を確認できない場合は、合格や READY とせず、未確認として記録する。

generic gate の結果は `READY` または `REVISE SPECIFICATION` とする。Critical の unresolved issue、contract の重大な欠落、security / interoperability / compatibility の判定不能、traceability failure がある場合は後者とする。Major / Minor を implementation へ安全に引き継げる場合は、repository policy に反しない限り READY として Deferred / Optional に整理する。

レビュー中に specification、requirements、design、ADR、code、test、fixture、README、repository policy を変更しない。未確認事項、未実行の validation、前段 finding の状態を成功扱いにしない。

## 自己確認

- contract、input / output、validation、error、state、lifecycle、compatibility が実装・検証可能か。
- serialization、canonicalization、encoding、deterministic behavior、numeric / byte 表現が曖昧でないか。
- malformed / unsupported / unknown / truncated / tampered input、auth failure、replay、timeout、duplicate の扱いを必要な範囲で確認したか。
- cryptography が対象にある場合、algorithm、parameters、encoding、failure、interoperability、test vector の記述を確認したか。
- trust boundary、remote / external / opaque data、secret handling、fail-closed が明確か。
- 実装内部の構造や方式の好みを、仕様上の finding にしていないか。
- repository-specific gate、evidence、命名規約が不明な場合に PASS としていないか。
- finding ごとに対象箇所、根拠、影響、必要条件、完了条件があるか。

レビュー成果物だけを、repository instructions が定める方法で作成する。共通の finding、severity、evidence、regression、Git、validation ルールは `../review-common/review-playbook.md` に従う。
