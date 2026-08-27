# MosaicLynx 共通セキュリティ設計 再レビュー 004

## 1. Review Target

- 対象: [`docs/design/security-design.md`](../../design/security-design.md)
- Review ID: `security-design-review-004`
- 確認日: 2026-08-27
- 種別: `design-review` Skill による独立した全体再レビュー
- 変更範囲: 本レビュー成果物のみ。対象設計書、要件、仕様、ADR、個別 Design、wallet-core、実装およびテストは変更していない。
- 過去レビュー: [`security-design-review-001.md`](./security-design-review-001.md)、[`security-design-review-002.md`](./security-design-review-002.md)、[`security-design-review-003.md`](./security-design-review-003.md)

過去レビューは `SD-REVIEW-001`〜`003` の再確認対象を特定するためだけに参照し、今回の Review Gate は現在の Security Design と上位資料・関連下流資料の直接比較から独立に判定した。

下流資料は、責任境界、用語、traceability および明白な矛盾の確認に限定して参照した。API endpoint、function signature、JSON / DTO / schema、exact timeout、retry count、OS API、concrete state machine、exact cryptographic algorithm / parameter、key derivation parameter、UI layout、implementation class / module および test implementation の不足は、Security Design の finding としていない。

## 2. Execution Audit

最新の `design-review` Skill、共通 review playbook、reviewers、review gates、output format、`.agents/project-context.md` および `AGENTS.md` を確認した。サブエージェントは使用せず、playbook の Reviewer A〜D を別々の走査として実施した。

| Path                          | 確認内容                                                                                                                   | 結果                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A: structure / responsibility | 目的、適用範囲、Signer、Browser Extension、Mobile、wallet-core、SDK、Relay、Node、OS の責任分界                            | 基本設計の責務境界は成立。wallet-core、SDK、Relay への責任逆流なし               |
| B: security / trust boundary  | trusted component と trusted input の分離、共通4条件、秘密情報、trusted UI、fail-closed、Symbol / NEM                      | 共通4条件と秘密情報境界は成立。SD-REVIEW-001〜003 の再発なし                     |
| C: flow / operations          | 署名前再確認、approval binding、lifecycle、stale、replay、duplicate、concurrent request、result unknown、incident recovery | 安全側の終了条件と旧状態の再利用禁止は成立                                       |
| D: traceability / downstream  | Concept / Requirements / Architecture / ADR、下流 Design / Specification、OPEN、責任主体および設計フェーズ境界             | 上位・下流との意味上の追跡と委譲範囲は成立。未決事項を確定事項として扱う矛盾なし |

## 3. Evidence Used

