# MosaicLynx スマホアプリ要件

## 1. 文書の目的と適用範囲

本書は、[MosaicLynx 共通要件](./requirements.md) に加えて、iOS / Android のスマホアプリという実行環境でのみ生じる要求を整理する。

署名対象の確認、明示的な承認・拒否、blind signing の禁止、秘密情報保護、Symbol / NEM と Mainnet / Testnet の区別などは共通要件であり、本書では重複して再定義しない。

スマホアプリは MosaicLynx v1 の Android milestone と iOS milestone に対応する。

## 2. スマホアプリ固有の責任境界

### 2.1 アプリと外部要求元

- スマホアプリは、スマホブラウザまたは外部アプリから届く署名要求を外部入力として扱い、検証前に信頼してはならない。
- 署名要求の受信経路は、OS が提供するアプリ間受け渡しと、MosaicLynx の Relay 等の外部サービスを含む。具体的な経路は本書で固定しない。
- 受信した要求の送信元、対象 Chain / Network、Account、署名対象、要求の有効性を検証してから、アプリ管理下の確認領域へ渡さなければならない。
- URL、Intent、通知、共有機能、Relay metadata 等の外部受け渡し情報を、署名承認の唯一の根拠としてはならない。

### 2.2 OS と秘密情報

- iOS / Android の OS 保護機能は、スマホアプリ側の保存・アンロック・端末保護を支える候補である。
- `symbol-nem-wallet-core` は OS 固有の Keychain、Keystore、Secure Enclave、StrongBox 等を自動的に提供する責任主体ではない。MosaicLynx は wallet-core の責任と OS 固有保護の責任を混在させてはならない。
- OS の保護能力が利用できない場合、利用者へ実際より高い保護を保証する表示をしてはならない。Mainnet を含む capability の扱いは共通の Mainnet gate と platform 固有条件に従う。

## 3. スマホアプリ共通要求

### MR-001 iOS / Android の提供方針

**MUST** Android と iOS を別々の milestone として提供し、各 platform の受け入れ条件を個別に判定しなければならない。片方の platform の完了を、もう片方の完了または MosaicLynx v1 全体完了とみなしてはならない。

実施順序は共通コンセプトに従い、ブラウザ拡張機能 → Android → iOS → Relay とする。個別完了条件は `OPEN-003` で決定する。

### MR-002 外部アプリ・スマホブラウザからの要求受付

**MUST** スマホアプリが外部アプリまたはスマホブラウザから署名要求を受け付ける場合、要求の送信元、対象、許可状態、署名要求の完全性を検証してから確認画面へ渡さなければならない。

Deep Link、Universal Link、App Link、共有機能、Relay などの具体的な採用方式は `MR-OPEN-002` と後続仕様で決定する。

### MR-003 外部受け渡し情報の秘密分離

**MUST** Deep Link、Universal Link、App Link、Intent、通知、共有データ、Relay などの外部受け渡しに、秘密鍵、Mnemonic、Profile password、復号済み Wallet Store、署名用秘密情報を含めてはならない。

要求の受け渡しに含める情報の形式、保護方式、認証方式は後続仕様で決定する。

### MR-004 アプリ管理下の確認と承認

**MUST** スマホアプリは、アプリが管理する確認領域で、利用者が署名対象、Chain、Network、Account、確認可能な影響を確認し、要求ごとに承認または拒否できるようにしなければならない。

外部ブラウザや外部アプリが表示する確認文言だけを、署名承認の証拠として扱ってはならない。画面構成や文言は後続仕様で決定する。

### MR-005 OS ライフサイクルと承認状態

**MUST** アプリが background へ移行、停止、再起動、OS によって終了された場合、未確認または承認済みの要求から署名を無条件に自動再開してはならない。

要求を再表示または再開する場合は、送信元、要求内容、Chain、Network、Account、期限、利用者の承認状態を再確認し、不一致や確認不能があれば署名せず終了しなければならない。

具体的な pending request の保持、再開、期限、状態遷移は後続仕様で決定する。

### MR-006 アプリロックと再認証

**MUST** アプリがロック中、または署名に必要な認証状態を満たさない場合、署名してはならない。アプリロックの解除や署名前の再認証を利用者の明示的な操作なしに完了させてはならない。

