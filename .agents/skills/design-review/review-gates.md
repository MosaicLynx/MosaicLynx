# Generic Phase Review Gates

各ゲートは design の責務、境界、依存、lifecycle、invariant が上流要求を満たし、下流へ引き渡せるかを確認する。gate の判定、finding の severity、mandatory evidence / context の不足は、`../review-common/review-playbook.md` の共通定義に従う。

1. Purpose / scope: design の目的、対象、non-goal、前提を一意に理解できる。
2. Context / responsibility: external actor、component responsibility、trust boundary、secret / sensitive data boundary が明確である。
3. Dependency direction: dependency が意図した方向に流れ、責務の逆流や循環がない。
4. Flow / lifecycle: 正常、failure、retry、timeout、再起動、duplicate、concurrency、結果対応の責任を確認できる。
5. Data ownership: state、secret / sensitive data、保持、更新、破棄、access の owner と境界が明確である。
6. Security / interoperability: security invariant、external contract、domain / platform / network / protocol variation が適用される source と整合する。
7. Upstream consistency: requirements、specification、ADR、既存 design と重大な矛盾がない。
8. Downstream feasibility: 下位 specification、implementation、validation へ必要な design decision を推測なしに引き渡せる。

すべての applicable generic gate が評価済みで blocking failure または confirmation required 条件がなければ `READY` とする。blocking 条件があれば `REVISE DESIGN`、mandatory evidence / context が不足して確認が必要なら `DESIGN CONFIRMATION REQUIRED` とする。Minor の unresolved finding だけでは通常 gate を blocking にしないが、件数・組合せまたは repository-specific mandatory policy による例外は記録する。API、schema、cryptographic parameter、private implementation など下位工程の未決定だけでは不合格にしない。

repository instructions が追加する mandatory gate、required evidence、security / release policy、命名規約は repository-specific policy として別途適用する。この資料へ repository 固有の gate や product contract を追加しない。追加 policy が不明な場合は、確認できない状態を PASS としない。
