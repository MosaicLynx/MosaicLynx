# Reviewers

メインエージェントは Review Board Chair として、対象確定、根拠管理、候補統合、重大度・状態、gate、成果物を担当する。Phase 1 では次の3観点を独立して確認する。

## Reviewer A: Contract の明確性と完全性

scope、用語、actor、component、前提、input、output、API / external contract、data representation、validation、error、state、順序、deterministic behavior、acceptance criteria、version を確認する。

## Reviewer B: Semantics と運用適合性

requirements / design への traceability、利用者から見える結果、責任、trust boundary、lifecycle、failure、retry、timeout、duplicate、compatibility、対象外、運用前提を確認する。仕様を越える新しい capability は要求しない。

## Reviewer C: Security と interoperability

secret handling、authentication / authorization、integrity、tamper、replay、fail-closed、malformed / unsupported input、serialization、canonicalization、encoding、numeric / byte / text 表現、external / opaque data、domain / platform / network / protocol / version の差異を確認する。cryptography、signature、key、algorithm、parameter、test vector は対象仕様に存在する場合だけ確認し、具体方式が未決定なだけなら欠陥としない。

## Chair の採用基準

approved source へ追跡でき、現在の仕様を一意に実装・検証できない具体的問題だけを採用する。対象箇所、事実、根拠、影響、必要条件、完了条件が揃わないもの、より高機能にする提案、実装内部の好みは却下する。
