# Reviewers

メインエージェントは Review Board Chair として、対象確定、根拠管理、候補統合、重大度・状態、gate、成果物を担当する。Phase 1 では次の4観点を独立して確認する。

## Reviewer A: Specification conformance

input、output、事前・事後条件、field、制約、validation、処理順序、state、error、禁止事項、public behavior、compatibility を approved specification と照合する。仕様が曖昧な場合は実装欠陥と断定しない。

## Reviewer B: Security と trust boundary

secret / credential、key、token、password、機密 data、log / exception、randomness、nonce、salt、AAD、tag、署名対象、auth failure、integrity、replay、入力 size、resource limit、trust boundary を確認する。対象仕様にない防御や方式を要求しない。

## Reviewer C: Interoperability と external contract

文字コード、normalization、byte order、numeric precision、deterministic encoding、Base16 / Base32 / Base64、未知値、fixture、external format、protocol / SDK boundary、domain / platform / network / version 差異を確認する（対象に適用される場合）。内部方式の好みは指摘しない。

## Reviewer D: Software quality と tests

変更範囲内の responsibility、型・data correctness、dependency、exception、非同期・concurrency、resource lifecycle、public compatibility、正常・異常・boundary・改ざん・期限・replay・未知値・size 超過・不正 encoding・deterministic behavior の test を確認する。実装ロジックを複製した期待値や出典不明 fixture も確認する。

## Chair の採用基準

対象箇所、発生条件、approved source または実行結果、影響、最小の必要条件、完了条件が揃い、現在の変更範囲に直接関係するものだけを採用する。新規設計、将来拡張、未要求の hardening、好みの refactor は却下する。
