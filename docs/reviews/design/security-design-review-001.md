# MosaicLynx 共通セキュリティ設計レビュー 001

## レビュー情報

- 対象: [`docs/design/security-design.md`](../../design/security-design.md)
- レビュー日: 2026-08-25
- レビュー種別: 共通セキュリティ設計レビュー
- 変更範囲: 本レビュー成果物のみ。対象設計書、要件、仕様、実装は変更していない。
- 最終判定: `READY WITH CONDITIONS`

## 総評

共通セキュリティ設計は、後続の Browser Extension / Mobile / Relay / SDK 設計へ進むための骨格を概ね満たしている。

特に、Wallet Core と Signer host の責任分界、SDK / dApp / Deep Link / Relay / Node / 外部 API を信頼しない前提、秘密情報を外部へ渡さない方針、起動時 LOCKED、署名ごとの再認証、blind signing の禁止、署名前の解析・表示・payload 一致確認、request 単位の replay / concurrent isolation、Relay の opaque transport、Node response の補助情報扱い、秘密情報のログ禁止、trusted UI、fail-closed および incident recovery は明確である。12 個の Security Invariants も、本文の中心原則を短く固定するものとして成立している。

一方、下位設計がこの文書だけを参照した場合に安全条件を弱く解釈し得る箇所がある。主なものは、署名確認フィールドの表示を `必要に応じて` としている点、Wallet Core の warning / binding error / Store 検証失敗を fail-closed と明示していない点、message signing の caller / purpose / freshness / domain separation の共通原則が本文に直接現れていない点、Security Invariant 1 の秘密情報の宛先列挙が本文より狭い点である。また、Profile 仕様の `while-unlocked` との矛盾は、共通セキュリティ設計を弱めず、既存仕様を整合させる必要がある。

これらは暗号方式や具体 API を共通設計へ追加する要求ではない。共通 MUST の表現と、下位資料へ委譲する境界を明確にすれば、各コンポーネントの詳細設計へ進められる。

## 最終判定

`READY WITH CONDITIONS`

共通設計としての Trust Boundary、Key Lifecycle、認証、署名承認、Relay / Node trust、fail-closed、incident recovery は成立しているため、条件を満たす範囲で下位設計へ進めてよい。ただし、次の条件を満たすまでは、下位設計が任意の警告 bypass、while-unlocked 署名、Wallet Core warning の無視、message の文脈欠落または秘密情報の Provider / Web 境界流出を許す仕様にならないことを確認できない。

## 確認した資料

### 上流・共通資料

- `docs/concept/`
- `docs/requirements/requirements.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/relay.md`
- `docs/requirements/sdk.md`
- `.agents/project-context.md`

### 設計・仕様・責任契約

