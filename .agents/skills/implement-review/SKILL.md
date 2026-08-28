---
name: implement-review
description: 実装、テスト、fixture、設定、依存、差分、commit、Pull Request を、approved specification への適合、security、secret handling、異常系、互換性、テスト十分性、回帰、品質、validation coverage の観点でレビューする。コードは修正しない。
---

# Implementation Review

approved specification、requirements、design、ADR を実装が正しく満たしているかを判定する。レビューを設計変更、仕様補完、リファクタリング、未要求の hardening の入口にしない。対象は code、test、fixture、configuration、dependency、差分、関連する実行結果である。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象範囲、repository map、対象 language / runtime / component、review artifact の配置、Source of Truth、repository-specific gate、validation、報告規約を取得する。
2. `../review-common/review-playbook.md`。
3. `reviewers.md`、`review-gates.md`、`output-format.md`。
4. ユーザーが明示した file、component、package、application、差分、commit、Pull Request、参照資料。
5. 対応する approved specification、requirements、design、ADR、既存 test / fixture、必要な公式資料。

特定の language、runtime、package manager、persistence backend、protocol、SDK、platform、component の存在を前提にしない。repository instructions と既存構成から確認できない detail は推測せず、insufficient evidence として扱う。

## 対象と成果物

- ユーザーが明示した対象と変更範囲だけをレビューする。対象が曖昧な場合は範囲を広げず、確認事項を報告する。
- 変更範囲、直接の依存、適用 source、関連 test、実行結果を確定する。repository 全体の無関係な品質評価は行わない。
- review artifact の保存場所、命名、連番、finding prefix は repository instructions が定義する場合だけ使用する。定義がなければ固定形式を発明しない。
- 既存の固定名、連番成果物、specification feedback、レビュー成果物を移動、削除、上書きしない。

## 根拠の範囲

変更差分、実装、test、fixture、configuration、manifest、approved specification、requirements、design、ADR、repository instructions、実行結果を相互に照合する。

公式 protocol / platform / dependency docs は、repository instructions または approved source が必要とする場合に、外部事実・互換性・API の確認へ使う。既存 code、test、SDK の挙動だけを requirement、specification、protocol の根拠にしない。

repository-specific security policy、release policy、required evidence、persistence / shared-state policy は instructions または approved docs から取得する。定義がない場合は、一般慣例を必須 gate にしない。

未確認の環境、registry、外部サービス、長時間 test、依存先、shared state は成功扱いにしない。秘密情報、credential、復号データ、実運用の値を成果物や出力へ含めない。

## レビュー観点

- approved specification、requirements、design、ADR への適合と外部可視動作。
- input / output、事前・事後条件、validation、normalization、state、error、禁止事項、compatibility。
- malformed / truncated / unsupported / unknown input、境界値、duplicate、timeout、retry、partial failure、fail-closed。
- security、secret handling、authentication / authorization、integrity、replay、expiry、tamper、resource limit、trust boundary。
- cryptography、signature、canonicalization、serialization、encoding、numeric / byte / text 表現（対象に存在する場合）。
- 適用される domain、platform、network、protocol、version、external format の差異と interoperability。
- resource lifecycle、cleanup、concurrency、cancel、依存方向、component responsibility、公開互換性。
- 正常系、異常系、境界、security、回帰、deterministic behavior、conformance を独立して確認する test の十分性。
- formatter、lint、compiler / static analysis、unit / integration / end-to-end / conformance test、build など repository-defined validation の coverage と実行結果。

## Phase boundary と finding

各候補について、現在の差分が approved source に違反しているか、実装・test・validation が契約を満たさないことを示せるかを確認する。仕様が曖昧、根拠がない、一般的に望ましいだけの場合は code defect と断定しない。

finding は、対象箇所、発生条件、approved source または実行結果、問題、影響、最小の必要条件、完了条件を第三者が確認できる場合だけ採用する。新しい API、capability、error、fallback、互換層、設計方式、将来拡張、好みの refactor、未要求の防御を要求しない。

仕様未決定と実装違反を分離する。実装から requirement / design / specification を逆生成せず、必要な判断は unresolved または upstream / downstream handoff として記録する。

## 実行と判定

`review-common/review-playbook.md` の Phase 0〜3 と、`reviewers.md` の独立観点を適用する。サブエージェントを使わない場合は、実施した自己レビューの観点別パスだけを記録する。

repository instructions が定める非破壊 validation を確認し、実行した command、scope、結果、未実行理由を記録する。未確認の repository-specific gate、required evidence、環境依存 test がある場合は、generic gate が通っていても repository policy の合格や READY としない。

`review-gates.md` の generic phase gate を適用する。generic gate の結果は `READY` または `REVISE IMPLEMENTATION` とし、CRITICAL の契約違反、security invariant violation、scope violation、重大な regression、validation failure がある場合は後者とする。HIGH 以下を安全に引き継げる場合は、repository policy に反しない限り READY として Deferred / Optional に整理する。

レビュー中に implementation、specification、requirements、design、test、fixture、README、設定、repository policy を変更しない。

## Security と secret handling

- secret、credential、key、token、password、復号済み plaintext、機密な input / output が log、例外、warning、debug、fixture、example、telemetry へ漏れていないか確認する。
- untrusted input、remote / external / opaque data、client / privileged boundary、storage / shared-state boundary の validation と責任を確認する。
- authentication、authorization、integrity、replay、expiry、tamper、rate / size limit、resource exhaustion、fail-closed を approved source に照合する。
- cryptography が対象にある場合は、approved source の algorithm、parameter、key lifecycle、AAD、salt、nonce、tag、encoding、randomness、constant-time 等の要件と実装を照合する。
- error、retry、timeout、cancel、partial failure、cleanup の経路で秘密情報や保護対象データが露出しないか確認する。

## 自己確認

- finding ごとに対象、事実、根拠、影響、必要条件、完了条件があるか。
- specification compliance、security、secret handling、trust boundary、malformed / unsupported input、fail-closed、interoperability、compatibility、regression を必要な範囲で確認したか。
- deterministic behavior、serialization、canonicalization、numeric / byte correctness、lifecycle、concurrency を対象に応じて確認したか。
- repository-defined language / runtime / dependency / persistence / protocol と、固定した一般論を混同していないか。
- test が正常系だけでなく、異常系、境界、改ざん、認証失敗、期限、duplicate、未知値、回帰を必要な範囲で検出するか。
- repository-specific gate、required evidence、validation が不明な場合に PASS としていないか。
- review artifact に秘密情報や未実行の確認を成功扱いで記載していないか。

レビュー成果物だけを、repository instructions が定める方法で作成する。共通の finding、severity、evidence、regression、Git、validation ルールは `../review-common/review-playbook.md` に従う。