| 資料                                                                                                                                                                                                                                                                                                                 | 使用目的                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/design/security-design.md`](../../design/security-design.md)                                                                                                                                                                                                                                                  | Review target。Trust Boundary、Key Lifecycle、Lock / Authentication、Signing Authorization、Replay、Relay / Node、Sensitive Data、Backup、Fail-Closed、Incident、Software Integrity、Security Invariants、委譲および SEC-OPEN-* を確認 |
| [`docs/reviews/design/security-design-review-001.md`](./security-design-review-001.md)、[`security-design-review-002.md`](./security-design-review-002.md)、[`security-design-review-003.md`](./security-design-review-003.md)                                                                                       | 過去 finding `SD-REVIEW-001`〜`003` の対象と再発確認。過去の判定は今回の Gate 根拠として継承していない                                                                                                                                 |
| [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)                                                                                                                                                                                                                                                    | 目的、対象利用者、Browser / Mobile Signer、Relay 非署名、明示承認、秘密情報分離および外部保証範囲を確認                                                                                                                                |
| [`docs/requirements/requirements.md`](../../requirements/requirements.md)                                                                                                                                                                                                                                            | `CR-016`、`CR-NFR-004`、`CR-NFR-006`、`CR-NFR-008`〜`013`、`CR-AC-017`〜`019`、`CR-OPEN-001` / `002` および `OPEN-003` を確認                                                                                                          |
| [`docs/requirements/browser-extension.md`](../../requirements/browser-extension.md)                                                                                                                                                                                                                                  | Browser の privileged layer、Origin / permission、trusted UI、lifecycle、wallet-core 境界、秘密情報、Mainnet gate を確認                                                                                                               |
| [`docs/requirements/mobile-app.md`](../../requirements/mobile-app.md)                                                                                                                                                                                                                                                | Mobile trusted host、外部受け渡し、認証 / lock、OS 境界、画面露出、backup、wallet-core および `MR-OPEN-*` を確認                                                                                                                       |
| [`docs/requirements/relay.md`](../../requirements/relay.md)                                                                                                                                                                                                                                                          | Relay の opaque transport、structural validation、temporary state、state loss、credential と E2E secret の分離および `RR-OPEN-*` を確認                                                                                                |
| [`docs/requirements/sdk.md`](../../requirements/sdk.md)                                                                                                                                                                                                                                                              | SDK の dApp-side integration、correlation、transport abstraction、非 Signer 性、secret isolation、fallback / result 安全性および `SDK-OPEN-*` を確認                                                                                   |
| [`docs/design/architecture.md`](../../design/architecture.md)                                                                                                                                                                                                                                                        | 現行 Architecture の責務、Trust Boundary、wallet-core Binding 境界、§6.9 の共通署名ゲート、主要フロー、Mainnet gate、§17.1 の委譲 matrix を確認                                                                                        |
| [`docs/reviews/design/architecture-review-004.md`](./architecture-review-004.md)                                                                                                                                                                                                                                     | Architecture の現在内容を参照する作業証跡。Architecture Review Gate の判定を今回の Security Design Gate に継承していない                                                                                                               |
| [`docs/design/signing-flow.md`](../../design/signing-flow.md)                                                                                                                                                                                                                                                        | 署名 lifecycle、request / approval / authorization binding、署名前再検証、result unknown、再試行および flow invariant との整合を確認                                                                                                   |
| [`docs/design/interfaces.md`](../../design/interfaces.md)                                                                                                                                                                                                                                                            | request / response、Account、Chain / Network、trusted authority、Relay / Signer / wallet-core の概念境界を確認                                                                                                                         |
| [`docs/design/browser-extension.md`](../../design/browser-extension.md)                                                                                                                                                                                                                                              | privileged host、Provider / Content Script 分離、permission、trusted UI、lock、lifecycle、secret および Browser 固有の委譲を確認                                                                                                       |
| [`docs/design/mobile-app.md`](../../design/mobile-app.md)                                                                                                                                                                                                                                                            | Mobile trusted host、external invocation、OS protection、認証、approval、画面露出、lifecycle、wallet-core 境界を確認                                                                                                                   |
| [`docs/design/relay.md`](../../design/relay.md)                                                                                                                                                                                                                                                                      | Relay の opaque / untrusted transport、structural validation、credential、temporary retention、state loss および非権限性を確認                                                                                                         |
| [`docs/design/sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                                                                          | SDK の非特権 integration、Provider / Origin の非 authority、correlation、secret isolation、lifecycle および非 Signer 性を確認                                                                                                          |
| [`docs/specifications/profile-account-spec.md`](../../specifications/profile-account-spec.md)                                                                                                                                                                                                                        | Profile の固定 Network、Chain 別 Account、署名時 `every-signature`、UNLOCKED と signing authentication の分離、生体認証の将来 capability を確認                                                                                        |
| [`docs/specifications/chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)                                                                                                                                                                                                                | Symbol / NEM の Chain-specific identity、導出・inspection・Network 分離および詳細の委譲を確認                                                                                                                                          |
| [`docs/specifications/web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)                                                                                                                                                                                                        | transaction / message handoff、Relay opaque 性、message context、結果対応および SEC-OPEN-004 の残存範囲を確認                                                                                                                          |
| [`docs/specifications/signing-protocol.md`](../../specifications/signing-protocol.md)                                                                                                                                                                                                                                | message signing の context、inspection、署名前再確認、結果安全性および下流 specification との整合を確認                                                                                                                                |
| [`_snwc/docs/requirements/requirements.md`](../../../_snwc/docs/requirements/requirements.md)、[`wallet-core specification`](../../../_snwc/docs/specifications/specification.md)、[`Binding decision`](../../../_snwc/docs/decisions/binding-implementation.md)                                                     | Wallet Store、Profile password、raw signing、Core の non-continuous unlock、Binding の data ownership、temporary secret および Application-level approval / authentication 非担当を確認                                                |
| [`docs/release/mainnet-release-evidence.md`](../../release/mainnet-release-evidence.md)、[`docs/release/release-process.md`](../../release/release-process.md)、[`docs/release/threat-model.md`](../../release/threat-model.md)、[`docs/adr/0001-mainnet-evidence-lite.md`](../../adr/0001-mainnet-evidence-lite.md) | Mainnet capability、evidence / policy、改ざん検出、release key、fail-closed、incident と運用詳細の境界を確認                                                                                                                           |

