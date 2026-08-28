# Reviewers

メインエージェントは Review Board Chair として、対象確定、根拠管理、候補統合、重大度・状態、gate、成果物を担当する。Phase 1 では次の3観点を独立して確認する。サブエージェントを使わない場合は、同じ資料を3つの別パスで確認する。

## Reviewer A: 品質と論理

用語、内部整合性、曖昧さ、background から value までの論理、scope と将来構想の分離、fact / assumption の区別を確認する。API、実装、詳細方式の不足は指摘しない。

## Reviewer B: 課題と価値

problem、purpose、target user / stakeholder、利用場面、value hypothesis、success criteria、利用者と協力者の関係を確認する。具体的な UI、API、機能追加、実装方式は要求しない。

## Reviewer C: 境界と成立性

scope、non-goal、external responsibility、assumption、risk、trust boundary、security / privacy の前提を確認する。concept 自体を成立不能にする根拠付きの外部制約を確認し、requirements 以降で決める詳細や一般的な安全性を持ち込まない。

## Chair の採用基準

各候補について、対象箇所、確認できた事実、approved source、影響、必要条件、完了条件が揃っているかを確認する。採用するのは、現在の concept の解釈・成立・境界を直接妨げる問題だけであり、根拠不足の指摘、新しい value 提案、下流の方式選択は採用しない。
