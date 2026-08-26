# Output Format

成果物は Markdown とし、正式指摘の接頭辞は RR とする。該当項目がない場合も「なし」と明記する。

必須構成:

1. Review Target: 対象、確認日、成果物、確認範囲
2. Execution Audit: self-review の観点別パス、または実際に使用したサブエージェントと完了状態
3. Evidence Used: 要件、コンセプト、前段レビュー、資料と用途
4. Review Result: READY または REVISE REQUIREMENTS
5. Summary
6. Finding Status: ID、Severity、Status、初出レビュー、状態根拠
7. Required Changes: Critical または Major の New / Open / Reopened
8. Optional Improvements: Minor の New / Open / Reopened
9. Resolved Findings
10. Deferred Findings: 仕様設計以降へ引き継ぐ事項
11. Review Gates: 各ゲートの合否、根拠、対応 ID
12. Traceability and Remaining Risks: 要求の追跡不足、未確認、未決定
13. Final Decision

各指摘には、対象箇所、要件レベルの問題、根拠、影響、必要な修正、完了条件を含める。APIや実装方式の提案を修正内容へ含めない。