PIN、OS パスコード、生体認証をどの組み合わせで利用するか、失敗時の扱い、再認証頻度は `MR-OPEN-004` と後続仕様で決定する。

### MR-007 Wallet Store と OS 保護の責任分担

**MUST** スマホアプリは、`symbol-nem-wallet-core` を鍵管理、Wallet Store、Software Key、秘密情報を使用する暗号処理および raw signing の正本として利用し、wallet-core 内部の KDF、暗号、メモリゼロ化、Store format を再実装してはならない。Profile の管理、Account の表示・選択・関連付け、Chain / Network 設定、UI、platform integration および wallet-core を利用する orchestration はスマホアプリ側の責任とする。

OS の Keychain / Keystore 等を利用する場合も、OS 保護の capability、端末変更、バックアップ、失敗状態をアプリ側の責任として明示しなければならない。具体的な Binding、保存場所、鍵のラップ方式は設計で決定する。

### MR-008 OS 保護能力の表示

**MUST** iOS / Android の OS 保護機能、端末ロック、生体認証、hardware-backed capability 等を利用者へ表示する場合、実行時に確認できた保護範囲を越えて保証してはならない。

Secure Enclave、StrongBox、Keystore、Keychain 等を直接署名に使えるか、またその capability を Mainnet の条件にするかは `MR-OPEN-003` と `OPEN-005` で整理する。

### MR-009 Backup と端末移行

**MUST** Profile、Account、Wallet Store の backup / restore または端末移行を提供する場合、その機能が提供する復元対象、復元後の署名能力、OS に依存する保護状態を利用者へ明示しなければならない。本要求は backup / restore または端末移行の提供自体を要求せず、MosaicLynx v1 の共通 MUST または共通完了条件にも含めない。

端末固有の保護鍵だけでは復旧できない場合に、復旧できると表示してはならない。Profile 全体の backup / restore における Application と wallet-core の責任分担、Mnemonic、暗号化 backup、private key、Wallet Store の具体的な形式と移行手順は `MR-OPEN-006` および後続仕様で決定する。wallet-core v1 が Profile 全体の backup / migration / recovery を提供することは前提にしない。

### MR-010 端末紛失・アプリ削除

**MUST** 端末紛失、端末初期化、アプリ削除、OS の保護状態喪失により署名能力または復元能力が変化する場合、その結果を利用者へ誤認なく示さなければならない。

管理者、運用者、MosaicLynx が秘密情報を再発行または遠隔復旧することを、v1 の共通要求として追加してはならない。

### MR-011 スクリーンショット・画面録画等

**SHOULD** 秘密情報、署名対象、承認画面のスクリーンショット、画面録画、最近使ったアプリ一覧、通知表示等による露出リスクを評価し、必要な platform policy を定める。

具体的な禁止・許可、対象画面、OS 差異は `MR-OPEN-007` で決定する。OS が提供する機能で防止できない範囲を、完全に防止できると表示してはならない。

### MR-012 Relay の責任境界

**MUST** Relay を利用する場合も、スマホアプリが要求を復号・検証・表示・承認・署名する責任を負う。Relay は署名対象を解釈せず、署名せず、秘密情報を扱わず、announce しない。

Relay の主経路・代替経路、redirect、Deep Link、QR、Relay unavailable 時の挙動は本書で決定しない。

### MR-013 App Store / Google Play 配布と更新

**MUST** iOS / Android の配布 build は、対象 platform の公開審査、release evidence、Mainnet gate、サポート情報に従って capability を制御しなければならない。

アプリ更新で、アプリが管理する Profile metadata、Account の関連付け、dApp 権限または wallet-core の opaque Wallet Store を利用者の明示的な確認なしに破壊・置換してはならない。backup を提供する場合の更新互換性も、別途定めた責任境界に従う。OS サポート範囲、配布チャネル、更新互換性、rollback の詳細は `MR-OPEN-001`、`MR-OPEN-008`、後続の release 設計で決定する。

## 4. iOS / Android の差異の位置付け

本節は新しい `MR-*` を定義しない。iOS / Android の差異は、既存の正式な要求、前提、`MR-OPEN-*` の未決定事項として扱う。

### 4.1 前提

