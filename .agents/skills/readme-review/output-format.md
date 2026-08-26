# Output Format

成果物は Markdown とし、正式指摘の接頭辞は RM とする。該当項目がない場合も「なし」と明記する。

必須構成:

1. Review Target: 対象README、対象、確認日、成果物
2. Execution Audit: self-review の3パス、または実際に使用したサブエージェントと完了状態
3. Evidence Used: README、manifest、公開API、実装、仕様、テスト、検証結果
4. Review Result: READY / READY WITH MINOR FIXES / REVISE README
5. Summary
6. Finding Status: ID、Severity、Status、初出レビュー、状態根拠
7. Required Changes: ERROR / WARN の New / Open / Reopened
8. Optional Improvements: NIT の New / Open / Reopened
9. Resolved Findings
10. Deferred Findings
11. Documentation Checks: install、API、環境、制約、license、links、examples
12. Review Gates: 各ゲートの合否、根拠、対応 ID
13. Validation and Remaining Risks: 実行した確認、未確認範囲
14. Final Decision

各指摘には、READMEの対象箇所、照合して確認できた事実、根拠、利用者への影響、READMEに必要な最小修正を含める。製品や仕様の変更を修正内容へ含めない。
