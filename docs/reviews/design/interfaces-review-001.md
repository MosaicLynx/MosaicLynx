# MosaicLynx 共通データモデル・インターフェース基本設計レビュー 001

## レビュー情報

- 対象: [`docs/design/interfaces.md`](../../design/interfaces.md)
- 対象 revision: `1511b53`（`docs: 共通データモデル・インターフェース基本設計書を追加しました`）
- 確認日: 2026-08-26
- 前回レビュー: なし（初回レビュー）
- 判定: `READY WITH CONDITIONS`
- 変更範囲: 本レビュー成果物のみ。対象設計、要件、仕様、ADR、実装およびテストは変更していない。
- レビュー観点: 共通データモデル、producer / consumer / validator / trusted authority、Trust Boundary、Relay、SigningRequest / SigningResponse、Account、Chain / Network、TransactionSummary、Error、versioning、fail-closed、過剰設計および基本設計としての不足。

## 参照資料

- [`docs/design/interfaces.md`](../../design/interfaces.md)
- [`docs/design/security-design.md`](../../design/security-design.md)
- [`docs/design/signing-flow.md`](../../design/signing-flow.md)
- [`docs/design/architecture.md`](../../design/architecture.md)
- [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)
- [`docs/requirements/requirements.md`](../../requirements/requirements.md)
- [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md)
- [`docs/requirements/mobile-app.md`](../../requirements/mobile-app.md)
- [`docs/requirements/relay.md`](../../requirements/relay.md)
- [`docs/requirements/sdk.md`](../../requirements/sdk.md)
- [`docs/specifications/web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)
- [`docs/specifications/profile-account-spec.md`](../../specifications/profile-account-spec.md)
- [`docs/specifications/chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)
- [`docs/adr/0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md)
- [`_snwc/README.md`](../../../_snwc/README.md)
- [`_snwc/docs/requirements/requirements.md`](../../../_snwc/docs/requirements/requirements.md)
- [`_snwc/docs/specifications/specification.md`](../../../_snwc/docs/specifications/specification.md)
- [`_snwc/docs/decisions/binding-implementation.md`](../../../_snwc/docs/decisions/binding-implementation.md)

## 総評

`interfaces.md` は、共通データモデルとコンポーネント間の責任境界を扱う基本設計として概ね成立している。SDK / Web App / Signer / Relay / wallet-core の producer、consumer、validator および trusted authority を表で整理し、Relay を opaque transport、Signer を semantic validation・確認・承認の authority、wallet-core を秘密処理・raw signing の正本として分離している。この責任分担は concept、共通要件、architecture、security-design、signing-flow および Relay / SDK 要件と整合する。

また、SigningRequest の identity / correlation、operation、Chain / Network、target、caller、freshness、account selection、version context、TransactionSummary の derived-only 原則、user rejection と signing failure の区別、Symbol / NEM の chain-specific 境界、unknown input の fail-closed が明示されている。JSON Schema、wire protocol、UI、Wallet Core 内部 API、任意 blockchain 向けの generic abstraction へ踏み込みすぎてもいない。

ただし、下位設計が公開 Account と Signer 内部の account reference を混在させる余地、および署名結果不明・配送不明を共通結果モデルへどう引き継ぐかの曖昧さが残る。さらに、Network の producer に Relay / node を含める表現は、本文の opaque / untrusted 方針と比べて責任境界を誤読し得る。これらは本文の安全原則を直ちに破るものではないが、実装契約を確定する前に閉じるべき条件である。

## 良い点

- §4.1 の境界表が producer / consumer と validator / trusted authority を分けており、SDK が最終承認を代替せず、Relay が署名判断を持たないことを確認できる。
- §5 は暗号化済み・構造検証済みの入力も意味上は untrusted とし、Browser observed context と payload の信頼範囲を分離している。
- §3.4、§6.2 は private key、Mnemonic、seed、password、復号済み Wallet Store secret 等を Account や境界モデルから排除している。Wallet Core Binding が runtime isolation を自動提供しない点も適切に明記されている。
- §6.3 の SigningRequest は request identity / correlation、operation、Chain / Network、signing target、caller、freshness、account selection および version context を含み、未知 operation・期限切れ・重複・wrong signer・解析不能を推測処理しない。
- §6.5 は TransactionSummary を署名対象から導出する表示用の補助モデルと位置付け、外部 summary と payload の不一致、表示不能、未解析内容を fail-closed にしている。blind signing を誘発する authority の逆転はない。
- §6.4、§6.6 は success、user rejection、failed と、signature / signed transaction / cosignature 等の結果種別を意味上分離している。Signing-flow の Aggregate、cosignature、Partial、NEM multisig、message signing の責務を不必要に共通化していない。
- §10〜§12 は version context、unknown operation / format の拒否、既存の未決事項への委譲、generic plugin / RPC / message bus / schema registry 等の非対象を明示しており、基本設計としての粒度が妥当である。

## 指摘一覧

| ID     | Severity | Location         | Issue                                                                                                                                        |
| ------ | -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| IF-001 | MEDIUM   | §6.2、§6.3       | 公開 Account identity と Application / Signer 内部の account reference が同じ共通モデル内で区別されていない。                                |
| IF-002 | MEDIUM   | §6.4、§6.6、§9   | `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` が SigningResponse の共通 outcome / disposition として明示されず、`failed` へ畳み込まれる余地がある。 |
| IF-003 | LOW      | §6.1、§4.1、§4.2 | Network の producer に Relay / node を含める表現が、Relay の opaque transport と semantic authority の境界を曖昧にする。                     |

BLOCKER / HIGH の指摘はない。

## 詳細指摘

### IF-001: 公開 Account と内部 account reference の境界

**ID:** `IF-001`

**Severity:** `MEDIUM`

**Location:** `docs/design/interfaces.md` §6.2（133〜153行）、§6.3（168行）

**Issue:**

`Account` は公開された signing identity と説明されている一方で、概念上の項目に「Application が参照する account reference」を含み、`SigningRequest` にも Account reference を含め得る設計になっている。さらに `Account` は Web App ↔ SDK、SDK ↔ Signer、Relay handoff など複数の境界で扱われるため、公開 Account の情報と Signer / Application 内部の選択・管理参照の適用範囲が同じモデル上では明確でない。

**Rationale:**

SDK 要件 `SDK-FR-003` および Web Transaction Handoff 仕様 §5.2 は、内部 Profile ID、Account ID、Wallet Store 識別子、Extension の内部 `accountId` を外部アプリケーションの公開契約に含めない方針である。これは秘密情報そのものではないが、共通モデルがその境界を明示しないと、下位設計者が内部参照を SDK の公開結果、Relay envelope または dApp 提示値へ流用したり、requester が提示した参照を署名対象 Account の authority と誤認したりする余地が残る。

**Recommendation:**

公開 Account identity（Chain、Network、address、public key 等）と、Signer / Application 内部だけで使う Account selection / reference を概念的に分離する。または `account reference` が Signer-local であり、SDK 公開 API、Relay、dApp 向け response へ渡してはならないことを明記する。いずれの場合も、外部 requester の reference は Account 選択・認可の authority ではなく、Signer が現在の Profile / permission と照合する補助情報に限定する。具体的な型や property 名は下位仕様へ委譲してよい。

### IF-002: 署名結果不明と配送不明の共通結果モデル

**ID:** `IF-002`

**Severity:** `MEDIUM`

**Location:** `docs/design/interfaces.md` §6.4（177〜195行）、§6.6（221〜232行）、§9（307〜313行）

**Issue:**

`SigningResponse` の状態は success、user rejected、failed と整理されているが、署名生成自体の成否が確定しない `RESULT_UNKNOWN` と、署名済み result の配送だけが不明な `DELIVERY_UNKNOWN` は、共通結果モデルの状態または delivery disposition として明示されていない。本文は両者を成功へ変換しないと述べ、「下位仕様で別に扱える」としているが、`failed` として返してよいか、再試行・再署名をどう禁止するかがこの interface model からは確定しない。

**Rationale:**

`docs/design/signing-flow.md` §7.3〜§7.4、§20.3 は、署名生成不明と配送不明を明確に分離し、前者からの自動再署名を禁止し、後者では確定済み result の再送・照会だけを候補としている。両者を通常の failure に畳み込むと、dApp / SDK が「未署名」と推測して同じ target を再署名し、二重署名や結果取り違えを起こし得る。これは `Error` の完全な code catalogue を要求する問題ではなく、共通 interface が安全な処理判断に必要な意味を予約しているかの問題である。

**Recommendation:**

共通モデルに、署名 lifecycle の非成功 outcome として `result unknown` を、署名済み result の delivery disposition として `delivery unknown` を概念上明示する。少なくとも `failed` への自動的な同一視を禁止し、`RESULT_UNKNOWN` からは自動再署名を行わず、`SUCCEEDED + DELIVERY_UNKNOWN` からは既存 result の再送・照会だけを許すことを `signing-flow.md` への規範的な参照として固定する。wire field、error code、retry API の詳細は下位仕様へ委譲してよい。

### IF-003: Network の producer と Relay / node の semantic authority

**ID:** `IF-003`

**Severity:** `LOW`

**Location:** `docs/design/interfaces.md` §6.1（118〜129行）、§4.1（77〜86行）、§4.2（93〜94行）

**Issue:**

`Network` の producer は SDK、dApp、Relay または node になり得ると記載されている。直後に自己申告を untrusted とし、Signer が payload・Account・Profile と照合して確定すると定めているため実際の authority は Signer に残っているが、「producer」という用語は Relay / node が Network という意味モデルを生成できるようにも読める。

**Rationale:**

Relay 要件 `RR-003` および architecture §6.5 / §6.7 は、Relay は opaque envelope の構造・配送だけ、node は untrusted な補助情報だけを扱い、transaction や Chain / Network の意味判断を担わないとしている。下位設計で Relay / node の metadata を semantic producer と実装すると、Network の確定責任や Chain-specific validation が transport 側へ逆流する。

**Recommendation:**

「producer」は、Chain / Network を要求へ申告または transport する SDK / dApp / handoff client と、payload・Profile・Account と照合して authoritative な文脈を導出する Signer / chain-specific integration に限定する。Relay / node は untrusted metadata の搬送・提供元に留まり、Network model を生成・確定しないと明記する。これは本文の安全原則を変えずに責務用語を整える修正で足りる。

## Security / Trust Boundary 評価

| 観点                               | 評価         | 根拠                                                                                                                                                                                                                                  |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Secret isolation                   | 条件付き適合 | §3.4、§6.2、§9 が秘密情報を境界モデルから排除し、wallet-core と host の責務を分離している。IF-001 の内部 account reference は Secret ではないが、公開情報と内部情報の境界を明確化する必要がある。                                     |
| Signer の semantic authority       | 適合         | §4.1、§5、§6.3、§6.5、§8 が caller、target、Chain / Network、Account、summary、承認および結果を Signer が検証する構造を維持している。                                                                                                 |
| TransactionSummary / blind signing | 適合         | summary を target-derived の確認用モデルに限定し、外部 summary の単独信用、不一致、未解析、表示不能を fail-closed にしている。Aggregate / cosignature / Partial / NEM multisig は全体確認不能時に拒否する signing-flow と矛盾しない。 |
| Relay boundary                     | 条件付き適合 | §4.1、§4.2、§7.3 は Relay を opaque delivery に限定している。IF-003 の producer 表現だけは、下位設計前に用語を明確化すべきである。                                                                                                    |
| Replay / freshness                 | 条件付き適合 | request identity / correlation、期限、freshness、generation、duplicate / replay の概念はある。IF-002 により result unknown と delivery unknown の安全な後続判断を共通 interface へ引き継ぐ必要がある。                                |
| Fail-closed                        | 適合         | unknown version / operation / format / transaction type / network、wrong signer、invalid correlation、summary 不一致、validation failure を推測処理しない。                                                                           |

Security-design §3〜§17 の secret isolation、trusted UI、署名対象と表示内容の一致、署名ごとの認証、Relay / node / SDK の untrusted 扱いおよび fail-closed とは、上記条件を除き矛盾しない。既存の security invariant を弱める記述は確認されなかった。

## 責任境界評価

| 境界                            | 評価                                                                                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web App ↔ SDK                   | SDK が公開操作を論理 request へ変換し、correlation と transport 差異を扱う。SDK が秘密、最終承認、semantic inspection、raw signing を持たない点は要件と整合する。                             |
| SDK ↔ Signer                    | SDK が producer / adapter、Signer が consumer かつ最終 validator / approval authority と整理されている。caller の自己申告を Signer の authority としていない。                                |
| Web App ↔ Browser Extension     | Browser observed sender / Origin / document context と page の自己申告を分離し、Extension privileged layer を最終確認主体としている。                                                         |
| Relay ↔ Mobile                  | Relay は opaque envelope の構造・配送条件、Mobile は integrity・意味・表示・承認・署名を担う。Relay が署名・承認・transaction 解釈を代替する構造はない。IF-003 の用語だけ明確化が必要である。 |
| Browser Extension ↔ wallet-core | Extension が承認済み target と binding を検証し、wallet-core が Store・key identity・秘密処理・raw signing を担う。wallet-core に caller、UI、permission、署名意図を委譲していない。          |
| Mobile ↔ wallet-core            | Browser Extension と同じ共通境界を保ち、OS protection、lifecycle、Binding の具体方式を Mobile / platform 下位設計へ委譲している。Mobile 未実装を実装済みと扱っていない。                      |

## 基本設計粒度の評価

基本設計として必要な「データの意味」「境界」「検証責任」「trusted authority」「fail-closed」は十分に記述されている。SigningRequest の全 wire field、SigningResponse の concrete schema、Error code catalogue、JSON / CBOR、HTTP / WebSocket、Deep Link、Chrome event、UI layout、Wallet Core Binding 内部形式を確定していないため、詳細設計との責任分担も適切である。

TransactionSummary の項目例は、資産移動、権限変更、aggregate / multisig、message 等の security-relevant な確認対象を示すために必要な範囲であり、transaction type ごとの UI 仕様へ過度に踏み込んでいない。Symbol / NEM は request lifecycle、approval、correlation 等だけを共通化し、schema、address、hash、signing bytes、aggregate / multisig semantics を chain-specific に残している。

一方、IF-001 と IF-002 は型や property 名の不足ではなく、下位設計者が公開境界・結果処理を誤って実装し得る意味契約の不足である。IF-003 は本文間で authority は一貫しているものの、producer という用語の曖昧さを残す。これらを整理すれば、基本設計の粒度は下位設計へ進むために十分である。

## 未決事項

以下は本レビューで新たに仕様化せず、既存資料の未決事項として下位工程へ引き継ぐ。

- SDK の aggregate / multisig / cosignature 公開範囲、transport 選択、transaction construction、version policy、caller / Origin binding（`SDK-OPEN-002`、`SDK-OPEN-003`、`SDK-OPEN-004`、`SDK-OPEN-006`、`SDK-OPEN-007`）。
- Mobile の外部要求受信方式、OS protection、wallet-core Binding、lifecycle、backup / migration（`MR-OPEN-002`、`MR-OPEN-003`、`MR-OPEN-005`、`MR-OPEN-006`）。
- Application と wallet-core の host integration、秘密 byte lifecycle、error mapping、migration（`CR-OPEN-001`、`CR-OPEN-002`）。
- Relay の具体的な wire protocol、TTL、generation、storage、result の再送・照会契約。
- Symbol / NEM の対応 transaction type / version、message format、aggregate / multisig / cosignature の公開範囲と表示受け入れ条件。

これらの未決事項は、Account の公開・内部境界、Signer による semantic validation、利用者承認、Relay の非署名責任、result unknown の再署名禁止を弱める根拠にはならない。

## 最終判定

`READY WITH CONDITIONS`

BLOCKER / HIGH はなく、security / Trust Boundary の根幹、Relay の非署名責任、TransactionSummary の authority 分離、Symbol / NEM 対応、基本設計の非過剰性は妥当である。下位設計へ進める前に、IF-001 の Account scope と IF-002 の result / delivery disposition を共通契約として明示することを条件とする。IF-003 は同時に用語を明確化すべき低い優先度の条件である。これらを `interfaces.md` または下位仕様で解消した後、短い再確認を行うことを推奨する。

## Validation

- レビュー対象の行番号: 指摘ごとに `docs/design/interfaces.md` の実在する節・行を確認した。
- repository 内リンク: 参照資料の存在確認に成功した。
- Markdown formatter: `pnpm exec prettier --check docs/reviews/design/interfaces-review-001.md` 成功。
- `git diff --check`: staged diff で成功。
- 変更範囲: 本レビューで作成・変更したのはレビュー成果物 1 ファイルのみ。対象設計書の既存ワークツリー変更は保持し、変更していない。
- リポジトリ全体 `pnpm format:check`: 失敗。レビュー成果物単体は成功したが、既存の `_nem`、`_sns`、`_snwc` 等に大量の format warning と HTML parse error があり、今回のレビュー成果物起因ではない。
- lint / typecheck / test / build: レビュー成果物のみの変更のため実行対象外。未実行を成功とは扱わない。
