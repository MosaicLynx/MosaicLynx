# MosaicLynx Architecture Review 001

## レビュー情報

- 対象: `docs/design/architecture.md`
- 確認日: 2026-08-25
- 判定: `READY WITH CONDITIONS`
- レビュー方針: 現在確定済みの requirements を第一の source of truth とし、採用済み ADR、architecture、必要な下流仕様・外部 wallet-core 契約・現行 workspace の順に照合した。下流仕様や実装が architecture と異なることだけでは指摘せず、requirements と採用済み設計判断に対する architecture の適合性を評価した。変更は本レビュー成果物だけに限定した。

## 総評

architecture は、今回の再整理によって全体の基本設計として概ね成立している。

特に、Browser Extension と Mobile / Relay の経路を分離し、Extension / Mobile を Signer、Relay を信頼しない opaque transport、SDK を公開接続境界、wallet-core を鍵管理・秘密情報処理・raw signing の正本として整理した点は、確定済み requirements に適合している。秘密情報、利用者承認、transaction / message の意味解析、Chain / Network の整合性、結果対応、Service Worker / Mobile lifecycle、オンライン node 処理の責任も、基本設計として追跡できる。

一方、下流設計へ進む前に、wallet-core の既に固定された Binding 方式と MosaicLynx 側で未決の platform 統合方式を区別し、WASM Binding が実行コンテキストから秘密情報を隔離するものではないことを architecture 上で明確にする必要がある。いずれも責任分界の方向を変更する指摘ではなく、下流実装の誤解を防ぐための限定的な修正である。

## 確認した資料

### 上位資料

- `docs/concept/concept-sheet.md`
- `docs/requirements/requirements.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/relay.md`
- `docs/requirements/sdk.md`

### 設計判断

- `docs/adr/0001-mainnet-evidence-lite.md`
- `_snwc/docs/decisions/binding-implementation.md`

### 下流資料・外部契約・workspace

- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/specifications/profile-account-spec.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- 現行の `apps/*`、`packages/*`、`package.json` および workspace 構成
- 既存の requirements review 成果物

下流仕様・実装は、architecture の正誤を決める primary source ではなく、責任境界、外部契約および現在の workspace との整合確認に使用した。

## 良好な点

- v1 の対象と対象外を分け、announce、node 選択、残高・履歴、継続的 network state、blind signing、Profile 全体 backup / restore の共通必須化、MPC / Hardware Wallet / enterprise custody 等を現行必須設計から除外している。これは共通要件 `CR-014`、`FUTURE-001` および Concept の製品境界に整合する。
- Browser Extension の Provider / Content Script を秘密情報を扱わない搬送境界とし、privileged layer で browser context、Permission、Chain / Network / Account、要求完全性、承認および結果対応を扱っている。`BR-002`〜`BR-008`、`CR-NFR-008`〜`CR-NFR-011` に対応する。
- Service Worker の停止・再起動・更新・tab / document 変更を、秘密鍵、unlocked session または承認済み要求の安全な自動再開の前提にしていない。失われた context や承認を安全側に無効化する方針は `BR-007`、`BR-008`、`CR-NFR-010`、`CR-NFR-011` に適合する。
- Mobile App を Extension の単純な移植とせず、domain、request model、approval policy および wallet-core 境界を共有し、OS lifecycle、handoff、OS 保護、認証、Mobile UI を host 固有責任としている。`MR-001`〜`MR-007`、`MR-OPEN-002`〜`MR-OPEN-006` の扱いと整合する。
- Relay を opaque envelope、最小限の transport metadata / authorization、short-lived state、generation / stale / duplicate の structural validation に限定し、semantic inspection、表示、承認、署名、秘密情報処理、announce および長期履歴を担わせていない。`RR-003`、`RR-006`、`RR-008`、`RR-009` と整合する。
- SDK を dApp と Signer の transport 非依存な公開境界として位置付け、秘密鍵、Mnemonic、Vault 復号、raw signing、承認 UI、最終的な意味解析および node 処理を担わせていない。Extension 経路と Mobile / Relay 経路の operation、結果、失敗分類を共通化しつつ、危険な自動 fallback を禁止している点は `SDK-FR-009`、`SDK-SEC-001`、`SDK-SEC-007`、`SDK-ERR-001` に適合する。
- wallet-core と MosaicLynx の責任分界が明確である。wallet-core は Wallet Store、Mnemonic / Software Key、鍵導出、public identity、暗号、raw signing を担い、MosaicLynx は Profile / Account の Application 管理、Permission、意味解析、表示、承認、host / Relay integration および orchestration を担う。`CR-013`、`CR-AC-010`、`BR-009`、`MR-007` と整合し、旧来の MosaicLynx 側独自鍵導出・暗号・raw signing・同一秘密鍵共有の前提を再導入していない。
- Symbol / NEM は request / approval / lifecycle の共通モデルと、transaction schema、message format、address、network constant、semantic inspection、署名対象 bytes 等の chain 固有責務を分けている。`CR-005`、`CR-NFR-005` および wallet-core の chain compatibility 契約に適合する。
- 外部 node への問い合わせなしに request 検証、解析・表示、承認、wallet-core signing、結果検証を完了できるローカル境界を示し、air-gapped cold wallet と混同していない。MosaicLynx が node / announce を担わない点も `CR-006`、`CR-011`、`CR-AC-004` に整合する。
- `apps/mobile` が現行 workspace に存在しないことを明示し、Mobile の構成を実装済み・検証済みと誤認させていない。`apps/link-fallback`、`packages/*`、`apps/*` の対応付けも、実装の古さを architecture の責任として取り込まず、移行対象として扱っている。
- Mainnet capability の fail-closed 方針を architecture に残し、`docs/adr/0001-mainnet-evidence-lite.md` と共通要件 `CR-NFR-006` の存在を壊していない。

