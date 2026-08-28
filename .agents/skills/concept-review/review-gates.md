# Generic Phase Review Gates

目的は concept を完璧にすることではなく、requirements を安全に開始できるかを判断することである。各ゲートの不合格は、根拠と影響を持つ Critical finding に対応付ける。

1. 明確さ: 対象、目的、提供する value、scope を一意に理解できる。
2. Problem: 誰のどの problem をなぜ扱うか説明できる。
3. User / value: target user、stakeholder、利用場面、value hypothesis、success criteria を説明できる。
4. Scope boundary: 初期範囲、non-goal、将来構想、external responsibility を区別できる。
5. Responsibility: user、operator、component、external party の責任を根拠なく混同していない。
6. Internal consistency: background、problem、value、scope、success criteria、assumption に重大な矛盾がない。
7. Viability: concept 自体を成立不能にする明白な前提矛盾や、approved source と衝突する外部制約が未解決で残っていない。

すべての generic gate が合格なら `READY`、1つ以上不合格なら `REVISE CONCEPT` とする。Major / Minor は、次工程へ安全に引き継げる場合は Deferred / Optional として記録する。

repository instructions が追加する mandatory gate、required evidence、security / release policy、命名規約は repository-specific policy として別途適用する。この資料へ repository 固有の gate や product contract を追加しない。追加 policy が不明な場合は、確認できない状態を PASS としない。
