---
name: implement-author
description: 承認済み requirements、specification、design、ADR に従って対象 code / test を実装または修正する。契約適合、scope control、error handling、security、data correctness、resource lifecycle、concurrency、compatibility、validation を確認し、仕様にない外部可視動作を追加しない。
---

# Implement Author

承認済み specification、requirements、design、ADR に従って code / test を実装または修正する。実装の目的は、定義済みの外部契約、責任境界、security invariant、validation、compatibility を満たすことであり、未承認の capability や仕様を実装から発明することではない。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 component、repository map、変更範囲、validation command、artifact / review の配置、ローカル規約を取得する。
2. `../author-common/author-playbook.md`。
3. 承認済み specification、requirements、design、ADR、既存の external contract。
4. 対象 code、test、fixture、configuration、manifest、公開 export、生成物、既存 review evidence。
5. 必要に応じて、対象 domain / platform / protocol / external system の公式資料。ただし repository instructions または approved source が参照を要求する場合に限る。

repository instructions にない language、package manager、build tool、component boundary、artifact path、validation command、protocol、compatibility policy を推測しない。既存構成から安全に分かる事実は確認して利用し、不明な事項は unresolved として報告する。

## 対象と implementation gate

- ユーザーが対象 file / component / package / application を指定した場合は、その範囲を優先する。未指定の場合は repository instructions と既存構成から最小の対象を特定する。
- 変更前に、対象仕様の status、適用範囲、external behavior、依存する ADR、既存実装との差異を確認する。
- 次の契約を実装前に確認する。対象に該当するものだけを適用し、source にない項目は推測しない。
  - input / output、field、type、range、size、encoding、ordering、default、normalization。
  - validation、state、lifecycle、ownership、resource limit、timeout、retry、duplicate、idempotency。
  - success、error、exception、partial result、unsupported / unknown / malformed / truncated input の挙動。
  - deterministic representation、canonicalization、serialization、byte / text 表現、numeric precision。
  - domain、platform、network、external system、protocol、version、identity の差異（適用される場合）。
  - cryptography、signature、key、authentication、integrity が対象にある場合の algorithm、parameter、AAD、salt、nonce、tag、encoding、randomness、failure、replay / tamper behavior。
  - test vector、fixture、conformance、互換性、migration、backward compatibility。
- 契約が不足・競合・未承認の場合は、最も自然な挙動を選んで実装を進めず、影響範囲とともに報告する。

## 実装の責務

- approved source の外部可視契約と責任境界に適合する最小の変更を行う。
- 外部入力、境界を越えるデータ、設定、保存データ、復元データを、仕様が要求する前に信用しない。
- validation を境界に置き、invalid / unsupported / malformed input を fail-closed に扱う。エラー後に部分的な成功、秘密情報の漏えい、状態の不整合を残さない。
- 既存の public API、data format、state、compatibility を変更する場合は、approved source と利用者影響を確認する。
- 既存の責務境界を越える便利な helper、fallback、暗黙の変換、互換 layer、仕様にない default を追加しない。
- data ownership、resource lifecycle、cleanup、timeout、retry、concurrency、cancel、再起動時の挙動を設計・仕様に従って実装する。
- deterministic behavior が要求される箇所では、入力・順序・encoding・時刻・randomness による非決定性を管理する。

## Security と secret handling

- secret、credential、key、token、password、mnemonic、復号済み plaintext、署名対象の機密データを log、例外、warning、debug 出力、fixture、example、telemetry に含めない。
- untrusted input、remote / external system、opaque data、client boundary、storage boundary を repository-defined responsibility に従って扱う。
- authentication、authorization、integrity、replay、expiry、tamper、rate / size limit、resource exhaustion の要件を実装で抜かさない。
- cryptography が対象にある場合は approved specification の primitive、parameter、key lifecycle、AAD、salt、nonce、tag、encoding、constant-time または乱数要件に従う。独自の方式、再利用可能な固定値、曖昧な変換を導入しない。
- エラー経路、retry、timeout、cancel、partial failure でも secret や保護対象データが露出しないことを確認する。

## Domain / protocol / platform boundaries