## 指摘事項

### AR-001

- ID: `AR-001`
- Severity: `MEDIUM`
- 対象: `docs/design/architecture.md` §5.2、§6.4、§6.8、§15、§17
- 問題: architecture は `CR-OPEN-001` / `CR-OPEN-002` の説明として、wallet-core の「Binding、FFI / WASM / Native」を未決事項として列挙している。MosaicLynx 側の platform integration、React Native 連携、秘密情報の一時受け渡し、OS 保護との組み合わせ、error mapping が未決であることは正しい。一方、wallet-core 側の v1 Binding 方式そのものは `_snwc/docs/decisions/binding-implementation.md` と `_snwc/docs/specifications/specification.md` §13 で、WASM は `wasm-bindgen`、Native は C ABI と既に固定されている。現記述のままでは、MosaicLynx の後続設計が wallet-core の v1 Binding 方式まで自由に再選択できるように読める。
- 根拠: 共通要件 `CR-013`、`CR-OPEN-001`、`CR-OPEN-002` は責任境界を確定したうえで Application からの具体的統合方式を後続設計へ委ねている。採用済み外部決定 `_snwc/docs/decisions/binding-implementation.md` §決定、`_snwc/docs/specifications/specification.md` §13 は wallet-core の v1 Binding 方式を固定している。architecture §6.8、§17 はこの二層を分けずに記述している。
- 影響: component design が Native / WASM の再選択や独自 Binding の追加を前提に進み、wallet-core の公開契約・所有権・error / warning 境界と競合する可能性がある。MosaicLynx 側で Binding に鍵管理・暗号・署名を再実装する誘因にもなる。
- 推奨対応: 「wallet-core v1 の Native / WASM Binding 方式は外部決定に従い固定済み」と明記し、未決範囲を「各 host がどの固定済み Binding を利用するか、必要な adapter / React Native 連携、OS 保護との組み合わせ、秘密 byte の一時 lifecycle、error mapping、既存 TypeScript 実装からの移行」に限定する。方式を変更する場合は `_snwc` の決定・仕様更新が先行することも示す。

### AR-002

- ID: `AR-002`
- Severity: `MEDIUM`
- 対象: `docs/design/architecture.md` §8、§9、§11、§15
- 問題: wallet-core を「独立した秘密情報境界」と表現しているが、wallet-core の WASM Binding は JavaScript と同じ execution context で動作し、WASM 自体は JavaScript から秘密情報を隔離する security boundary ではない。現 architecture は Web page / Provider / Content Script から wallet-core へ直接到達させない構成を別途示しているため、直ちに要件違反ではない。しかし、論理的な責任・API 境界と、実行コンテキスト・プロセスによる security isolation が区別されていない。
- 根拠: `_snwc/docs/decisions/binding-implementation.md` §WASM / Browser security contract は、WASM が同じ JavaScript execution context にあり、page context へ Wallet Core を直接公開すべきでないと明記する。`BR-006`、`BR-011`、`CR-NFR-002` は page / extension の分離と秘密情報の不要な複製・出力禁止を要求する。architecture §5.1、§8、§11 は page / content script 分離を示す一方、wallet-core の境界を独立した秘密情報 isolation と読める表現である。
- 影響: Browser Extension の WASM Binding を page context や Content Script に公開しても wallet-core が隔離してくれる、または Binding 内の zeroize が JavaScript 側のコピーを消去する、という誤った脅威モデル・実装判断につながる。秘密情報の最終保護責任、trusted host の範囲、WASM と Native の保証差のレビューが不十分になる。
- 推奨対応: 図と本文を「wallet-core は秘密情報処理の正本であり、MosaicLynx との論理/API 責任境界。ただし Binding 自体が host runtime から秘密情報を隔離するとは限らない」と明確化する。Browser では Binding を page / Content Script に公開せず privileged extension context だけから呼ぶこと、Mobile では選択した host / OS 保護境界の保証範囲を別途定義すること、WASM の入力 buffer や runtime コピーの完全消去を保証しないことを、trust boundary の前提として残す。