- iOS と Android の OS 保護機能、ライフサイクル、バックアップ、配布条件は異なり得る。一方の OS の capability を、もう一方の OS で利用可能と推測してはならない。
- platform-specific な保護が利用できない場合も、既存の blind signing 禁止、明示的承認、秘密情報分離、安全側終了を維持する。これらの正式な要求は `MR-002`〜`MR-006`、`MR-008`、`MR-012` に定める。

### 4.2 既存の正式な要求への適用

以下は独立した要求ではなく、既存 `MR-*` とその受け入れ条件で判定する事項である。

| 差異の対象                                                     | 適用する既存要求             | 受け入れ条件                                       |
| -------------------------------------------------------------- | ---------------------------- | -------------------------------------------------- |
| OS ライフサイクル、アプリロック、再認証                        | `MR-005`、`MR-006`           | `MR-AC-004`、`MR-AC-005`                           |
| OS 保護 capability の利用・表示と wallet-core との責任分担     | `MR-007`、`MR-008`           | `MR-AC-007`、`MR-AC-010`                           |
| 外部要求の受信、秘密情報分離、アプリ管理下の承認、Relay 境界   | `MR-002`〜`MR-004`、`MR-012` | `MR-AC-002`、`MR-AC-003`、`MR-AC-006`、`MR-AC-013` |
| iOS / Android の個別 milestone、Store 配布、Mainnet gate、更新 | `MR-001`、`MR-013`           | `MR-AC-001`、`MR-AC-009`、`MR-AC-014`              |

## 5. スマホアプリの対象外

- 外部アプリや Web ページへ秘密鍵、Mnemonic、Profile password を返すこと。
- Relay に署名対象の意味解釈、署名、秘密情報処理、announce を委譲すること。
- OS の Keychain / Keystore / Secure Enclave / StrongBox の具体的内部実装を wallet-core の責任として扱うこと。
- 端末紛失時の管理者による秘密情報再発行、遠隔復旧、カストディ保証。
- iOS と Android のどちらか一方の capability を根拠なく他方へ適用すること。
- Deep Link、Universal Link、App Link、QR、fallback、Relay protocol、OS API の具体仕様を本書で確定すること。

## 6. スマホアプリの受け入れ条件

| ID        | 受け入れ可能な状態                                                                                                                                                                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MR-AC-001 | Android と iOS が個別 milestone として評価され、片方の完了を他方または MosaicLynx v1 全体の完了と混同しない。                                                                                                                                                                                       |
| MR-AC-002 | 外部アプリ・スマホブラウザ・Relay からの要求について、sender / 要求元、対象 Chain、Network、Account、許可状態、要求内容の完全性を確認できない場合、確認画面または署名へ進まない。                                                                                                                   |
| MR-AC-003 | アプリ管理下の確認領域で、利用者が署名対象、Chain、Network、Account、影響を確認して承認または拒否できる。                                                                                                                                                                                           |
| MR-AC-004 | background、process termination、再起動、要求再表示の後に、sender / 要求元、要求内容、Chain、Network、Account、expiry / 有効期限、承認状態を再確認し、古い承認を別要求へ適用して自動署名しない。                                                                                                    |
| MR-AC-005 | アプリロック解除および署名前再認証が利用者の明示的な操作なしに完了せず、古い認証状態または自動復帰だけで署名可能状態へ移行しない。認証不能・認証失敗、wallet-core 失敗または OS 保護状態喪失時は署名せず、安全側に終了する。                                                                        |
| MR-AC-006 | 秘密情報が外部アプリ、Web ページ、Relay、URL、通知、ログ、診断情報へ不要に露出しない。                                                                                                                                                                                                              |
| MR-AC-007 | iOS / Android 固有の保護 capability を、実際に確認できた範囲を越えて表示しない。                                                                                                                                                                                                                    |
| MR-AC-008 | backup / restore または端末移行を提供する場合、署名能力または復元可能性を利用者へ誤認なく示し、提供しない機能を完了条件としない。                                                                                                                                                                   |
| MR-AC-009 | 配布 build について、対象 platform の公開審査条件および owner-controlled な support 情報が確認でき、Mainnet capability を提供する場合は Mainnet gate と release evidence の条件を満たす。条件を満たさない場合は Mainnet capability を有効化・公開しない。                                           |
| MR-AC-010 | wallet-core が担当する鍵管理、Software Key、暗号処理、Wallet Store、raw signing 等を Mobile 側で再実装せず、Mobile 側が UI、Profile 管理、Account の表示・選択・関連付け、Chain / Network 設定、OS integration および orchestration を担当し、OS 固有保護と wallet-core の責任を区別できる。        |
| MR-AC-011 | 端末紛失、端末初期化、アプリ削除、OS の保護状態喪失時に、署名能力または復元能力の変化を利用者へ誤認なく示す。                                                                                                                                                                                       |
| MR-AC-012 | スクリーンショット、画面録画、最近使ったアプリ一覧、通知表示等による露出リスクが評価され、必要な platform policy が定められている。                                                                                                                                                                 |
| MR-AC-013 | Relay を利用する場合、Mobile が受信要求を復号・検証し、アプリ管理下の確認領域で表示し、利用者の承認と認証条件の充足後に署名する。Relay は署名対象を解釈せず、署名せず、秘密情報を扱わず、announce しない。                                                                                          |
| MR-AC-014 | アプリ更新によって、既存の Profile metadata、Account の関連付け、dApp 権限または opaque Wallet Store が利用者の明示的な確認なく破壊・置換されない。backup / restore を提供する場合は、更新後も定義された復元対象と互換性が維持される。backup / restore 自体は v1 の必須機能または完了条件としない。 |

