# Output Format

この Skill のレビュー成果物は、`../review-common/output-format.md` の共通構成・章名・順序・指摘必須項目を使用する。共通構成を省略、追加、並べ替えない。

## Skill-specific values

- Formal finding prefix: applicable repository instructions が定義する場合だけ使用する。未定義なら repository 固有 prefix を推測せず、対象内で一意な phase-scoped ID を使用する。
- Severity: `Critical` / `Major` / `Minor`
- Review Result: `READY` / `REVISE SPECIFICATION`
- Required Changes: `Critical` または `Major` の New / Open / Reopened
- Optional Improvements: `Minor` の New / Open / Reopened
- Deferred Findings: 実装・検証以降へ引き継ぐ未決定事項・確認事項
- Domain Checks: API・データ契約、validation、error、状態、処理、security、相互運用性、検証可能性
- Scope and Traceability: 要件・コンセプト・ADR・前段レビューと仕様箇所の対応