## 未決事項の評価

| 未決事項                                                                   | 評価                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 共通 `OPEN-001`（課題仮説）                                                | Architecture が解決しないのは妥当。製品検証の論点であり、基本の責任境界を阻害しない。                                                                                                                                                           |
| 共通 `OPEN-002`（利用者が必要とする表示情報）                              | 署名対象、Chain、Network、Account、確認可能な影響という要求境界は architecture にあり、表示粒度・transaction type 別の仕様を下流へ送るのは妥当。                                                                                                |
| 共通 `OPEN-003`（milestone 固有条件）および `OPEN-005`（Mainnet 運用詳細） | 共通能力、実施順序、fail-closed gate は architecture にあり、platform 固有の完了条件・release operation の詳細を下流へ送るのは妥当。ADR 0001 と矛盾しない。                                                                                     |
| `CR-OPEN-001` / `CR-OPEN-002`                                              | Application の統合方式、host ごとの Binding 利用、秘密情報 lifecycle、OS 保護、error mapping は未決でよい。ただし wallet-core v1 Binding の固定方式と再選択不可の境界を明記する必要がある（`AR-001`）。                                         |
| `MR-OPEN-001`〜`MR-OPEN-008`                                               | OS version、handoff、OS protection、認証、lifecycle、backup / migration、画面露出、Mobile release の詳細は architecture が固定しないのが妥当。外部要求検証、明示承認、安全側終了の責務は既に定義されている。                                    |
| `RR-OPEN-001` / `RR-OPEN-002`                                              | handoff wire 契約、Relay milestone 詳細、運用上の credential / state 条件は未決でよい。architecture は opaque transport、generation、structural validation、Signer 側 semantic validation の境界を先に固定できている。                          |
| `SDK-OPEN-002`〜`SDK-OPEN-007`                                             | aggregate / cosignature、transport 選択、transaction construction、runtime / distribution、versioning、caller binding は下流仕様へ送ってよい。自動 fallback 禁止、秘密情報非関与、Signer による最終承認という制約は architecture に残っている。 |
| message signing、transaction 対応範囲、Profile 全体 backup / restore       | v1 の message signing 必須能力と backup の共通非包含は確定し、format、対応 type、platform ごとの backup / migration は下流へ適切に分離されている。                                                                                              |

未決事項のうち、requirements ですでに確定している責任境界を architecture が再び未決化している事実は確認されなかった。`AR-001` は、外部 wallet-core で確定済みの Binding 方式と、MosaicLynx Application の統合方式の表現を分離するための指摘である。

## 下流設計への影響

この architecture を基に、Relay の具体 wire / storage、Provider と handoff の契約、chain-specific semantic inspection、Mobile host の詳細、Profile / Account の対応、wallet-core adapter の設計へ進むことはできる。

ただし、次の二点は component design の開始前または並行して architecture の記述を限定的に修正すべきである。

1. wallet-core の v1 Binding 方式を固定済みの外部契約として扱い、MosaicLynx 側の open scope を host integration に限定する。
2. wallet-core の論理的な秘密情報責任境界と、WASM / Native / host runtime の実際の isolation を分けて記載する。

これらを修正しても、既存の `packages/chain-symbol` / `packages/chain-nem` の重複処理、現行 Relay 実装、Mobile 未実装、既存 handoff specification の古い詳細を直ちに変更する必要はない。requirements を満たす下流仕様・移行計画・実装レビューで別途扱うべき事項であり、今回の architecture review の判定を下流実装の現状だけで変更していない。

## 最終判定

`READY WITH CONDITIONS`

基本設計としては成立しており、全体構成、責任分界、依存方向、Trust Boundary、秘密情報境界、署名フロー、Relay、SDK、Browser Extension、Mobile、Symbol / NEM、オンライン / ローカル境界および対象外範囲を、確定済み requirements に適合する形で判断できる。

ただし、`AR-001` と `AR-002` の二点は、wallet-core adapter と host security の下流設計を開始する前に、architecture 上で明示しておく必要がある。いずれも限定的な記述修正であり、BLOCKER または HIGH に相当する根本的不整合、Relay の信頼境界破綻、秘密情報の page / Relay 直接露出、または requirements 自体の矛盾は確認されなかった。