## 7. スマホアプリ固有の未決事項

### MR-OPEN-001：対応 OS、バージョン、配布チャネル

- 論点: iOS / Android の対象 OS version、端末範囲、App Store / Google Play / Test 配布の範囲。
- 主な選択肢: 現行サポート範囲を限定する、OS version を複数設定する、Testnet と Mainnet で対象範囲を分ける。

### MR-OPEN-002：外部要求の受信方式と送信元検証

- 論点: スマホブラウザ・外部アプリから要求を受ける経路、送信元の検証、ユーザー操作の起点、Relay との関係。
- 主な選択肢: OS link、Relay、両者の組み合わせ、別の受け渡し方式。

### MR-OPEN-003：OS 保護機能と wallet-core Binding

- 論点: wallet-core の Native / WASM 等の Binding と、iOS / Android の OS 保護機能、Wallet Store、署名 controller の責任境界。
- 主な選択肢: wallet-core の既存 Binding を利用する、platform Binding を追加する、OS 保護を Store 保護に限定する。具体的な実装方式は設計で決定する。

### MR-OPEN-004：PIN、OS パスコード、生体認証の扱い

- 論点: アプリロック解除、署名前再認証、生体認証失敗時の fallback、端末認証の要求頻度。
- 主な選択肢: Profile password のみ、OS user-presence を追加、利用者が platform ごとに選択する。

### MR-OPEN-005：OS ライフサイクルと pending request

- 論点: background、process termination、再起動、通知からの復帰、期限切れ要求の扱い。
- 主な選択肢: 常に新規承認、検証済み要求の再表示、期限内のみ再開する方式。

### MR-OPEN-006：backup、端末移行、復元可能性

- 論点: Wallet Store、Profile、Account、Mnemonic、imported key の backup / restore、OS 保護鍵の端末移行、旧端末喪失時の扱い。
- 主な選択肢: Application 層で Profile metadata と wallet-core の opaque Wallet Store を別責任として扱う、端末移行の対象を限定する、backup / restore を後続 milestone へ送る。wallet-core が Profile 全体の backup / migration / recovery を提供することは前提にしない。

### MR-OPEN-007：スクリーンショット、録画、通知、最近使ったアプリ表示

- 論点: 署名確認画面や秘密情報入力画面の OS 由来の露出をどこまで制限・警告するか。
- 主な選択肢: 警告のみ、対象画面の OS 制限、秘密情報画面のみ制限する。

### MR-OPEN-008：Mobile release evidence と Store 公開条件

- 論点: iOS / Android の Mainnet capability、Store 公開、Testnet build、OS capability report、security review の判定条件。
- 主な選択肢: 共通 gate を platform 別 evidence へ分解する、Testnet を先行して Mainnet 条件を別途定める、Store 公開と Mainnet capability を分離する。
- 具体的な evidence 項目はリリース設計で定める。

## 8. Traceability

