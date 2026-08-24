# MosaicLynx モバイルアプリ要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/mobile-app.md`
- 確認日: 2026-08-24
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: Mobile 固有要求 MR-001〜MR-013、受け入れ条件 MR-AC-001〜MR-AC-009、Traceability、共通要件および下流資料との責任境界
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Product Specification、Architecture、Relay / Profile 関連仕様、Mobile 資料、外部 wallet-core 資料を照合した。要求の上流根拠と、下流資料を根拠として逆参照していないかを分けて確認した。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

モバイルアプリの責任境界、外部要求の検証、OS ライフサイクル時の fail-closed、秘密情報の外部露出禁止、Profile backup の非必須扱い、Mainnet gate など、要求として妥当な中心部分は整理されている。また、`MR-002`〜`MR-006`、`MR-009`、`MR-012` の多くは共通要件の境界を Mobile へ適用している。

ただし、現行版は仕様化へ進める前に修正が必要である。特に `MR-007` が外部 wallet-core の仕様・設計資料を製品要求の「根拠」として直接掲げており、共通要件 `CR-013` が定める「外部コンポーネント契約として参考にする」という扱いと逆転している。さらに、参照資料の上下流区分と MR-* から上流根拠への追跡表がなく、どの要求が上流の製品判断から導かれたものか、下流の設計判断を要求へ逆輸入していないかを文書だけで監査できない。

## 下流資料の逆参照チェック

### 直接確認できた逆参照

`MR-007`（`docs/requirements/mobile-app.md:66-72`）の根拠欄は、次の `_snwc` 資料を製品要求の根拠として列挙している。

- `_snwc/README.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`

これらは MosaicLynx の上流要求ではない。`_snwc` 自身の Wallet Store、秘密情報処理、wallet-core の API / binding の契約・仕様・実装判断を記した外部コンポーネント資料である。特に `binding-implementation.md` は Native C ABI、WASM、binding、責務分担の設計判断であり、製品要求の根拠にする文書ではない。MosaicLynx 側の上流は `docs/concept/concept-sheet.md` と `docs/requirements/requirements.md` の `CR-013` 等であり、`_snwc` はその要求を実現する際に参照する外部コンポーネント契約として扱うべきである。

### 参照役割の区分不足

`docs/requirements/mobile-app.md:196-209` の参考資料一覧は、上流の Concept / 共通要件、下流の Product Specification / Architecture / Handoff Specification、運用資料、外部 wallet-core 資料を同じ「参考資料」として並べている。資料の存在自体は問題ではないが、各 MR-* の根拠、整合確認、下流引継ぎ、外部契約という役割が区別されていない。そのため、下流資料を要求の根拠として使わないという監査可能な証跡が不足している。

## 指摘事項

| 指摘 ID   | 重大度 | 状態 | 根拠                                                                                                                                                                                                                                                                                                                                                                                                                       | 影響                                                                                                                                                                                   | 必要な修正                                                                                                                                                                                                                 |
| --------- | ------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MREQ1-001 | ERROR  | Open | `MR-007` の根拠欄が `_snwc` の仕様・binding 設計資料を製品要求の根拠として扱っている。共通要件 `CR-013`（`docs/requirements/requirements.md:229-237`）は、同資料を外部コンポーネント契約の参考として扱い、Application の責任を別に定めている。                                                                                                                                                                             | wallet-core の API、binding、crypto / Store の設計判断が Mobile の要求へ逆輸入され、外部コンポーネントの変更と製品要求の変更を誤って同一視する。要求の正当性と変更責任を追跡できない。 | `MR-007` の上流根拠を Concept Sheet と共通要件へ付け替える。`_snwc` 3資料は「参考（外部コンポーネント契約）」または下流仕様参照へ格下げし、`binding-implementation.md` の設計内容を Mobile 要求の根拠にしない。            |
| MREQ1-002 | ERROR  | Open | MR-* ごとの上流根拠を示す Traceability がなく、参考資料一覧（`mobile-app.md:196-209`）に上流・下流・運用・外部契約が混在している。`docs/specifications/product-spec.md`、`docs/architecture/architecture.md`、`docs/specifications/web-transaction-handoff-spec.md` はプロジェクト文書上、要求を具体化する下流資料である。                                                                                                 | 各要求が上流の価値・共通要求から導かれたのか、下流仕様の実装判断を逆参照していないのかをレビュー・変更時に検証できない。                                                               | MR-* ごとに少なくとも「上流根拠」「整合確認資料」「下流引継ぎ」「外部契約」の列を持つ追跡表を追加する。下流資料は根拠列に置かず、必要な場合だけ整合確認または引継ぎとして明示する。役割のない資料は参考資料一覧から外す。  |
| MREQ1-003 | ERROR  | Open | `MR-007`、`MR-010`、`MR-012`、`MR-013` の MUST、ならびに `MR-005` の再検証条件と `MR-011` の SHOULD が、受け入れ条件へ完全には対応していない。`MR-AC-005` は安全な署名拒否、`MR-AC-009` は Mainnet gate を確認するが、wallet-core 委譲・端末喪失時の影響説明・Relay の非解釈責任・更新時の既存 Profile 等の保持・画面録画等のポリシー・再表示時の sender/content/Chain/Network/Account/expiry 再検証までは直接確認しない。 | 実装が要求を満たしたかを受け入れ条件だけで判定できず、広い受け入れ条件から都合よく適合を推論する必要がある。セキュリティ境界と更新時データ保持の欠落を見逃す可能性がある。             | 既存の各 MR-* を対応する MR-AC-* へ明示的に追跡し、上記の各 MUST / SHOULD に対する外部確認可能な判定条件を追加する。仕様上の具体 API、保存形式、暗号方式をこの修正で決めず、要求された責任・結果・禁止事項の確認に留める。 |
| MREQ1-004 | WARN   | Open | Section 4（`mobile-app.md:110-128`）は iOS / Android の確認項目を「要求」として配置しているが、MUST / SHOULD、責任主体、受け入れ条件、未決定事項への追跡がない。                                                                                                                                                                                                                                                           | プラットフォーム差異が単なる調査チェックリストなのか、Mobile が満たす要求なのか不明で、将来仕様化するときに要求の追加・省略を判断できない。                                            | 各項目を「要求」「確認すべき前提」「未決定事項」のいずれかに分類し、要求として残す項目だけを MR-* と受け入れ条件へ追跡する。OS API や保護機構の具体設計は下流へ委ねる。                                                    |