## 4. Review Result

**Review Gate: `READY`**

現在の Security Design を本文、上位資料、Architecture の確定内容および関連下流資料から独立に評価した結果、Critical / Major / Minor の新規 finding は確認されなかった。Trust Boundary、共通署名ゲート、Secret / Key lifecycle、fail-closed、Security Invariants および Design フェーズ境界に、設計を差し戻す実質的な問題はない。

`SD-REVIEW-001`、`SD-REVIEW-002`、`SD-REVIEW-003` は、現在の本文に基づきそれぞれ `RESOLVED` と判定する。現在の `SEC-OPEN-*` は `SEC-OPEN-002` と `SEC-OPEN-004` であり、いずれも共通 MUST を弱めず、Security Design で無理に確定すべき内容を残しているものではない。

## 5. Summary

- Browser Extension の privileged context と Mobile App の trusted host が Signer であり、Provider、Content Script、SDK、dApp / Web page、Deep Link、Relay、Node / external API および OS は同じ信頼主体として扱われていない。trusted component と trusted input の混同はない。
- Architecture §6.9 の共通4条件（Authentication、Signing-capable unlock、Account authorization、Explicit user approval）は、Security Design §16 で明示され、§3 / §5 / §7〜§9 / §15 / §17 で責任、binding、再確認および失敗条件へ接続されている。Browser / Mobile の owner は一致し、connection / permission、UNLOCKED、wallet-core password / Store validation、SDK / Relay / dApp の動作は代替にならない。
- private key、mnemonic、password / PIN 由来の秘密情報、復号済み Store、temporary signing secret、session / authentication secret および transport credential について、host / wallet-core 境界、短期保持、外部境界・ログ・telemetry への非開示、lock / revoke / expiry / incident 時の無効化が基本方針として成立している。詳細な byte lifecycle、credential format および OS 保護は正しく下位へ委譲されている。
- §7 は startup、restart、reload、process recreation、extension reload、browser restart 後の `LOCKED` を全 Signer の MUST とし、署名ごとの再認証と lock 時の一時秘密破棄を要求する。Profile §20 の `every-signature` と整合し、SD-REVIEW-001 の再発はない。
- §8〜§10 は Signer 自身が生成する trusted UI、全 security-relevant field の確認可能性、payload と表示内容の一致、payload / caller / Account / Chain / Network 変更時の approval invalidation、request 単位の replay / concurrent isolation を定める。blind signing、unknown / unsupported / unrenderable request は拒否される。
- Relay は opaque transport / short-lived state / structural validation に留まり、SDK は dApp-side integration / correlation / transport abstraction に留まる。両者とも Signer、authentication、Account authorization、approval、semantic inspection または raw signing を代替しない。
- Node / external API は補助情報に留まり、Chain / Network mismatch、parse / validation failure、Store / Binding failure、Relay failure、result unknown 等は fail-closed へ接続される。Mainnet capability は release evidence / policy を満たす場合だけ有効化される。
- §17 の12 Security Invariants は本文と矛盾しない。Invariant 6 の一対一対応は共通4条件の全てを列挙する代替表現ではなく、4条件自体は §16 と個別の §7〜§9 に別途 MUST として定義されているため、gate の欠落にはならない。

## 6. Finding Status

