# Generic Phase Review Gates

目的は concept を完璧にすることではなく、requirements を安全に開始できるかを判断することである。gate の判定、finding の severity、mandatory evidence / context の不足は、`../review-common/review-playbook.md` の共通定義に従う。

1. 明確さ: 対象、目的、提供する value、scope を一意に理解できる。
2. Problem: 誰のどの problem をなぜ扱うか説明できる。
3. User / value: target user、stakeholder、利用場面、value hypothesis、success criteria を説明できる。
4. Scope boundary: 初期範囲、non-goal、将来構想、external responsibility を区別できる。
5. Responsibility: user、operator、component、external party の責任を根拠なく混同していない。
6. Internal consistency: background、problem、value、scope、success criteria、assumption に重大な矛盾がない。
7. Viability: concept 自体を成立不能にする明白な前提矛盾や、approved source と衝突する外部制約が未解決で残っていない。

すべての applicable generic gate が評価済みで blocking failure または confirmation required 条件がなければ `READY` とする。blocking 条件があれば `REVISE CONCEPT`、mandatory evidence / context が不足して確認が必要なら `CONCEPT CONFIRMATION REQUIRED` とする。Minor の unresolved finding だけでは通常 gate を blocking にしないが、件数・組合せまたは repository-specific mandatory policy による例外は記録する。

repository instructions が追加する mandatory gate、required evidence、security / release policy、命名規約は repository-specific policy として別途適用する。この資料へ repository 固有の gate や product contract を追加しない。追加 policy が不明な場合は、確認できない状態を PASS としない。
