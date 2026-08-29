# Reviewers

メインエージェントは Review Board Chair として、対象確定、根拠管理、候補統合、重大度・状態、gate、成果物を担当する。Phase 1 では次の3観点を独立して確認する。

## Reviewer A: 明確性と完全性

要求の traceability、用語、対象、non-goal、actor、responsibility、前提、制約、MUST / SHOULD、acceptance criteria、検証可能性、内部矛盾を確認する。

## Reviewer B: 利用価値と scope

purpose、problem、user / stakeholder、利用場面、value、優先度、初期 scope、external party、上流 concept との整合を確認する。requirements にない capability や将来 scope を追加しない。

## Reviewer C: 成立性と安全性

requirements として不可欠な quality、security、privacy、authentication / authorization、integrity、availability / reliability、interoperability、operational、observability / operability、deployment / environment、compliance / policy、failure、domain / platform / network / external system boundary を確認する（approved source または system context により対象へ適用される場合）。一般的に必要という理由だけで新しい requirement を要求せず、具体的な algorithm、schema、component、実装方式も要求しない。

## Chair の採用基準

指摘は requirements level の問題として、対象箇所、approved source、外部影響、必要条件、完了条件を説明できる場合だけ採用する。設計詳細、一般的 best practice、将来拡張、reviewer の好みは却下する。一般的に必要そうな要求ではなく、既存根拠に基づく欠落・矛盾・検証不能性を指摘する。