| ID              | Severity           | Status   | 初出レビュー                 | 今回の判定                                                                                                                                                                                                                |
| --------------- | ------------------ | -------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SD-REVIEW-001` | Medium（過去表記） | Resolved | `security-design-review-002` | `RESOLVED`。§7.1 が全 Signer の起動・再起動・reload・process recreation・extension reload・browser restart 後 `LOCKED` を MUST とし、明示認証なしの signing-capable state / 認証状態の復帰を禁止                          |
| `SD-REVIEW-002` | Low（過去表記）    | Resolved | `security-design-review-002` | `RESOLVED`。§13.2 と §18 が Secret、認証、署名確認、transaction / message 承認および署名 context の画面露出を Mobile の Sensitive UI として扱い、screenshot / recording / sharing / preview / notification 等の評価を要求 |
| `SD-REVIEW-003` | Medium（過去表記） | Resolved | `security-design-review-002` | `RESOLVED`。§6.1 が Symbol / NEM の Account / Key Identity と Chain-specific derivation を分離し、Profile / Account、Chain Compatibility、Architecture および wallet-core の境界と整合                                    |

今回初出の正式 finding はない。新規 finding ID は発行しておらず、ID の重複はない。

## 7. Required Changes

なし。Critical / Major の New、Open または Reopened finding はない。

## 8. Optional Improvements

なし。好みや単なる表現差を Minor finding として追加していない。

## 9. Resolved Findings

| 過去 ID         | 状態       | 直接確認した根拠                                                                                                                                                                                                                                                                                                            |
| --------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SD-REVIEW-001` | `RESOLVED` | §7.1 の全 Signer 共通 `LOCKED` MUST、明示認証なしの `UNLOCKED` / 署名可能状態 / 過去認証状態の復帰禁止、§7.2 の platform 認証、§7.3 の再起動 bypass 防止および §15.2 の incident 時 state 破棄を確認した。Profile / Account 仕様 §20 の `every-signature` と矛盾しない。                                                    |
| `SD-REVIEW-002` | `RESOLVED` | §13.2 が秘密情報の入力・表示だけでなく、PIN / 生体認証等の認証、署名確認、transaction / message 承認、caller / Account / Chain / Network / Amount context の画面を Sensitive UI とし、Mobile 下位設計へ screenshot、recording、sharing、recent apps、notification 等の評価を引き継いでいる。OS の完全防止を主張していない。 |
| `SD-REVIEW-003` | `RESOLVED` | §6.1 が Account を Chain、Profile 固定 Network、chain-specific Key Identity に明示的に関連付け、Symbol / NEM の導出と Account model を暗黙共用しない。具体的な導出・暗号は Wallet Core / Chain integration に委譲し、同じ raw key を明示的に別 chain identity として扱い得る wallet-core の契約とも矛盾しない。             |

## 10. Deferred Findings

正式な Deferred finding はない。以下は Security Design が高位の安全条件を固定したうえで、下位資料または運用へ委譲している事項であり、今回の finding ではない。

- `SEC-OPEN-002` に関係する Mobile の biometric capability、fallback、credential 保管および lifecycle。
- `SEC-OPEN-004` に関係する既存 message signing handoff 契約と platform の表示受け入れ条件の最終整合。具体 API、wire schema、encoding、nonce format、serialized message format は対象外。
- `CR-OPEN-001` / `CR-OPEN-002` の wallet-core host integration、React Native 連携、OS protection、秘密 byte の一時 lifecycle、error mapping および migration。
- `MR-OPEN-*`、`RR-OPEN-*`、`SDK-OPEN-*`、aggregate / multisig / cosignature、Profile 全体 backup / restore、platform lifecycle および release operation の具体詳細。
- Symbol / NEM の対応 type / version、semantic inspection、canonicalization、署名 bytes、Mainnet evidence の収集・検証・運用詳細。

これらの未決・委譲は、Authentication、Signing-capable unlock、Account authorization、Explicit user approval、Secret isolation、Relay の opaque 性、SDK の非特権性、wallet-core の Application-level auth / approval 非担当および fail-closed を弱める根拠にはならない。

## 11. Scope and Traceability