- `docs/design/architecture.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/release/threat-model.md`
- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`

下流資料の現在の記述と異なることだけを理由に、共通セキュリティ設計を誤りとは判定していない。共通要求、承認済み責任分界および Wallet Core の外部契約との整合を中心に評価した。

## 良好な点

- Wallet Core、Browser Extension、Mobile App を trusted component としつつ、入力値や外部由来の戻り値は別途 untrusted と扱っている。OS Secure Storage を Limited Trust とした区別も適切である。
- SDK、dApp、Deep Link、Relay、Node、外部 API を信頼せず、Relay / SDK の侵害だけで秘密鍵取得や無確認署名へ直結しない構造を要求している。
- Wallet Core の暗号、KDF、Wallet Store、zeroization を本書で再設計せず、host の UI / permission / semantic inspection / orchestration と分離している。
- 起動時 LOCKED、明示操作による unlock、署名ごとの再認証、Browser Extension のパスコード必須、外部要求による unlock 禁止、自動署名禁止が一貫している。
- 署名対象から確認情報を生成し、表示後および署名直前に payload、caller、Account、Chain、Network の変化を検出して再承認するため、TOCTOU への基本防御がある。
- 未知 type、未対応 version、parse / validate 不能、表示不能または raw payload の安全な解釈不能を拒否し、警告だけで bypass できる通常経路を禁止している。
- connection permission と signing authorization を分離し、Account、caller、session、permission、Chain / Network を request ごとに結び付け、revoke と concurrent isolation を要求している。
- `requestId`、`createdAt`、`expiresAt`、処理済み request の再利用拒否、同一 ID の内容衝突拒否、結果の request への紐付けを定めている。Chain の deadline とは別の application-layer replay protection になっている。
- Relay を配送専用の untrusted transport とし、秘密情報、意味解釈、承認、署名、announce を持たせていない。Relay 障害・侵害だけで資産移動に到達しない条件も明確である。
- Node / 外部 API の fee、metadata、namespace、mosaic 等を補助情報に限定し、悪意ある Node response や取得失敗を理由に署名確認を省略しない。
- Secret / Sensitive / Public の分類、ログ・telemetry・crash report への Secret 出力禁止、transaction payload 全文ログ禁止、最小保持、lock / revoke / expiry 時の無効化が定められている。
- export の明示操作・再認証・trusted UI、Secret の clipboard 原則禁止、QR の高リスク扱い、Mobile の画面露出対策、Browser Extension の screenshot 非保証が明記されている。
- parse、validation、network、permission、request integrity、認証、Wallet Core validation、Relay / Node / API 障害、result unknown を署名拒否へ倒す fail-closed がある。
- 異常時に署名可能状態、session、一時認証、処理中 request を無効化し、再承認なしの再開を禁止する一方、秘密鍵の自動削除や Relay 侵害だけを理由とする鍵更新を要求していない。
- Software Integrity は正規配布、改ざん検出、Wallet Core version、dependency / supply chain、厳格な security review、migration の平文退避禁止、debug / production 分離までを原則として示し、CI の具体実装を過剰に固定していない。

## 指摘一覧

| ID         | Severity | 対象                      | 要約                                                                                                                                          |
| ---------- | -------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| SD-SEC-001 | `MEDIUM` | §8.1                      | 署名確認フィールドの列挙が `必要に応じて` で、適用可能な全フィールドの表示・確認不能時拒否が MUST として十分明確でない                        |
| SD-SEC-002 | `MEDIUM` | §15.1、§18                | Wallet Core の warning、binding error、Store 検証失敗を無視せず署名拒否にする条件が明示不足                                                   |
| SD-SEC-003 | `MEDIUM` | §8、§10、§19 SEC-OPEN-004 | message signing の文脈結合・用途・nonce・有効期限・domain separation の共通原則が直接固定されておらず、OPEN の記述も現行 handoff 契約より広い |
| SD-SEC-004 | `MEDIUM` | §6、§17 Invariant 1 / 8   | Security Invariant の秘密情報・侵害影響の宛先列挙が、本文の Provider / Content Script / URL / Deep Link / Node 等より狭い                     |
| SD-SEC-005 | `MEDIUM` | §7、§19 SEC-OPEN-001      | `while-unlocked` を無効な実装条件とする共通方針は正しいが、Profile 仕様に弱い選択肢が残っており、下位設計の正本が未確定                       |

### SD-SEC-001: 署名確認フィールドの MUST 性

**Severity:** `MEDIUM`

**根拠:** §8.1 は Signer 自身が署名対象から確認情報を生成し、未知・省略・取得不能な危険情報を隠さないことを定めている。しかし、表示対象の列挙が「必要に応じて、少なくとも」となっているため、下位設計が Recipient、Amount、Fee、Deadline、Message、Aggregate 内部 transaction、Metadata、権限変更等のうち一部だけを表示しても、共通設計上の必須条件を満たすと解釈される余地がある。

`docs/requirements/requirements.md` の CR-002 / CR-007-TX、`docs/specifications/product-spec.md` §12、`docs/specifications/chain-compatibility-spec.md` §4〜§5 は、対応範囲内の全体と確認可能な影響を解析・表示できない場合は署名しない方向である。共通設計は schema や UI の詳細を決める必要はないが、適用可能な署名対象フィールドを表示できない場合の拒否条件は共通 MUST として持つべきである。

**推奨対応:** 「署名対象に存在する security-relevant field は、対象 Chain / operation に応じて全て確認可能な形で表示する。任意の適用フィールドを解析・表示できない場合は署名しない」と原則を明記する。具体的な field 表、表示順、UI は Chain integration / platform 設計へ委譲する。

### SD-SEC-002: Wallet Core failure の fail-closed 明示

**Severity:** `MEDIUM`

**根拠:** §15.1 の列挙には `Wallet Core validation` があるが、Wallet Core の warning、Binding error、Store 検証失敗、署名前後の Core error を明示的に「無視・継続してはならない」としていない。§18 も Wallet Core を正本として承認済み payload を渡す条件は示すが、Core の非成功結果の扱いを共通 MUST として独立に書いていない。

一方、共通要件 CR-NFR-004 は、Wallet Core の失敗、warning、Binding error、Store 検証失敗を無視して署名を継続してはならないと定めている。共通セキュリティ設計だけを参照する下位設計でもこの条件が見える必要がある。

**推奨対応:** fail-closed の確認項目に「Wallet Core の error / warning / binding error / Store integrity failure」を追加し、いずれも署名結果を返さず、秘密情報を error / diagnostics へ含めないことを明記する。Wallet Core 内部の error code や暗号仕様は追加しない。

### SD-SEC-003: message signing の共通セキュリティ原則

**Severity:** `MEDIUM`

**根拠:** §8 は message の解析・表示・payload 一致と blind signing 禁止を含むが、message signing において、検証済み caller / origin、Account、Chain / Network、用途、nonce、message 自体の有効期限および domain separation をどのような security property として維持するかを直接述べていない。§10 の request-level `requestId` / `createdAt` / `expiresAt` は application request の replay 防止であり、署名された message の再利用・別用途への転用を防ぐ message-level の文脈とは別である。

`docs/specifications/product-spec.md` §3 / §12.2 と `docs/specifications/web-transaction-handoff-spec.md` §5 / §7 は、構造化 message と `signData` の具体契約を既に定めている。したがって、SEC-OPEN-004 の「具体契約が未確定」は、現状では message の platform 表示受け入れ条件や既存 handoff との整合確認に絞るのが適切である。

**推奨対応:** 共通設計に「message signing は、operation に適用される caller / origin、Account、Chain / Network、用途、freshness / nonce および domain separation を含む承認済み message semantics を維持し、文脈を検証・表示できない message は署名しない」と原則だけ追加する。具体 API、wire schema、encoding、nonce 形式、期限値は protocol / SDK / platform 設計へ委譲する。

### SD-SEC-004: Security Invariant の秘密情報境界の範囲

**Severity:** `MEDIUM`

**根拠:** §6.2 は平文秘密鍵を Provider、Content Script、URL、通知、長期 cache に保持してはならないとし、§12 は外部通信、URL、clipboard、diagnostics 等への出力も禁止している。しかし Invariant 1 は「SDK / dApp / Relay / 外部 API」に限定され、Invariant 8 も侵害主体を Relay / Node / SDK / dApp に限定している。Invariant 単体を下位設計のチェックリストとして使うと、Provider / Web page / Content Script / Deep Link / URL / Node への秘密情報流出や、外部 API / Deep Link の侵害影響が列挙漏れに見える。

本文のより強い条件が存在するため、直ちに秘密情報を許可する矛盾ではない。ただし、下位設計へ逸脱不能な MUST として掲げる Invariants の表現は本文と同じ境界を指す必要がある。

**推奨対応:** Invariant 1 を「SDK、dApp / Web page、Provider / Content Script、Deep Link、Relay、Node、外部 API、URL、ログ等の untrusted external boundary に渡さない」のような包括表現へ広げる。Invariant 8 も「外部連携経路・補助サービスの単独侵害」として本文の threat model と一致させる。新しい invariant を追加する必要はない。

### SD-SEC-005: Profile の `while-unlocked` との正本衝突

**Severity:** `MEDIUM`

**根拠:** §7.1 は署名ごとの再認証を MUST とし、接続 permission、session、直前認証の流用を禁止している。§19 SEC-OPEN-001 も、Profile 仕様 §20 の `while-unlocked` を有効な実装条件として扱わないと明記している。この共通方針は、今回の承認済み方針に適合し、安全側である。

しかし `docs/specifications/profile-account-spec.md` §20 は現在も `while-unlocked` / `every-signature` を設定可能な選択肢として記載している。共通設計が正本であることを下位設計が必ず知る仕組みがないままでは、Profile / Account の詳細設計で署名ごとの再認証を弱める余地が残る。

**推奨対応:** Profile / Account 仕様または承認済み設計判断で、署名ごとの再認証を正本として `while-unlocked` を廃止・非適用にする。Profile 仕様を本レビューで変更する必要はないが、整合が完了するまで下位設計は `while-unlocked` を採用してはならない。Browser Extension のパスコード再入力 MUST と Mobile の毎回 user-presence / 認証条件は維持する。

## 17観点の確認結果

| #   | 観点                                     | 評価         | 根拠・判定                                                                                                                                                                        |
| --- | ---------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Trust Boundary                           | 適合         | §3〜§5。Trusted / Limited Trust / Untrusted、Signer / Wallet Core / OS、外部入力の untrusted 扱い、Relay / SDK 侵害時の非直結が明確。                                             |
| 2   | Key Lifecycle                            | 条件付き適合 | §6。保持主体、Wallet Core の正本、平文永続化禁止、import の trusted UI、短期破棄は適切。生成・import を Wallet Core 経由で行うことは下位設計で必ず維持する。                      |
| 3   | Lock / Authentication                    | 条件付き適合 | §7。共通方針は適合。Profile §20 の `while-unlocked` 整合が未完了で、SEC-OPEN-001 の条件が残る。                                                                                   |
| 4   | Signing Authorization                    | 条件付き適合 | §8。解析・表示・payload 一致・TOCTOU 防止は適合。適用可能な全 field の表示を MUST とする明確化が必要（SD-SEC-001）。                                                              |
| 5   | Blind Signing                            | 適合         | §8.2。未知 type、未対応 version、parse / validate 不能、raw payload の安全な解釈不能、警告 bypass を拒否。                                                                        |
| 6   | External Request / Permission            | 適合         | §9。Origin / caller、Account 選択、connection と signing の分離、revoke、外部からの権限拡張禁止を確認。具体 caller verification は下位設計へ適切に委譲。                          |
| 7   | Replay / Concurrent Request              | 適合         | §10。requestId、createdAt / expiresAt、処理済み拒否、結果 correlation、同時要求分離、payload 変更時の再承認、不変原則を確認。                                                     |
| 8   | Relay Security Model                     | 適合         | §11.1。Relay は untrusted / delivery-only、opaque、TLS、最小保持、署名・承認・秘密情報なし、侵害時の安全側を確認。プロトコル詳細の委譲も妥当。                                    |
| 9   | Network / Node Trust                     | 適合         | §11.2。Node response、payload、fee、metadata 等を外部入力 / 補助情報とし、network mismatch と取得失敗を安全側に扱う。                                                             |
| 10  | Sensitive Data / Logging / Retention     | 適合         | §12。分類、Secret のログ禁止、payload 全文ログ禁止、最小保持、revoke / lock / deletion、cryptographic erasure の位置付けを確認。                                                  |
| 11  | Backup / Export / Clipboard / Screenshot | 適合         | §6.3、§13。明示操作、再認証、trusted UI、暗号化形式優先、clipboard / QR / Mobile screen 対策、Extension 非保証を確認。具体 platform policy の委譲は妥当。                         |
| 12  | Brute-force Protection                   | 適合         | §7.3。高速・無制限試行の禁止、段階的待機、再起動 reset 防止、秘密鍵自動削除禁止、Wallet Core / OS / 外部 caller の責任分界を確認。                                                |
| 13  | Anti-Phishing / Trusted UI               | 適合         | §14。外部 HTML / Markdown / branding / 表示名を信頼せず、MosaicLynx 管理 UI と caller / origin 検証を要求。                                                                       |
| 14  | Fail-Closed                              | 条件付き適合 | §15.1。parse、validation、network、permission、request、認証、Relay / Node / API、result unknown を拒否する。Wallet Core warning / binding error 等の明示を要する（SD-SEC-002）。 |
| 15  | Software Integrity                       | 適合         | §16。正規配布、改ざん検出、Wallet Core version、supply chain、厳格レビュー、migration、debug / production 分離を確認。SHA pin / SBOM 等の詳細委譲は妥当。                         |
| 16  | Incident / Recovery                      | 適合         | §15.2。署名可能状態、session、temporary auth、処理中要求を破棄し、再承認なし再開を禁止。自動鍵削除や Relay 侵害との不必要な鍵更新連動も禁止。                                     |
| 17  | Security Invariants                      | 条件付き適合 | §17 の12項目は MUST として明確で本文との主旨も一致。ただし Invariant 1 / 8 の外部境界列挙を本文と揃える必要がある（SD-SEC-004）。                                                 |

## SEC-OPEN-001〜004 の評価

| OPEN         | 評価            | 判定・必要な引継ぎ                                                                                                                                                                                                                                                                                                                                                                            |
| ------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-OPEN-001 | 条件付き解消    | `while-unlocked` を共通設計で無効な実装条件とした判断は正しい。共通方針を弱めず、Profile / Account 仕様側を改訂するか正本優先の設計判断を記録する必要がある。整合完了まで `while-unlocked` は採用不可。                                                                                                                                                                                       |
| SEC-OPEN-002 | OPEN 継続が妥当 | Mobile で生体認証を利用可能とする共通方針と、具体的な OS capability、credential 保管、fallback、lifecycle は分離できている。既存 Profile §22 の「将来 capability」は、共通方針を弱める根拠にせず、Mobile / Profile の capability 位置付けを整合させる。生体認証が使えない場合に認証なしへ落ちることは許可しない。                                                                             |
| SEC-OPEN-003 | OPEN 継続が妥当 | 同一秘密鍵利用の可否や chain 別 Account 対応は、共通セキュリティ設計で暗号設計を決める事項ではない。Wallet Core、Profile / Account model、chain integration の責務として確定し、本書では Symbol / NEM の処理を暗黙に共通化しない原則を維持すればよい。共通設計から重大な暗号変更を提案する必要はない。                                                                                        |
| SEC-OPEN-004 | 範囲縮小が必要  | 具体 API / schema / wire format は protocol / SDK / platform design へ委譲するのが妥当。ただし現行 handoff 仕様には `signData`、structured message、request / response の具体契約が既にあるため、「具体契約が未確定」という表現は広すぎる。未確定範囲を platform 表示受け入れ条件・既存契約との整合・対応 format の詳細に絞り、共通設計には SD-SEC-003 の message security principle を残す。 |

## Security Invariants 12項目の確認

| #   | Invariant                                                                    | 確認結果                                                                                                                   |
| --- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | 秘密鍵・mnemonic を SDK / dApp / Relay / 外部 API に渡さない                 | 条件付き適合。本文の Provider、Content Script、URL、Deep Link、Node 等まで含む境界へ表現を広げる必要がある（SD-SEC-004）。 |
| 2   | 秘密情報を平文で永続保存しない                                               | 適合。§6、§12、§13 と一致。Wallet Core 内部の暗号仕様を本書で再設計していない。                                            |
| 3   | 外部入力はすべて untrusted input として扱う                                  | 適合。§3、§5、§11 と一致。                                                                                                 |
| 4   | 署名内容を解析・検証・表示できない場合は署名しない                           | 適合。§8.1 / §8.2 / §15 と一致。                                                                                           |
| 5   | ユーザーが確認した内容と実際に署名する payload を一致させる                  | 適合。§8.1、§10.2、§15 と一致。                                                                                            |
| 6   | `1 request = 1 confirmation = 1 authentication = 1 signing`                  | 適合。§7、§10.2 の本文と一致。                                                                                             |
| 7   | 署名ごとにユーザー認証を必須とし、自動署名を許可しない                       | 条件付き適合。共通設計は明確だが、Profile §20 の `while-unlocked` と整合させる必要がある（SEC-OPEN-001）。                 |
| 8   | Relay / Node / SDK / dApp の侵害だけでは秘密鍵取得や無確認署名を成立させない | 条件付き適合。本文の外部 API / Deep Link 等も含む単独侵害非直結の表現へ揃える必要がある（SD-SEC-004）。                    |
| 9   | Secret を log / telemetry / crash report に出力しない                        | 適合。§12 と一致。warning、exception、URL、clipboard 等の禁止も本文にある。                                                |
| 10  | 安全性を確認できない場合は Fail Closed とする                                | 条件付き適合。一般原則は明確。Wallet Core warning / binding error / Store 検証失敗の明示を要する（SD-SEC-002）。           |
| 11  | 認証・署名確認 UI は MosaicLynx 自身が制御する                               | 適合。§8、§14 と一致。                                                                                                     |
| 12  | セキュリティ異常時は署名可能状態を解除し、以前の承認状態を再利用しない       | 適合。§15.2 と一致。秘密鍵自動削除禁止とも矛盾しない。                                                                     |

## 下位設計への進行可否

条件付きで進行可能である。

- Browser Extension の Provider / origin / privileged layer、Relay の opaque transport、SDK の handoff、Chain integration の semantic inspection、Mobile の OS integration へ進んでよい。
- 下位設計では、少なくとも SD-SEC-001〜005 の条件を設計受入条件へ取り込むこと。
- Profile / Account の認証仕様が `while-unlocked` を残したままの場合、署名フローの詳細確定と実装承認へは進めない。
- Mobile の生体認証、screen capture、OS Secure Storage、fallback は具体方式を下位設計へ委譲してよいが、毎回の明示的 user presence / 認証、外部要求からの省略不可、失敗時 fail-closed を弱めてはならない。
- Message signing の具体 format / API / wire contract は protocol / SDK / platform design へ委譲してよいが、message の caller / purpose / freshness / domain separation と表示対象の一致を共通原則として扱うこと。

## 未解決事項

- SD-SEC-001〜005 の文書上の明確化。
- Profile §20 の `while-unlocked` と共通方針の正本整合。
- Profile §22 の biometric capability 記述と、Mobile の実行時 capability / fallback / lifecycle の整合。
- Symbol / NEM の同一秘密鍵利用と chain 別 Account 対応の責任主体・固定契約。これは共通セキュリティ設計で暗号方式を決めず、Wallet Core / Profile / chain integration 側で扱う。
- `signData` の既存 handoff 契約に対する platform ごとの表示・承認・対応 format の受入条件。
- aggregate / multisig / cosignature、Profile 全体 backup / restore、Mobile lifecycle、OS protection、release operation の具体詳細。これらを理由に共通 MUST を弱めてはならない。

## Validation

- Prettier / Markdown format check: `pnpm exec prettier --check docs/reviews/design/security-design-review-001.md` は成功。
- `git diff --check`: レビュー成果物の staged 差分で成功。
- 変更範囲確認: `git status` と staged diff でレビュー成果物 1 ファイルのみを確認。
- リポジトリ全体 `pnpm format:check`: 失敗。対象ファイルはチェックを通過したが、既存の `_nem` / `_sns` 等に大量の format warning と HTML parse error があり exit 2。今回のレビュー成果物起因ではない。
- リポジトリ全体の lint / typecheck / test / build: 設計レビュー成果物のみのため実行対象外。未実行を成功とは扱わない。

## 変更範囲・コミット・プッシュ

- 作成ファイル: `docs/reviews/design/security-design-review-001.md`
- 対象設計書、concept、requirements、Wallet Core、Browser Extension / Mobile / Relay / SDK 資料、実装コードは変更しない。
- コミット: レビュー成果物の検証後に、日本語の履歴形式に合わせて作成する。
- push: コミット後に `origin/main` へ実施する。