## 確認できた整合事項

- `MR-001` は Mobile を Android / iOS の個別 milestone として扱い、共通要件の milestone 条件へ引き継いでいる。既存ワークスペースに `apps/mobile` が存在しないこととも矛盾しない。
- `MR-002`〜`MR-006` は、未検証の外部入力、確認領域での明示承認、プロセス再開時の自動署名禁止、認証不能時の署名拒否を定めており、共通要件の fail-closed・request binding・Signer の責任境界と整合する。
- `MR-003`、`MR-012` は、秘密情報を URL / 外部アプリ / Relay 等へ出さず、Relay を暗号文中継に限定する方向で、共通要件 `CR-008`、`CR-011`、`CR-013` および Relay 関連資料の責任境界と整合する。ただし、受け入れ条件への完全な追跡は `MREQ1-003` の対象である。
- `MR-009` は Profile backup / restore を Mobile の常時必須機能や共通完了条件にせず、提供時の説明責任を要求している。共通要件 `CR-014` の扱いと整合する。
- `MR-013` の Mainnet gate は共通要件および release evidence の方向性と整合する。App Store / Play の具体的な配布条件、evidence の生成・検証、更新・rollback の方式は下流の release 資料で決めるべきであり、本要求の根拠に逆参照してはならない。
- API、JSON / backup / Relay の具体形式、OS API、binding、KDF / AEAD、保存 key、画面遷移を本要件で新規に固定していない点は適切である。ただし、外部 wallet-core の設計資料を `MR-007` の根拠にする記述はこの原則に反する。

## 未決定事項・引継ぎ

1. `MR-OPEN-001`〜`MR-OPEN-008` の OS 対応、要求受付と sender 検証、OS 保護と wallet-core binding、認証、lifecycle、backup / migration / recovery、画面露出、store release 条件は、要求上の未決定事項として維持できる。ただし、各 OPEN 項目を上流要求から追跡し、下流資料へ引き継ぐ関係を明示する必要がある。
2. `_snwc` の Wallet Store、秘密情報処理、raw signing、binding は、`CR-013` と `MR-007` の責任境界を満たすための外部契約・下流仕様である。これらの資料から Mobile 固有の新しい要求を導出しない。
3. `docs/specifications/product-spec.md`、`docs/architecture/architecture.md`、`docs/specifications/web-transaction-handoff-spec.md`、`docs/mobile/*` は、Mobile 要件を根拠づける上流資料ではなく、要件を具体化・運用化した下流資料として扱う。下流にしか存在しない判断が必要なら、先に上流要件または ADR の変更要否を判定する。
4. 受け入れ条件を補う際も、MR-* に既に書かれた責任・禁止・結果を判定可能にする範囲に限定し、新しい API、プロトコル、OS 保護方式、backup 形式を要件レビューから発明しない。

## Validation

- 文書レビュー成果物作成後に、対象要件と本レビュー成果物の Prettier check、`git diff --check` を実行する。
- `pnpm format:check` は可能な範囲で実行し、既存の対象外ファイルによる失敗を成功とは扱わない。

## Not validated

- 文書レビューのため、Mobile 実装、iOS / Android の build、Store 配布、OS Keychain / Keystore、wallet-core binding、Relay integration、Mainnet release evidence の生成・検証は実行していない。
- OS や Store の最新仕様を Mobile 要件の根拠として採用する調査は行っていない。これらは本レビューで指摘した上流・下流の文書責任を解消した後、必要な下流仕様または運用資料で確認する。

## 参照資料

- `docs/requirements/mobile-app.md`
- `docs/requirements/requirements.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/architecture/architecture.md`
- `docs/mobile/mobile-privacy.md`
- `docs/mobile/mobile-support.md`
- `docs/mobile/mobile-store-release.md`
- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