| 領域                                | 上位・関連根拠                                                                           | Security Design の確認箇所          | 判定                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 目的・対象・保証範囲                | Concept、Common Requirements、Architecture                                               | §1〜§3、§4                          | Pass。Browser / Mobile / Relay / SDK / wallet-core の対象と、trusted host 完全侵害時の保証限界が明確                                |
| 共通署名ゲート                      | Architecture §6.9、`CR-016`、`CR-AC-017`〜`019`、Browser / Mobile requirements           | §3、§5、§7〜§9、§15〜§17            | Pass。4条件、両 Signer の owner、署名前再確認、結果の安全側、代替禁止を追跡可能                                                     |
| Request / approval / result binding | `CR-NFR-008`〜`013`、Signing Flow、Interfaces、handoff / signing protocol                | §8〜§10、§15                        | Pass。caller、permission、Account、Chain / Network、payload、request freshness、approval、result unknown を相互に結合               |
| Secret / Key lifecycle              | `CR-008`、Profile / Account、wallet-core requirements / specification / binding decision | §4、§6、§12〜§13、§15〜§18          | Pass。秘密情報の保持主体・外部非開示・短期保持・高位の破棄条件を固定し、暗号・byte・binding 詳細を逆流させていない                  |
| Browser / Provider / Content Script | Browser requirements / design、Architecture                                              | §2〜§5、§7〜§9、§13〜§18            | Pass。privileged host と Web / Provider / Content Script の境界、Origin、trusted UI、reload / restart lock が整合                   |
| Mobile / OS protection              | Mobile requirements / design、Profile §20 / §22                                          | §3、§5、§7、§13、§15、§18〜§19      | Pass。OS は限定的信頼、Mobile は未実装、biometric の残存範囲は `SEC-OPEN-002` として管理                                            |
| Relay                               | Relay requirements / design、handoff specification                                       | §3、§4、§5、§10〜§12、§15、§18〜§19 | Pass。opaque delivery / structural validation / temporary state と、Signer の semantic validation / approval / signing の境界が一致 |
| SDK / dApp                          | SDK requirements / design、handoff specification                                         | §2〜§5、§9〜§12、§14〜§18           | Pass。SDK / dApp は correlation / transport を担うが、auth、unlock、Account authorization、approval、secret handling を代替しない   |
| Symbol / NEM、Mainnet / Testnet     | Chain Compatibility、Product、Architecture、ADR 0001                                     | §4、§6、§8、§11、§16〜§19           | Pass。Chain / Network / Key Identity を分離し、Mainnet capability を evidence / policy に従属させる                                 |
| Incident / release                  | release process、mainnet evidence、release threat model                                  | §4、§15〜§16、§18〜§19              | Pass。異常時の signing-capable state / session / approval 失効と、release operation 詳細の委譲が成立                                |

Security Design 自身に requirement ID ごとの詳細 matrix はないが、上位 Architecture §17.1、要件の受入条件、下流 Design / Specification の各責務と意味上の追跡は成立している。Security Design の目的は高位の共通安全条件であり、下位の API / schema / state machine を重複定義しない方針とも整合する。

## 12. Domain Checks