上流根拠、整合確認資料、下流引継ぎおよび外部コンポーネント契約を分けて MR-* に対応付ける。

### 8.1 MR-* と MR-AC-* の対応

| 要求 ID | 上流根拠                                                            | 整合確認資料                                                                                                                  | 下流引継ぎ                                         | 外部コンポーネント契約                                                                                                                                       | 受け入れ条件                                   |
| ------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| MR-001  | Concept §1、§6.5；共通要件 §3、OPEN-003                             | `docs/specifications/product-spec.md`、`docs/mobile/mobile-support.md`、`docs/mobile/mobile-store-release.md`                 | 各 platform milestone の詳細仕様・release 設計     | —                                                                                                                                                            | MR-AC-001                                      |
| MR-002  | Concept §8、§13；CR-001、CR-005、CR-NFR-001、CR-NFR-008、CR-NFR-009 | `docs/specifications/web-transaction-handoff-spec.md`、`docs/mobile/mobile-support.md`                                        | Mobile handoff の後続仕様・設計                    | —                                                                                                                                                            | MR-AC-002（検証対象・完全性）                  |
| MR-003  | Concept §4、§9、§13；CR-008、CR-NFR-002                             | `docs/specifications/web-transaction-handoff-spec.md`、`docs/mobile/mobile-privacy.md`                                        | 外部受け渡しと秘密情報境界の後続仕様               | —                                                                                                                                                            | MR-AC-006                                      |
| MR-004  | Concept §4、§6.2、§6.3；CR-002〜CR-004、CR-NFR-007                  | `docs/specifications/product-spec.md`                                                                                         | Mobile の確認・承認表示仕様                        | —                                                                                                                                                            | MR-AC-003                                      |
| MR-005  | Concept §6.3、§11、§13；CR-010、CR-NFR-003、CR-NFR-009〜CR-NFR-011  | `docs/architecture/architecture.md`、`docs/specifications/web-transaction-handoff-spec.md`、`docs/mobile/mobile-support.md`   | Mobile lifecycle / pending request の後続仕様      | —                                                                                                                                                            | MR-AC-004                                      |
| MR-006  | Concept §11、§13；CR-010、CR-NFR-004                                | `docs/specifications/profile-account-spec.md`、`docs/mobile/mobile-privacy.md`                                                | Mobile の認証・ロック仕様                          | —                                                                                                                                                            | MR-AC-005（明示操作・認証失敗）                |
| MR-007  | Concept §9、§13；CR-008、CR-013、CR-NFR-004                         | `docs/architecture/architecture.md`、`docs/specifications/profile-account-spec.md`                                            | wallet-core 統合・platform integration の後続設計  | `_snwc/README.md`、`_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`、`_snwc/docs/decisions/binding-implementation.md` | MR-AC-005、MR-AC-010                           |
| MR-008  | Concept §11、§12、§13；CR-010、CR-NFR-006                           | `docs/specifications/product-spec.md`、`docs/specifications/web-transaction-handoff-spec.md`、`docs/mobile/mobile-privacy.md` | platform capability 表示・release の後続仕様       | —                                                                                                                                                            | MR-AC-007                                      |
| MR-009  | Concept §10、§11；CR-013、CR-014                                    | `docs/specifications/profile-account-spec.md`、`docs/mobile/mobile-privacy.md`                                                | backup / migration の後続要件・仕様                | `_snwc/docs/specifications/specification.md`                                                                                                                 | MR-AC-008                                      |
| MR-010  | Concept §11、§13；CR-010、CR-014                                    | `docs/specifications/profile-account-spec.md`、`docs/mobile/mobile-privacy.md`、`docs/mobile/mobile-support.md`               | recovery / deletion と platform support の後続仕様 | `_snwc/docs/specifications/specification.md`                                                                                                                 | MR-AC-011                                      |
| MR-011  | Concept §13；CR-008、CR-NFR-002                                     | `docs/mobile/mobile-privacy.md`                                                                                               | platform security policy の後続仕様                | —                                                                                                                                                            | MR-AC-012                                      |
| MR-012  | Concept §6.4、§9、§13；CR-006、CR-011                               | `docs/requirements/relay.md`、`docs/architecture/architecture.md`                                                             | Relay / Mobile handoff の後続仕様                  | —                                                                                                                                                            | MR-AC-002、MR-AC-003、MR-AC-005、MR-AC-013     |
| MR-013  | Concept §6.5、§12、§14；共通要件 §3、CR-NFR-006、CR-011             | `docs/specifications/product-spec.md`、`docs/mobile/mobile-store-release.md`、`docs/release/mainnet-release-evidence.md`      | Store、Mainnet gate、更新互換性の release 設計     | —                                                                                                                                                            | MR-AC-009（配布条件）、MR-AC-014（更新互換性） |

