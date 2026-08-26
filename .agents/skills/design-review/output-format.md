# Output Format

成果物は Markdown とし、正式指摘の接頭辞は DR とする。該当項目がない場合も「なし」と明記する。

必須構成:

1. Review Target: 対象設計書、確認日、対象範囲、成果物
2. Execution Audit: self-review の4パス、または実際に使用したサブエージェントと完了状態
3. Evidence Used: 設計、要件、仕様、ADR、実装、テスト、公式資料と用途
4. Review Result: READY または REVISE DESIGN
5. Summary
6. Finding Status: ID、Severity、Status、初出レビュー、状態根拠
7. Required Changes: Critical または Major の New / Open / Reopened
8. Optional Improvements: Minor の New / Open / Reopened
9. Resolved Findings
10. Deferred Findings: 下位仕様・実装・運用へ引き継ぐ事項
11. Traceability Matrix: 要件・仕様・ADRと設計箇所の対応、または不足
12. Review Gates: 各ゲートの合否、根拠、対応 ID
13. Remaining Risks and Open Decisions
14. Final Decision

各指摘には、設計書の対象箇所、既存根拠、問題、影響、必要な修正、完了条件、委譲先を含める。APIや具体的実装方式を新規に要求しない。