| #   | 観点                                 | 判定 | 根拠                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Trust Boundary                       | 適合 | §3〜§5 が Browser privileged host、Mobile trusted host、wallet-core、OS Secure Storage、SDK、dApp / Web、Provider / Content Script、Relay、Node / API を区別し、trusted component に届く input も untrusted とする。                                                                     |
| 2   | 共通署名ゲート                       | 適合 | §16 が Authentication、Signing-capable unlock、Account authorization、Explicit user approval の4条件を列挙し、§3 / §5 / §7〜§9 / §15 / §17 が両 Signer、再確認、代替禁止、fail-closed を補強する。                                                                                       |
| 3   | Key / Secret Lifecycle               | 適合 | §4、§6、§12〜§13、§15、§18 が private key、mnemonic、password-derived secret、decrypted Store、temporary signing secret、session / authentication secret、Relay / transport credential の外部非開示、保持・無効化・ログ禁止・backup / clipboard 境界を高位で定め、詳細を下位へ委譲する。 |
| 4   | Lock / Authentication                | 適合 | §7.1 の全 Signer 共通 startup / restart / reload / process recreation 後 `LOCKED` MUST、署名ごとの再認証、lock 時破棄、§7.3 の restart bypass 防止があり、Profile §20 と一致する。                                                                                                       |
| 5   | Account Authorization                | 適合 | §6.1、§9、§10、§15〜§17 が Profile 固定 Network、Chain-specific Account / Key Identity、caller / permission / Account binding、connection と signing authorization の分離、target 変更時の無効化を定める。                                                                               |
| 6   | Explicit Approval / Trusted UI       | 適合 | §8、§14 が Signer 自身の解析・表示・確認、外部表示文言の非信頼、payload と確認内容の一致、変更時 invalidation、unknown / unsupported / unrenderable 拒否、blind signing 防止を定める。                                                                                                   |
| 7   | Replay / Concurrent Request          | 適合 | §10 が requestId、createdAt、expiresAt、duplicate / replay 拒否、request / auth / approval / signature の一対一対応、同時要求分離、stale / changed context の旧状態不使用を定める。                                                                                                      |
| 8   | Relay Security                       | 適合 | §3、§11、§18 が Relay を opaque transport / short-lived structural state に限定し、semantic interpretation、signing、approval、authentication、Account authorization を持たせない。Relay 侵害単独で資産移動に直結しない。                                                                |
| 9   | SDK Security Boundary                | 適合 | §3、§7、§9、§11、§18 が SDK を dApp-side integration / correlation / transport に限定し、secret、authentication、signing-capable unlock、Account authorization、approval、最終表示・署名を扱わせない。                                                                                   |
| 10  | Network / Node Trust                 | 適合 | §3、§11、§15、§18 が Node / external API を補助情報に限定し、Chain / Network mismatch、外部応答の不一致、補助情報取得失敗で検証を省略しない。                                                                                                                                            |
| 11  | Sensitive Data / Logging / Retention | 適合 | §12 が Secret / Sensitive / Public を区別し、log、telemetry、analytics、crash report、warning、exception、URL、通知、clipboard、cache、temp、backup からの漏えい・復元を禁止または最小化する。                                                                                           |
| 12  | Backup / Export / Screenshot         | 適合 | §6.3、§13 が明示操作、再認証、trusted UI、平文 export 非デフォルト、Cloud auto-save 禁止、Secret clipboard 原則禁止、QR 高リスク、Mobile の screenshot / recording / sharing / preview / notification 評価を定める。                                                                     |
| 13  | Brute-force Protection               | 適合 | §7.3 が高速・無制限 retry、restart による bypass、認証失敗時の自動鍵削除を防ぎ、Core / host / OS / 外部 caller の責任を混同しない。具体回数・timeout は下位へ委譲されている。                                                                                                            |
| 14  | Anti-Phishing                        | 適合 | §8、§14 が MosaicLynx 自身の UI、検証済み caller / origin、外部 HTML / Markdown / app name / icon / description の非信頼、Web page への password 非提供を定める。                                                                                                                        |
| 15  | Fail-Closed                          | 適合 | §15 が parse、unsupported type / version、validation、authentication、lock、Account / permission、caller / network mismatch、expiry、replay / duplicate、wallet-core / Store / Binding、Relay、result unknown 等を no-signing / no-success に接続する。                                  |
| 16  | Software Integrity / Mainnet Gate    | 適合 | §16 が改ざん検出、正規更新、依存関係、migration、debug / production 分離を定め、Mainnet capability は release evidence / policy を満たす場合だけ有効化し、詳細は release / operation へ委譲する。                                                                                        |
| 17  | Incident / Recovery                  | 適合 | §15.2 が signing-capable state、UNLOCKED、temporary auth、session、in-flight request、old approval を安全側に失効させ、秘密鍵自動削除を避けつつ、鍵漏えい疑いと Relay / external compromise を区別する。                                                                                 |
| 18  | Security Invariants                  | 適合 | §17 の12 MUST は Secret isolation、plaintext persistence 禁止、untrusted input、inspection、payload binding、一対一対応、per-signature auth、external compromise、non-logging、fail-closed、own UI、incident invalidation と本文に整合する。                                             |
| 19  | Symbol / NEM Key Identity            | 適合 | §6.1、§18〜§19 が Chain、Network、Account、Key Identity、derivation / cryptography の境界を明示し、Symbol / NEM の暗黙共用や独自暗号方式を導入しない。                                                                                                                                   |

## 13. Validation Results

レビュー成果物の明示的なパスだけを formatter / Markdown format の対象とする。Source 変更はないため、lint、typecheck、test、build は実行対象外とする。

- `pnpm exec prettier --write docs/reviews/design/security-design-review-004.md` — PASS
- `pnpm exec prettier --check docs/reviews/design/security-design-review-004.md` — PASS
- `git diff --cached --check` — PASS
- Markdown のローカルリンク検証 — PASS。対象設計、過去レビュー、指定された上位・下流資料、wallet-core、ADR、release 関連資料の相対リンク先が存在することを確認した。
- Finding ID 重複確認 — PASS。新規正式 finding はなく、過去 `SD-REVIEW-001`〜`003` は status / resolved の再確認としてのみ記載している。
- Review Gate と finding status の整合確認 — PASS。新規 Critical / Major / Minor はなく、Required Changes は `なし`、Gate は `READY` である。
- 変更範囲確認 — PASS。staged 差分はレビュー成果物 1 ファイルだけで、unstaged の変更ファイルはない。
- `Not validated`: lint、typecheck、test、build。レビュー成果物のみの変更であり、Source の品質検証は対象外とした。

