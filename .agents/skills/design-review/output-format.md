# Output Format

この Skill のレビュー成果物は、`../review-common/output-format.md` の共通構成・章名・順序・指摘必須項目を使用する。共通構成を省略、追加、並べ替えない。

## Skill-specific values

- Formal finding prefix: applicable repository instructions が定義する場合だけ使用する。未定義なら repository 固有 prefix を推測せず、対象内で一意な phase-scoped ID を使用する。
- Severity: `Critical` / `Major` / `Minor`
- Review Result: `READY` / `REVISE DESIGN` / `DESIGN CONFIRMATION REQUIRED`
- Required Changes: `Critical` または `Major` の New / Open / Reopened
- Optional Improvements: `Minor` の New / Open / Reopened
- Deferred Findings: 下位仕様・実装・運用へ引き継ぐ指摘
- Domain Checks: システムコンテキスト、責務、依存方向、trust boundary、データ所有、主要フロー、運用、下流実装可能性
- Scope and Traceability: 要件・仕様・ADR・既存設計と設計箇所の対応
