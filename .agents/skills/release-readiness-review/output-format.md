# Output Format

この Skill のレビュー成果物は、`../review-common/output-format.md` の共通構成・章名・順序・指摘必須項目を使用する。共通構成を省略、追加、並べ替えない。

## Skill-specific values

- Formal finding prefix: applicable repository instructions が定義する場合だけ使用する。未定義なら repository 固有 prefix を推測せず、対象内で一意な release-scoped ID を使用する。
- Severity: `Critical` / `Major` / `Minor` / `Nit`
- Review Result: `READY` / `READY WITH MINOR FIXES` / `NOT READY` / `TARGET CONFIRMATION REQUIRED` / `RELEASE POLICY CONFIRMATION REQUIRED`
- Required Changes: 公開を妨げる `Critical` / `Major` の New / Open / Reopened
- Optional Improvements: 公開を妨げない `Minor` / `Nit` の New / Open / Reopened
- Deferred Findings: 次回 release、upstream / downstream process、または repository policy の確認へ引き継ぐ finding・未決定事項
- Domain Checks: Release Scope、Version Assessment、Publication Target、Metadata、Public Contract、Compatibility、Dependencies、Build / Distribution Artifact、Documentation、Security / Supply Chain、Validation / Evidence
- Scope and Traceability: release target、intended version、manifest、public contract、artifact、dependencies、documentation、approved release policy、validation、evidence の対応
- Automatic Changes: 通常は「なし」とする。明示依頼と repository instructions の許可があり、対象範囲内の release documentation / metadata を変更した場合だけ記録する。publish、tag、registry、approval、release branch の操作をレビュー完了と混同しない