## 14. Review Gates

| Gate                                                   | 判定 | 根拠                                                                                                                                                              |
| ------------------------------------------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Purpose / scope                                     | Pass | §1〜§2 が共通 Security Design の対象、Mobile 未実装、委譲範囲および保証限界を明示する。                                                                           |
| 2. Context / responsibility / trust boundary / secrets | Pass | §3〜§6、§12、§18 が Signer、wallet-core、OS、SDK、dApp、Provider / Content Script、Relay、Node / API の責務と Secret 境界を分離する。                             |
| 3. Dependency direction                                | Pass | §3、§5、§18 と Architecture §7〜§8 が、host が gate / approval を持ち、wallet-core が secret / raw signing、SDK / Relay が非特権 transport を持つ方向を維持する。 |
| 4. Major flows and failure                             | Pass | §7〜§11、§15 が request 受信、検証、inspection、approval、再認証、署名、結果対応、stale / replay / failure / incident の高位条件を定める。                        |
| 5. Data ownership / retention / destruction            | Pass | §6、§12、§13、§15、§18 が秘密情報、Sensitive data、session、Relay temporary state の所有、最小保持、lock / revoke / expiry / incident 時の無効化を定める。        |
| 6. Security / interoperability                         | Pass | 共通4条件、trusted UI、fail-closed、opaque Relay、non-Signer SDK、wallet-core 境界、Symbol / NEM および Mainnet / Testnet 分離が整合する。                        |
| 7. Upstream consistency                                | Pass | Concept、Common / Browser / Mobile / Relay / SDK Requirements、Profile、Chain Compatibility、Architecture §6.9 と Security Design の MUST が矛盾しない。          |
| 8. Downstream implementability                         | Pass | §18〜§19 が wallet-core、platform、Relay、SDK、Chain integration、Release / Operation へ高位責任と安全下限を委譲し、下位詳細を逆流させていない。                  |

## 15. Remaining Risks and Open Decisions

- `SEC-OPEN-002` は、Profile §22 の将来 biometric capability と Security Design §7.2 の Mobile 利用可能方針を、Mobile capability、fallback、credential 保管および lifecycle の下位決定で整合させるために残すことが妥当である。認証省略、自動署名または OS への無条件信頼を許す OPEN ではない。
- `SEC-OPEN-004` は、既存 handoff / signing protocol の message signing 契約を前提に、platform の表示受け入れ条件と最終的な契約整合だけを残すことが妥当である。具体 API / wire / encoding を Security Design で再定義する必要はない。
- Mobile 実装は現在の workspace に存在しない。Mobile の OS protection、画面露出、lifecycle、Binding integration、backup / migration および release capability は、実装・下位設計時に本書の MUST として再確認する必要がある。
- Relay credential、E2E secret、session identifier、公開 Account 情報は下位資料で分類・保持境界が具体化されるが、Security Design の `§12`、`§15`、`§18` がそれらを秘密情報・Sensitive 情報・一時状態として安全側に扱う共通条件を既に固定している。
- Mainnet release evidence の期限、trusted key、artifact、policy、runtime capability および incident operation は release 資料で確定・検証する。Security Design は evidence 不足時の fail-closed を維持する。

## 16. Automatic Changes

なし。`docs/reviews/design/security-design-review-004.md` のみを新規作成し、Security Design、Architecture、要件、仕様、ADR、個別 Design、wallet-core、Source、テストおよび既存レビューは変更していない。

## 17. Final Decision

**`READY`**

今回の Gate は過去の READY 判定を継承せず、現在の Security Design 全体を独立評価した。SD-REVIEW-001〜003 は `RESOLVED`、新規 finding はなく、Trust Boundary、共通署名ゲート、Secret / Key lifecycle、Security Invariants、Relay / SDK / wallet-core の責任分界、Symbol / NEM Key Identity および Mainnet release boundary に Critical / Major の問題はない。Security Design は、下位設計・仕様・実装へ進められる状態である。
