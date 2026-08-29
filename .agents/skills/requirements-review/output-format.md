# Output Format

この Skill のレビュー成果物は、`../review-common/output-format.md` の共通構成・章名・順序・指摘必須項目を使用する。共通構成を省略、追加、並べ替えない。

## Skill-specific values

- Formal finding prefix: applicable repository instructions が定義する場合だけ使用する。未定義なら repository 固有 prefix を推測せず、対象内で一意な phase-scoped ID を使用する。
- Severity: `Critical` / `Major` / `Minor`
- Review Result: `READY` / `REVISE REQUIREMENTS` / `REQUIREMENTS CONFIRMATION REQUIRED`
- Required Changes: `Critical` または `Major` の New / Open / Reopened
- Optional Improvements: `Minor` の New / Open / Reopened
- Deferred Findings: 仕様設計以降へ引き継ぐ指摘
- Domain Checks: 要求の完全性、責任・範囲、MUST / SHOULD、受け入れ条件、セキュリティ、相互運用性
- Scope and Traceability: 要求と concept、適用される approved source、下流工程との追跡
