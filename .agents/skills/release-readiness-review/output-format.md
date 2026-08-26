# Output Format

成果物は対象packageの docs/reviews/release/<packageベース名>-review-NNN.md に新規作成し、正式指摘の接頭辞は RL とする。該当項目がない場合も「なし」と明記する。

必須構成:

1. Review Target: package path、name、確認日、version、確認範囲、未確認範囲
2. Execution Audit: self-review の4パス、または実際に使用したサブエージェントと完了状態
3. Evidence Used: git、package、README、CHANGELOG、実装、検証、pack、registry、evidence
4. Version Assessment: 現在version、推奨version、SemVerレベル、根拠、変更有無
5. Review Result: READY / READY WITH MINOR FIXES / NOT READY / TARGET CONFIRMATION REQUIRED
6. Summary
7. Finding Status: ID、Severity、Status、初出レビュー、状態根拠
8. Required Changes: 公開を妨げる Critical / Major の New / Open / Reopened
9. Optional Improvements: 公開を妨げないMinor
10. Resolved Findings
11. Deferred Findings
12. Documentation Check: README、CHANGELOG、license、利用例、移行、security
13. Package Metadata Check: name、version、exports、files、engines、dependencies
14. Validation Results: lint、format、typecheck、test、build、coverage、pack、registry、evidence
15. Automatic Changes: 明示依頼があり安全なmetadata/docsを変更した場合だけ記録
16. Remaining Risks
17. Review Gates
18. Final Decision

各指摘には、対象、問題、根拠、公開時の影響、必要最小限の修正、再確認方法を含める。publish、commit、tag、registry変更を実行したと誤解される表現は使わない。
