# Generic Phase Review Gates

目的は実装を完璧にすることではなく、対象範囲が approved specification を安全かつ検証可能に満たすかを判断することである。gate の判定、finding の severity、mandatory evidence / context の不足は、`../review-common/review-playbook.md` の共通定義に従う。

1. Specification conformance: input、output、制約、処理、state、error、禁止事項、compatibility を満たす。
2. Security: asset、権限、secret handling、trust boundary、authentication / authorization、integrity、失敗時の安全性を満たす。
3. Interoperability: encoding、serialization、canonicalization、numeric / byte / text 表現、external format、適用される domain / platform / network / protocol が別実装でも一致する。
4. Abnormal behavior: malformed、boundary、auth failure、tamper、truncated、duplicate、unknown / unsupported input、timeout、resource limit を仕様どおりに扱う。
5. Test adequacy: 重要な specification violation、security issue、regression、非互換、failure、deterministic behavior の破綻を独立して検出できる。
6. Scope quality: 変更が対象範囲内で、responsibility、dependency、exception、concurrency、resource lifecycle、validation に具体的欠陥を生じさせていない。

すべての applicable generic gate が評価済みで blocking failure または confirmation required 条件がなければ `READY` とする。blocking 条件があれば `REVISE IMPLEMENTATION`、mandatory evidence / context が不足して確認が必要なら `IMPLEMENTATION CONFIRMATION REQUIRED` とする。`MEDIUM` / `LOW`（共通 mapping では `Minor` / `Nit`）の unresolved finding だけでは通常 gate を blocking にしないが、件数・組合せまたは repository-specific mandatory policy による例外を記録する。coverage の任意の数値目標を新設しない。

repository instructions が追加する mandatory gate、required evidence、security / release policy、命名規約は repository-specific policy として別途適用する。この資料へ repository 固有の gate や product contract を追加しない。追加 policy が不明な場合は、確認できない状態を PASS としない。
