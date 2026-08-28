# Generic Phase Review Gates

各ゲートは requirements と approved source の関係を確認する。不合格は、根拠と影響を持つ Critical finding に対応付ける。

1. Purpose / problem: 解決する problem、purpose、必要性を説明できる。
2. User / responsibility: user、stakeholder、actor、利用場面、external responsibility を説明できる。
3. Scope boundary: 対象、non-goal、domain、platform、network、environment、data、external system の境界を矛盾なく区別できる（該当する場合）。
4. Requirements / constraints: functional、quality、security、privacy、interoperability、制約、前提、未決定事項を識別できる。
5. Acceptance: 主要 requirement の合否を外部から観測・検証できる。
6. Failure / safety: 必要な invalid / malformed / unsupported input、error、failure、recovery、security の要求を確認できる。
7. Internal consistency: 用語、purpose、scope、requirements、examples、関連資料に design / specification を妨げる矛盾がない。
8. Traceability: 上流 concept と approved source から各 requirement へ、下流 design / specification へ追跡できる。

すべての generic gate が合格なら `READY`、1つ以上不合格なら `REVISE REQUIREMENTS` とする。前段資料がないことだけでは不合格にせず、未確認として記録する。ただし、必要な evidence を推測で補わない。

repository instructions が追加する mandatory gate、required evidence、security / release policy、命名規約は repository-specific policy として別途適用する。この資料へ repository 固有の gate や product contract を追加しない。追加 policy が不明な場合は、確認できない状態を PASS としない。