### 8.2 MR-OPEN-* の追跡

| 未決事項 ID | 上流根拠                                             | 整合確認資料                                                                               | 下流引継ぎ                                                  | 外部コンポーネント契約                                                                                                                                       |
| ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MR-OPEN-001 | Concept §1、§6.5、§12；共通要件 OPEN-003、CR-NFR-006 | `docs/mobile/mobile-support.md`、`docs/mobile/mobile-store-release.md`                     | platform support・配布・release の後続設計                  | —                                                                                                                                                            |
| MR-OPEN-002 | Concept §8、§13；CR-NFR-001、CR-NFR-008              | `docs/specifications/web-transaction-handoff-spec.md`、`docs/requirements/relay.md`        | 外部要求受信・送信元検証の後続仕様                          | —                                                                                                                                                            |
| MR-OPEN-003 | Concept §9、§13；CR-013、CR-OPEN-001、CR-OPEN-002    | `docs/architecture/architecture.md`、`docs/specifications/profile-account-spec.md`         | platform integration・Binding・OS 保護境界の後続設計        | `_snwc/README.md`、`_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`、`_snwc/docs/decisions/binding-implementation.md` |
| MR-OPEN-004 | Concept §11、§13；CR-003、CR-010                     | `docs/mobile/mobile-privacy.md`、`docs/specifications/profile-account-spec.md`             | PIN・OS credential・生体認証の後続仕様                      | —                                                                                                                                                            |
| MR-OPEN-005 | Concept §6.3、§11；CR-NFR-009〜CR-NFR-011            | `docs/architecture/architecture.md`、`docs/specifications/web-transaction-handoff-spec.md` | lifecycle・pending request の後続仕様                       | —                                                                                                                                                            |
| MR-OPEN-006 | Concept §10、§11；CR-013、CR-014                     | `docs/specifications/profile-account-spec.md`、`docs/mobile/mobile-privacy.md`             | backup・端末移行・復元の後続要件・仕様                      | `_snwc/docs/specifications/specification.md`                                                                                                                 |
| MR-OPEN-007 | Concept §13；CR-008、CR-NFR-002                      | `docs/mobile/mobile-privacy.md`                                                            | platform privacy policy の後続仕様                          | —                                                                                                                                                            |
| MR-OPEN-008 | Concept §12、§14；CR-NFR-006                         | `docs/mobile/mobile-store-release.md`、`docs/release/mainnet-release-evidence.md`          | Store 公開・Mainnet capability・release evidence の後続設計 | —                                                                                                                                                            |

## 9. 参照資料

### 9.1 上流根拠

- `docs/concept/concept-sheet.md`: MosaicLynx の目的、v1 milestone、Signer / Relay の責任境界、セキュリティ原則および未決事項。
- `docs/requirements/requirements.md`: 共通要求、CR-*、共通受け入れ条件、wallet-core との責任境界および共通未決事項。

### 9.2 整合確認資料

- `docs/specifications/product-spec.md`
- `docs/architecture/architecture.md`
- `docs/requirements/relay.md`
- `docs/mobile/mobile-privacy.md`
- `docs/mobile/mobile-support.md`
- `docs/mobile/mobile-store-release.md`

### 9.3 下流引継ぎ

- `docs/specifications/web-transaction-handoff-spec.md`: 外部要求、Mobile handoff、Relay 境界の具体化先。
- `docs/specifications/profile-account-spec.md`: Profile、Account、backup / restore の具体化先。
- `docs/release/mainnet-release-evidence.md`: Mainnet capability と release evidence 運用の具体化先。
- 各 platform の lifecycle、認証、OS integration、privacy policy、Store 公開、更新互換性に関する後続仕様・設計。

### 9.4 外部コンポーネント契約

- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
