# Generic Phase Review Gates

各ゲートは specification が approved requirements / design を、実装・検証・相互運用可能な external contract へ具体化しているかを確認する。gate の判定、finding の severity、mandatory evidence / context の不足は、`../review-common/review-playbook.md` の共通定義に従う。

1. Purpose / scope: requirements を満たす対象、対象外、actor、責任、前提を一意に理解できる。
2. Contract: input、output、data representation、validation、normalization、error、禁止事項、state を確認できる。
3. Processing / failure: 必要な正常、failure、boundary、ordering、retry、duplicate、unsupported、state result を確認できる。
4. Internal consistency: 用語、requirements、例、図表、関連資料に実装を妨げる矛盾がない。
5. Verifiability: approved requirements の合否、boundary、failure、compatibility を独立して検証できる。
6. Security / interoperability: 必要な secret handling、authentication / authorization、integrity、serialization、encoding、signature / cryptographic contract、external / opaque boundary が source に基づき判定できる。
7. Upstream consistency: concept、requirements、design、ADR、前段レビューの block / unresolved Critical と矛盾しない。

すべての applicable generic gate が評価済みで blocking failure または confirmation required 条件がなければ `READY` とする。blocking 条件があれば `REVISE SPECIFICATION`、mandatory evidence / context が不足して確認が必要なら `SPECIFICATION CONFIRMATION REQUIRED` とする。Minor の unresolved finding だけでは通常 gate を blocking にしないが、件数・組合せまたは repository-specific mandatory policy による例外は記録する。上流資料や feedback がないことだけでは不合格にせず、未確認として記録する。ただし、未決定の仕様を推測で埋めて合格扱いにしない。

repository instructions が追加する mandatory gate、required evidence、security / release policy、命名規約は repository-specific policy として別途適用する。この資料へ repository 固有の gate や product contract を追加しない。追加 policy が不明な場合は、確認できない状態を PASS としない。
