# Generic Phase Review Gates

各ゲートは requirements と approved source の関係を確認する。gate の判定、finding の severity、mandatory evidence / context の不足は、`../review-common/review-playbook.md` の共通定義に従う。一般的に必要という理由だけで requirement の追加を求めない。

1. Purpose / problem: 解決する problem、purpose、必要性を説明できる。
2. User / responsibility: user、stakeholder、actor、利用場面、external responsibility を説明できる。
3. Scope boundary: 対象、non-goal、domain、platform、network、environment、data、external system の境界を矛盾なく区別できる（該当する場合）。
4. Requirements / constraints: functional、quality、security、privacy、availability / reliability、interoperability、operational、observability / operability、deployment / environment、compliance / policy の要求・制約、前提、未決定事項を、適用される場合に識別できる。
5. Acceptance: 主要 requirement の合否を外部から観測・検証できる。
6. Failure / safety: 必要な invalid / malformed / unsupported input、error、failure、recovery、security の要求を確認できる。
7. Internal consistency: 用語、purpose、scope、requirements、examples、関連資料に design / specification を妨げる矛盾がない。
8. Traceability: 上流 concept と approved source から各 requirement へ、下流 design / specification へ追跡できる。

すべての applicable generic gate が評価済みで blocking failure または confirmation required 条件がなければ `READY` とする。blocking 条件があれば `REVISE REQUIREMENTS`、mandatory evidence / context が不足して確認が必要なら `REQUIREMENTS CONFIRMATION REQUIRED` とする。Minor の unresolved finding だけでは通常 gate を blocking にしないが、件数・組合せまたは repository-specific mandatory policy による例外は記録する。前段資料がないことだけでは不合格にせず、未確認として記録する。ただし、必要な evidence を推測で補わない。

repository instructions が追加する mandatory gate、required evidence、security / release policy、命名規約は repository-specific policy として別途適用する。この資料へ repository 固有の gate や product contract を追加しない。追加 policy が不明な場合は、確認できない状態を PASS としない。