- 複数の domain、protocol、platform、network、version がある場合、source が定める差異を暗黙に共通化しない。対象の識別、validation、encoding、compatibility、failure をそれぞれ確認する。
- protocol の仕様、SDK / library の API、repository の wrapper、現在の実装を区別する。SDK や既存コードが受け入れることだけを、protocol や product requirement の根拠にしない。
- byte 列、hex / text、numeric type、precision、endianness、canonical representation の変換は、approved source、型、fixture、既存 contract に追跡する。
- external / remote / opaque component の責任を越えて内容を解釈・変更しない。secret-bearing / signing-capable component の責任を別 component へ複製しない。

## Language / toolchain / component 境界

- language、compiler、static analyzer、formatter、linter、test runner、build system、runtime の選択は repository instructions と既存構成に従う。
- 対象 language の型・静的制約、resource ownership、エンコード API、並行性モデルを尊重する。型検査や静的解析を提供する repository では、実行可能な validation の一部として扱う。
- runtime / platform 差異、server / client / worker / library 境界、生成 code、公開 export、依存方向は repository-defined boundary を越えない。
- 新しい dependency、設定、公開 API、互換 layer、migration は、approved source と変更範囲に必要性がある場合だけ追加する。

## Tests

対象に応じて、次を独立した期待値で検証する。

- 正常系、代表値、最小・最大・空・境界値、組み合わせ、deterministic output、round-trip / conformance。
- missing、wrong type、invalid range / size / encoding、malformed、truncated、duplicate、unknown、unsupported input。
- authentication / authorization failure、tamper、replay、expiry、timeout、cancel、retry、concurrency、resource limit。
- domain / platform / network / protocol / version の不一致、互換性、外部 system の failure（適用される場合）。
- secret leakage、fail-closed behavior、partial failure 後の状態、cleanup、再起動・再実行時の lifecycle。
- cryptography、serialization、canonicalization、byte / text 表現が対象にある場合の test vector / fixture と実装間の一致。

テストは実装そのものを再記述するだけでなく、approved specification の観測可能な契約を検証する。既存 test が仕様と矛盾する場合は、テストを都合よく合わせず、根拠と影響を報告する。

## 作成手順

1. 対象範囲、approved source、実装状態、関連 component、既存の変更を確認する。
2. implementation gate を満たす契約、invariant、error、compatibility、validation を抽出する。
3. 最小の実装差分を設計し、責務境界、dependency direction、data ownership を確認する。
4. 境界入力、security、failure、lifecycle、concurrency、determinism を先に考慮する。
5. code と必要な test / fixture / configuration だけを変更する。
6. compiler / static analysis、formatter、lint、unit / integration / end-to-end / conformance test、build など、repository instructions が定める適切な validation を実行する。
7. 差分を approved source、scope、public behavior、security、backward compatibility と照合する。
8. validation 未実行、仕様との未解決差異、残存 risk を明示して報告する。

## 禁止事項

- user instruction、approved source、repository instructions にない capability、API、設定、fallback、error、互換動作を発明しない。
- code の現在挙動、既存 test、一般的な framework / SDK の慣例だけで、requirement、design、specification を正当化しない。
- domain / platform / network / protocol / component の境界を、名前や実装の都合だけで統合しない。
- secret、credential、復号済み data、private input をログ、例外、テスト出力、生成 artifact へ漏らさない。
- validation を省略したまま成功と報告しない。repository-specific gate が不明な場合に勝手に PASS としない。
- 対象外の refactor、formatting、dependency update、rename、lockfile update を、実装に必要な変更として混入させない。

## 自己確認

- implementation が approved requirements / specification / design / ADR に trace できるか。
- external contract、input / output、validation、error、state、lifecycle、compatibility が守られているか。
- malformed / unsupported input、fail-closed、security、trust boundary、secret handling、resource limit、concurrency を必要な範囲で検証したか。
- deterministic behavior、serialization、canonicalization、numeric / byte / text correctness が曖昧でないか。
- domain / platform / network / protocol / version / component boundary を source に従って扱っているか。
- test が正常系だけでなく、境界値、異常系、tamper / auth / timeout / duplicate など対象に必要なケースを含むか。
- repository instructions にない path、toolchain、component、validation command、product capability を推測していないか。
- 未実行の validation、未解決の仕様、残存 risk、外部可視性への影響を正確に報告したか。

実装後は、repository instructions が指定するレビュー手順へ引き渡す。共通の Source of Truth、scope control、Git、validation、報告ルールは `../author-common/author-playbook.md` に従う。
