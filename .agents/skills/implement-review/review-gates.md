# Generic Phase Review Gates

目的は実装を完璧にすることではなく、対象範囲が approved specification を安全かつ検証可能に満たすかを判断することである。不合格は、根拠と影響を持つ CRITICAL finding に対応付ける。

1. Specification conformance: input、output、制約、処理、state、error、禁止事項、compatibility を満たす。
2. Security: asset、権限、secret handling、trust boundary、authentication / authorization、integrity、失敗時の安全性を満たす。
3. Interoperability: encoding、serialization、canonicalization、numeric / byte / text 表現、external format、適用される domain / platform / network / protocol が別実装でも一致する。
4. Abnormal behavior: malformed、boundary、auth failure、tamper、truncated、duplicate、unknown / unsupported input、timeout、resource limit を仕様どおりに扱う。
5. Test adequacy: 重要な specification violation、security issue、regression、非互換、failure、deterministic behavior の破綻を独立して検出できる。
6. Scope quality: 変更が対象範囲内で、responsibility、dependency、exception、concurrency、resource lifecycle、validation に具体的欠陥を生じさせていない。

すべての generic gate が合格なら `READY`、1つ以上不合格なら `REVISE IMPLEMENTATION` とする。HIGH 以下だけでは自動的に不合格にしない。coverage の任意の数値目標を新設しない。

repository instructions が追加する mandatory gate、required evidence、security / release policy、命名規約は repository-specific policy として別途適用する。この資料へ repository 固有の gate や product contract を追加しない。追加 policy が不明な場合は、確認できない状態を PASS としない。
