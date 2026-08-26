# Output Format

成果物は Markdown とし、正式指摘の接頭辞は IR とする。該当項目がない場合も「なし」と明記する。

必須構成:

1. Review Target: 対象、確認日、レビュー範囲、未確認範囲、成果物
2. Execution Audit: self-review の4パス、または実際に使用したサブエージェントと完了状態
3. Evidence Used: 差分、仕様、要件、ADR、実装、テスト、公式資料、検証結果
4. Review Result: READY または REVISE IMPLEMENTATION
5. Summary
6. Finding Status: ID、Severity、Status、初出レビュー、状態根拠
7. Required Changes: CRITICAL または HIGH の New / Open / Reopened
8. Optional Improvements: MEDIUM / LOW の New / Open / Reopened
9. Resolved Findings
10. Deferred Findings
11. Specification Conformance: 適合、不適合、未実装、仕様が曖昧な項目
12. Test Evaluation: 実行結果、fixture、coverage、未検証範囲
13. Review Gates: 各ゲートの合否、根拠、対応 IR
14. Remaining Risks
15. Final Decision

各指摘には、対象ファイルと行、発生条件、確認できた事実、根拠、影響、必要な修正、完了条件を含める。秘密情報と内部討議は記録しない。
