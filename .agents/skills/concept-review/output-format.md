# Output Format

成果物は Markdown とし、正式指摘の接頭辞は CS とする。該当項目がない場合も「なし」と明記する。

必須構成:

1. Review Target: 対象、確認日、成果物、確認範囲
2. Execution Audit: self-review の観点別パス、または実際に使用したサブエージェントと完了状態
3. Evidence Used: 確認資料と用途
4. Review Result: READY または REVISE CONCEPT
5. Summary: 総評
6. Finding Status: ID、Severity、Status、初出レビュー、今回の状態根拠
7. Required Changes: Critical または Major の New / Open / Reopened
8. Optional Improvements: Minor の New / Open / Reopened
9. Resolved Findings: 対応確認できた過去指摘
10. Deferred Findings: 要件定義以降へ引き継ぐ指摘
11. Review Gates: 各ゲートの合否と根拠
12. Handoff and Remaining Risks: 次工程への引継ぎと未確認事項
13. Final Decision: Review Result と同じ最終判定

各指摘には、対象箇所、確認できた事実、根拠、影響、必要な修正または確認、完了条件を含める。レビュー本文へ討議、投票、思考過程を出力しない。
