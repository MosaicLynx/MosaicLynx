# MosaicLynx 共通要件定義書

## 1. 文書の目的と位置付け

本書は、[MosaicLynx Concept Sheet](../concept/concept-sheet.md) に基づき、ブラウザ拡張機能、Android アプリ、iOS アプリの Signer に共通する要求と、dApp 側の連携接点である SDK、dApp、Signer、必要に応じて Relay を通る署名要求・結果の End-to-End 境界要求を定める。Relay は Signer ではなく、SDK の固有要求は [SDK 要件](./sdk.md)、Relay 固有の機能・運用要求は [Relay 要件](./relay.md) に定める。

プラットフォーム固有の要求は、次の文書へ分離する。

- [ブラウザ拡張機能要件](./browser-extension.md)
- [スマホアプリ要件](./mobile-app.md)
- [Relay 要件](./relay.md)

本書は、MosaicLynx Application の API、データ形式、暗号、画面、状態遷移、Binding、platform integration および実装方式を確定しない。`symbol-nem-wallet-core` の責任境界は 2.3 と CR-013 に定め、具体的な統合方式は後続設計で定める。

### 1.1 要求の表記

- **MUST**: 対象範囲に含まれる場合、満たさなければならない要求。
- **MUST NOT**: 対象範囲に含まれる主体が、指定された行為または状態を実行・成立させてはならない要求。共通要件への非包含は、対象範囲または対象外範囲で示す。
- **SHOULD**: 原則として満たすべき重要な要求。満たせない場合は理由と影響を記録する。
- **MAY**: v1 の成立条件ではないが、対象に含めることを妨げない事項。

## 2. 共通の目的と利用者

### 2.1 中心価値

MosaicLynx は、Symbol / NEM の dApp を利用する一般ユーザーが、次を確認したうえで、自分の意思により署名を承認または拒否できる Signer である。

- 何へ署名するのか。
- どのチェーン、どのネットワークが対象なのか。
- 署名によって何が起こり得るのか。

秘密情報は dApp、Web ページ、Relay から分離し、Signer が理解・確認できない要求は署名しない。dApp 開発者が提供形態の違いを個別に扱わずに済むことは、一般ユーザーの一貫した安全な署名体験を支える付随価値である。

### 2.2 対象利用者と責任主体

| 主体                     | 共通要件上の位置付け                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| 一般ユーザー             | 第一対象。署名対象を確認し、承認または拒否する。                                                     |
| dApp 開発者              | 主要な協力者。共通の署名接点を利用して、複数の提供形態で署名体験を提供する。                         |
| dApp                     | 署名要求を発行し、署名結果を独立して確認し、必要なネットワーク処理を行う外部主体。                   |
| SDK                      | dApp 側の署名要求・結果の連携接点。Signer ではなく、秘密情報、署名または利用者の最終承認を担わない。 |
| Relay                    | 署名要求をスマホアプリへ受け渡す基盤。署名、意味解釈、秘密情報の取り扱い、announce は担わない。      |
| 運用者                   | 提供環境、公開 build、リリースに必要な証跡を管理する関係者。                                         |
| `symbol-nem-wallet-core` | 鍵管理、Wallet Store、秘密情報を使用する暗号処理、raw byte signing の正本となるコンポーネント。      |

組織利用、カストディ利用、企業向け監査・統制は MosaicLynx v1 の第一対象ではない。将来の保証範囲は `FUTURE-001` として保留し、v1 の進行・完了を妨げない。

### 2.3 承認済みプロジェクト制約

MosaicLynx は、`symbol-nem-wallet-core` を、鍵管理、Wallet Store、秘密情報を使用する暗号処理および raw byte signing の正本として採用する。この採用と責任範囲は承認済みプロジェクト制約であり、未決事項ではない。

MosaicLynx Application から wallet-core を利用する API、Binding、FFI、WASM / Native、React Native 連携、error mapping、migration 手順および platform ごとの具体的統合方式は、後続設計で定める。`_snwc` の requirements / specification は、採用した wallet-core の外部コンポーネント契約を確認する資料として参照する。

## 3. v1、milestone、release の共通境界

`MosaicLynx v1` は、次の4 milestone 全体を指す。

1. ブラウザ拡張機能
2. Android アプリ
3. iOS アプリ
4. Relay

実施順序は上記の順で固定し、Relay milestone の完了を MosaicLynx v1 全体の完了とする。各 milestone は個別の milestone / release 単位として扱える。`Extension MVP` などの個別 release 名称を MosaicLynx v1 全体と同義にしない。

共通の安全な署名判断と責任境界は、各 milestone で維持する。CR-007 の共通署名能力は確定事項とし、各 platform 固有の追加能力、個別完了条件、次 milestone へ進む条件および依存関係は `OPEN-003` で定める。

### Signer と Relay の適用主体

- **Signer**: ブラウザ拡張機能、Android アプリ、iOS アプリ。署名対象の解析・確認、表示、Chain / Network / Account の確認、利用者の明示的な承認または拒否、blind signing の禁止、承認対象と実際の署名対象の一致確認、安全側失敗および署名処理を担う。
- **SDK**: dApp 側の連携接点。Signer ではなく、秘密情報を保管・復号・利用せず、署名および利用者の最終承認を担わない。SDK を経由した入力は Signer が検証前に無条件で信頼してはならず、SDK は Signer の検証・承認・署名条件を迂回、代替または弱体化させない。
- **Relay**: 署名要求・署名結果の受け渡し基盤。署名対象の意味解釈、表示、利用者の承認・拒否、blind signing 判定および署名を担わず、Signer の安全条件を迂回、代替または弱体化させないことを担う。詳細は [Relay 要件](./relay.md) に定める。
- **End-to-End**: dApp、SDK、Signer、Relay を通る全体。要求元・許可範囲、要求内容、鮮度、再利用防止および署名結果の対応を確認する。

Relay milestone は、Relay が利用者判断や署名を行うことではなく、受け渡し境界と Signer の安全条件が維持されることで完了を判定する。

## 4. 共通の対象範囲

### 4.1 共通で提供する能力

共通要件は、Signer の共通能力と、dApp、SDK、Signer、Relay をまたぐ End-to-End の境界要求からなる。SDK は dApp 側の連携接点として共通範囲に含むが、Signer の外部主体である。Relay に直接適用するのは、Signer の安全条件を迂回、代替または弱体化させない受け渡し境界である。

- dApp からのメッセージまたはトランザクションの署名要求を受け付ける。
- transaction signing と message signing を、ブラウザ拡張機能、Android、iOS の各 Signer に共通する署名操作として提供する。
- 利用者が署名対象、チェーン、ネットワーク、確認可能な影響を確認できるようにする。
- 要求ごとに利用者が明示的に署名を承認または拒否できるようにする。
- 理解できない、対象範囲外、検証できない要求を署名せず、安全に終了する。
- 署名に必要な秘密情報と、利用者が署名に用いるアカウントを Signer の責任境界で保護する。
- SDK を含む dApp 側の連携接点を Signer の Trust Boundary 外として扱い、SDK が秘密情報、署名または利用者の最終承認を担わない境界を維持する。
- Symbol / NEM と Mainnet / Testnet を区別し、要求された対象との整合性を確認する。
- 署名結果を dApp へ返し、dApp が結果を独立して確認できる前提を提供する。
- 署名後の announce、ノード選択、継続的なネットワーク状態管理を MosaicLynx の責任外とする。
- 提供形態が変わっても、利用者の明示的な判断と安全側終了の方針を維持する。

### 4.2 Profile と Account の共通要求

- 署名対象となる Profile、Account、Chain、Network の関係を曖昧にしてはならない。
- 利用者が署名に使用する Account を確認・選択できなければならない。
- 秘密情報を利用できない状態では署名してはならない。
- 利用者の認証条件、Signer の unlock 状態、対象 Profile / Chain / Network / Account の署名認可および利用者の明示的承認がすべて成立しない限り、Signer は秘密情報を使用して署名してはならない。
- dApp へ公開する情報は利用者が許可した公開情報に限定し、秘密鍵や Mnemonic を公開してはならない。

MosaicLynx / Application と `symbol-nem-wallet-core` の責任境界は CR-013 に従い、両者を同じ責任主体として扱ってはならない。

`symbol-nem-wallet-core` が Wallet Store 内部の Profile 単位で操作する場合も、それを MosaicLynx / Application の Profile 全体の管理責任とは扱わない。Profile 全体の backup / restore、export / import、migration、merge / overwrite および保存方法の共通要件上の扱いは CR-014 に定める。

## 5. 共通機能要求

要求見出しの括弧内は主な適用主体を示す。各要求の根拠と下流引継ぎは必要な範囲で記載する。

### CR-001 署名要求の受付（Signer / End-to-End）

**MUST** 対象範囲内の dApp から署名要求を受け付け、利用者が判断する Signer の確認領域へ渡さなければならない。

根拠: コンセプト 3、6.1、8。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/specifications/web-transaction-handoff-spec.md`。

### CR-002 署名対象の確認（Signer）

**MUST** 利用者が少なくとも、署名対象、対象チェーン、対象ネットワーク、Signer が確認できる範囲の影響を確認できなければならない。

トランザクションは、対応範囲内の全体を確認できるように解析し、資産移動、権限変更、その他の状態変更に関わる情報を確認できない場合は署名へ進めてはならない。

表示項目、transaction type ごとの表示および raw data の表現は後続仕様で定める。表示できない情報を利用者の自己責任で補完させてはならない。

根拠: コンセプト 3、4、6.2、11。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/specifications/product-spec.md` の署名確認仕様。

### CR-003 明示的な承認または拒否（Signer）

**MUST** 署名要求ごとに、利用者が明示的に承認または拒否できなければならない。承認前に署名を開始してはならない。

根拠: コンセプト 3、4、6.3、11。

下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`。

### CR-004 blind signing の禁止（Signer）

**MUST** Signer が理解・確認できない要求、対象範囲外の要求、検証できない要求を署名してはならない。警告を表示するだけで未解析の要求を許可してはならない。

拒否、判断不能、対象外、検証失敗の場合は、署名結果を返さず安全に終了する。

根拠: コンセプト 3、8、10、11、13。参考: `_snwc/README.md` の「Blind signing の防止」。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/specifications/product-spec.md` の署名可否仕様。

### CR-005 チェーンとネットワークの区別（Signer / End-to-End）

**MUST** Symbol と NEM、Mainnet と Testnet をそれぞれ区別し、要求、Account、Profile、署名対象の整合性を確認しなければならない。

transaction schema、署名 byte 列、鍵導出、network constant は `docs/specifications/chain-compatibility-spec.md` および後続仕様で定める。

根拠: コンセプト 8、11、12。

下流: `docs/specifications/chain-compatibility-spec.md`、`docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`。

### CR-006 署名結果の検証可能性（End-to-End / dApp）

**MUST** 署名結果が元の要求、対象チェーン、対象ネットワーク、署名者と対応していることを確認できる形で返さなければならない。dApp は受け取った署名結果を独立して確認し、必要なネットワーク処理を自ら行う。

結果の型、データ形式、エラー表現は後続仕様で定める。MosaicLynx は dApp に代わって announce してはならない。

根拠: コンセプト 6.4、7、9、11、13、14。下流: `docs/specifications/web-transaction-handoff-spec.md`、`docs/requirements/relay.md`。

### CR-007 共通の署名接点と署名操作（Signer / End-to-End）

**MUST** MosaicLynx v1 の各 Signer（ブラウザ拡張機能、Android、iOS）は、dApp から観測可能な共通の署名接点として、次の署名操作をそれぞれ提供しなければならない。

- transaction signing
- message signing

dApp は、Browser Extension、Android、iOS の提供形態または transport の差異を個別に意識せず、対応する署名操作を要求できなければならない。Relay は署名を実行せず、Mobile Signer がこれらの要求を処理できるように、必要な署名要求・署名結果を受け渡す。

共通の署名接点は、少なくとも成功、利用者拒否、未対応 operation / format、要求元・許可範囲不一致、要求内容不一致、期限切れ、replay / duplicate 等による拒否、Chain / Network / Account 不一致、解析・表示不能およびその他の安全側失敗を、dApp が区別して扱える能力を提供しなければならない。同じ意味の署名操作が platform や transport の差異によって別の危険な意味へ変化してはならず、未対応 operation / format を別の operation、raw signing または別の message format へ暗黙に fallback してはならない。

#### CR-007-TX transaction signing

**MUST** 各 Signer は transaction signing を v1 の共通能力として提供しなければならない。対応範囲内の transaction 全体を解析し、Chain / Network / Account、資産移動、権限変更その他の確認可能な影響を利用者へ提示できない場合は署名してはならない。

#### CR-007-MSG message signing

**MUST** 各 Signer は message signing を v1 の共通能力として提供しなければならない。Signer は、利用者が署名する message の内容を確認可能な形で提示し、message signing であることを transaction signing と区別して表示しなければならない。適用される場合は Chain / Network / Account も確認できなければならない。

利用者が確認した message と実際に署名へ渡す内容が一致しなければならず、表示後に message が変更された場合は署名してはならない。Signer が安全に解釈できない message format、解釈不能・表示不能な message、対象外の message を、警告だけで署名させてはならない。raw bytes を利用者が理解できない状態のまま blind signing してはならず、raw bytes の羅列だけを表示して確認可能と扱ってはならない。

対応する message format の範囲、表示・解釈規則、format、encoding および canonicalization の具体方式は後続仕様で定める。

API、payload、transport、result / error および fallback の具体方式は後続仕様で定める。利用者拒否、未対応 operation / format、検証不能その他の安全側失敗を、別の署名操作の成功として返してはならない。

transaction handoff と message signing の具体的な接点は、既存の handoff 仕様を本要件に整合させる後続仕様で定める。

根拠: コンセプト 2、3、4、5、7、8。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/specifications/product-spec.md`、`docs/specifications/web-transaction-handoff-spec.md`。

### CR-008 秘密情報の分離（Signer / End-to-End）

**MUST** 秘密鍵、Mnemonic、Profile password、復号済み backup、署名に必要な秘密情報を、dApp、Web ページ、SDK、Relay、URL、ログ、例外、warning、診断情報、外部通信または継続保存領域へ不要に公開・保持してはならない。SDK は秘密情報を保管、復号または利用してはならない。

秘密情報の保存、復号、鍵導出および raw byte signing は `symbol-nem-wallet-core` の契約を正本とする。MosaicLynx 側で wallet-core 内部の鍵管理、Wallet Store、秘密情報を使用する暗号処理、raw signing を再実装してはならない。Profile 全体の backup / restore と backup format は CR-014 に従い、MosaicLynx v1 全体の共通 MUST として扱わない。

根拠: コンセプト 4、7、8、9、11、13。参考: `_snwc/README.md`。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`、`docs/specifications/profile-account-spec.md` の責任範囲整合。

### CR-009 利用者が管理する Account（Signer）

**MUST** 利用者が署名に用いる Account を確認・選択でき、dApp へ公開する Account の範囲を利用者の許可なしに拡大してはならない。

接続許可の識別単位、公開情報の契約、Account の表示方法は下流仕様で定める。

根拠: コンセプト 5、7、11、13。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/specifications/product-spec.md` の接続許可仕様。

### CR-010 共通の安全側失敗（Signer / End-to-End）

**MUST** 認証条件、署名可能な unlock 状態、対象 Profile / Chain / Network / Account の署名認可、対象確認、チェーン・ネットワーク整合性、署名対象検証、署名結果検証のいずれかに失敗または確認不能な場合、署名結果を返さず安全側に終了しなければならない。署名可能状態の共通前提は `CR-016` に従う。

根拠: コンセプト 3、8、11、13、14。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`、`docs/specifications/web-transaction-handoff-spec.md`。

### CR-011 Platform 間の責任境界維持（Signer / SDK / Relay / dApp）

**MUST** 主体ごとに次の責任境界を維持しなければならない。

- Signer（ブラウザ拡張機能、Android、iOS）は、署名対象の解析・表示、Chain / Network / Account の確認、利用者の明示的な承認または拒否、blind signing の禁止、承認対象と署名対象の一致確認、安全側失敗および署名処理を担う。
- SDK は dApp 側の連携接点であり、Signer ではない。秘密情報、署名および利用者の最終承認を担わず、Signer の検証・認証・認可・unlock・署名条件を迂回、代替または弱体化させない。
- Relay は、署名対象の意味解釈、表示、利用者の承認・拒否、blind signing 判定および署名を担わず、Signer の検証・承認・署名を迂回、代替または弱体化させない。
- dApp は、署名結果を独立して検証し、必要なネットワーク処理を担う。MosaicLynx は dApp に代わって announce、ノード選択または継続的なネットワーク状態管理を行わない。

機能や操作が完全に同一でない場合でも、Signer と Relay の適用主体を混同せず、共通の安全要求を満たす範囲でプラットフォーム差異を認める。Relay 固有の受け入れ条件は `docs/requirements/relay.md` に定める。

根拠: コンセプト 1、6.5、9、11、12、14。

下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`。

### CR-012 共通の失敗結果（Signer / End-to-End / dApp）

**MUST** 拒否、未対応 operation / format、要求元・許可範囲不一致、要求内容不一致、期限切れ、replay / duplicate 等による拒否、Chain / Network / Account 不一致、解析・表示不能、検証失敗、未認証、locked、Account authorization 不成立、authorization 状態の確認不能、利用不能、wallet-core 失敗など、署名を完了できない場合に、署名結果を成功または別の署名操作の成功として返してはならない。dApp が成功とこれらの失敗を区別して安全に処理できる結果を返し、秘密情報や過剰な内部情報を含めてはならない。

失敗の分類、公開エラーコード、再試行条件は後続仕様で定める。

根拠: `CR-001`、`CR-006`、`CR-010`、`CR-011` およびコンセプト 8、11、14。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`、`docs/specifications/web-transaction-handoff-spec.md`。

### CR-013 Application と wallet-core の責任境界

**MUST** `symbol-nem-wallet-core` を、鍵管理、Wallet Store、秘密情報を使用する暗号処理および raw byte signing の正本として扱わなければならない。MosaicLynx / Application は、Profile、Account の表示・選択・関連付け、Chain / Network 設定、dApp 接続・権限、UI、利用者の承認・拒否、platform integration、Relay 連携および署名処理の orchestration を担当しなければならない。

既存 TypeScript 実装のうち wallet-core と責任が重複する処理を正本として扱ってはならない。transaction / message の解析、Symbol / NEM の表示用変換、UI、dApp 接続・権限管理、platform 固有処理、Relay 連携その他の Application 層の処理は、wallet-core の責任外として MosaicLynx 側に残す。

wallet-core の統合方式、Binding、FFI、WASM / Native、React Native 連携、移行手順および error mapping は後続設計で定める。

根拠: コンセプト 9、13。参考（外部コンポーネント契約）: `_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`、`_snwc/docs/decisions/binding-implementation.md`。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`。

### CR-014 Profile 全体 backup / restore の共通要件への非包含

Profile 全体の backup / restore、export / import、Profile ID の重複判定、merge / overwrite、migration、backup format、backup password または backup の保存方法を、MosaicLynx v1 全体および全 Signer に共通する MUST または共通完了条件として定義しない。

個別 platform / release で将来これらの機能を提供することは妨げない。提供する場合の Application と wallet-core の責任分担、Wallet Store の扱い、復元範囲および具体方式は、その platform の要件・仕様で定める。Profile 全体の backup / restore を wallet-core の責任とすることは、本書で定義しない。

根拠: `CR-013`、コンセプト 10。下流: backup を将来提供すると決定した個別 platform / release の要件・仕様（`docs/specifications/product-spec.md`、`docs/specifications/profile-account-spec.md` を含む）。Browser Extension 初回 milestone / release の必須能力としては、本 CR-014 から下流要求を追跡しない。

### CR-015 SDK の共通責任境界（SDK / Signer / End-to-End）

**MUST** SDK は dApp 側の署名要求・結果の連携接点として扱い、Signer ではないものとする。SDK は秘密情報を保管・復号・利用してはならず、署名してはならず、利用者の最終承認を成立させてはならない。SDK は Signer の Trust Boundary 外にあり、SDK 経由の入力を Signer が検証前に無条件で信頼してはならない。

SDK、dApp および Relay は、Signer の検証、認証、Account authorization、unlock および署名条件を迂回、代替または弱体化させてはならない。SDK の API、payload、transport、caller binding、実行環境および具体的な連携方式は後続要件・設計・仕様で定める。

根拠: コンセプト 4、8、9、11、13。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`。

### CR-016 署名可能状態の共通前提（Signer / End-to-End）

**MUST** Signer は、次のすべてが成立した場合に限り、秘密情報を使用して署名し、署名結果を返すことができる。

1. 利用者の認証条件が成立している。
2. Signer が署名可能な unlock 状態にある。
3. 対象 Profile / Chain / Network / Account に対する署名認可が成立している。
4. 利用者が対象署名要求を明示的に承認している。

未認証、locked、Account authorization 不成立、authorization 状態を確認できない場合、Profile / Chain / Network / Account が不整合な場合、または利用者の明示的承認がない場合、Signer は署名を開始せず、署名結果を返してはならない。dApp、SDK および Relay は、これらの状態を外部から成立させ、更新し、迂回、代替または弱体化させてはならない。

認証方式、password、PIN、biometric、OS credential、session duration、再認証間隔、unlock state、Account permission の構造、API、error code および UI は後続要件・設計・仕様で定める。

根拠: コンセプト 3、8、11、13。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`。

## 6. 共通の非機能・セキュリティ要求

### CR-NFR-001 外部入力を信頼しない（Signer / Relay / End-to-End）

**MUST** dApp、Web ページ、SDK、Relay、ネットワーク、Provider、Mobile アプリ、wallet-core Binding など外部境界から受け取る入力を、検証前に信頼してはならない。

根拠: コンセプト 13。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`。

### CR-NFR-002 秘密情報を不要に複製・出力しない（Signer / End-to-End）

**MUST** 秘密情報をログ、例外、warning、診断情報、URL、Web ページ、SDK、Relay、外部通信または継続保存領域へ不要に含めてはならない。SDK は秘密情報の保管・復号・利用主体になってはならず、プラットフォーム側の一時的な入力仲介が発生する場合も、継続保存・公開主体になってはならない。

根拠: コンセプト 9、13。参考（外部コンポーネント契約）: `_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`、`_snwc/docs/decisions/binding-implementation.md`、`_snwc/README.md`。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`。

### CR-NFR-003 署名前の再確認（Signer）

**MUST** 署名直前に、利用者が確認・承認した対象と、実際に署名へ渡す対象の対応を確認できなければならない。確認後に対象が変化した場合は署名してはならない。

revision、digest、要求識別、timeout および状態遷移の具体方式は後続仕様で定める。

根拠: コンセプト 6.2、6.3、11、13。参考: `_snwc/README.md` の「表示対象と署名対象の同一性」。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/specifications/product-spec.md` の署名確認仕様。

### CR-NFR-004 wallet-core の失敗を安全に扱う

**MUST** `symbol-nem-wallet-core` の失敗、警告、Binding エラー、Store 検証失敗を無視して署名を継続してはならない。失敗時は署名結果を返さず、秘密情報をエラーや診断情報へ含めず、利用者に判断可能な範囲の結果を返す。

wallet-core の stable error code、warning、Binding 契約の詳細は wallet-core 側の正本に従う。

根拠: `CR-013`、コンセプト 9、13。参考（外部コンポーネント契約）: `_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`、`_snwc/docs/decisions/binding-implementation.md`。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`。

### CR-NFR-005 Symbol / NEM の相互運用性

**MUST** Symbol と NEM の導出、address、transaction、署名処理を暗黙に共通化してはならない。対応範囲内の要求と結果は、対象チェーンの承認済み仕様・固定 vector・wallet-core 契約に従わなければならない。

根拠: コンセプト 8、11、12。下流: `docs/specifications/chain-compatibility-spec.md`、`docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`。

### CR-NFR-006 Mainnet の公開制御

**MUST** Mainnet capability は、適用される Mainnet release policy が要求する gate を満たした場合にのみ有効化できる。Mainnet の安全性を可用性より優先し、gate が成立しない場合に Mainnet unavailable となることは許容する。Testnet-only で安全に継続できる提供形態を妨げてはならない。

次のいずれかに該当する場合は gate 未達成として扱わなければならない。

- 必須 evidence の欠落、不整合、期限切れまたは検証不能。
- 必須承認の不足。
- evidence の署名または整合性検証の失敗。
- 適用する release policy を確定できない状態。
- trusted key が設定されていない、未知の key しかない、または署名を検証できない状態。

gate 未達成または判定不能な状態で Mainnet を有効化してはならず、fail-open を許可してはならない。

Mainnet release policy は、次の資料で管理する。

- `docs/adr/0001-mainnet-evidence-lite.md`: 初期 Mainnet release で Lite gate を採用する意思決定、single-maintainer project における理由および strict policy への移行方針を記録する。
- `docs/evidence/evidence-policy.json`: mode、required approvals、evidence age、trusted keys その他の evaluator が読む policy parameter を管理する。
- `docs/release/mainnet-release-evidence.md`: 現在の release policy における evidence 要求、収集・署名・検証、fail-closed、recovery / key revocation および strict migration の operational reference とする。

evidence 項目、policy parameter、検証手順および実装方式は、これらの資料と後続の release / security operation で定める。

根拠: コンセプト 12、14、15。決定: `docs/adr/0001-mainnet-evidence-lite.md`。下流: `docs/evidence/evidence-policy.json`、`docs/release/mainnet-release-evidence.md`。

### CR-NFR-007 利用者判断可能性（Signer）

**MUST** 署名確認の提示は、一般ユーザーが要求を理解・確認し、承認または拒否できるものでなければならない。Signer が確認できない内容を、ユーザーの自己責任だけで補完させてはならない。

表示レイアウト、文言、支援技術および表示の詳細粒度は、プラットフォーム要件・利用者検証・後続仕様で定める。

根拠: コンセプト 3、4、6.2、6.3、11。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/specifications/product-spec.md` の署名確認仕様。

### CR-NFR-008 要求元と許可範囲の対応（Signer / End-to-End）

**MUST** Signer は、署名要求が許可した要求元、現在有効な接続、現在有効な署名セッションまたは許可された権限範囲のうち、適用されるコンテキストと対応していることを確認できなければならない。対応を確認できない要求は署名してはならない。

すべての dApp に暗号学的な本人認証を必須化することは本要求に含めない。Browser Extension の Origin・Provider connection、Mobile / Relay の handoff session などの具体方式は後続仕様で定める。Relay はこの対応関係を独自に解釈・承認せず、別の要求元・セッション・権限範囲へ置換してはならない。

導出理由: 利用者が許可していない要求元、接続または権限範囲からの署名を防ぐため。

根拠: コンセプト 3、4、5、11、13。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/specifications/web-transaction-handoff-spec.md`。

### CR-NFR-009 要求内容の完全性と承認対象の一致（Signer / End-to-End）

**MUST** 利用者が確認・承認した要求と、実際に署名する対象が一致していなければならない。要求の改ざん、差し替え、承認後の内容変更、別要求との取り違え、別 Account / Chain / Network への置換を検出または確認できない場合は署名してはならない。

完全性確認と要求識別の具体方式は後続仕様で定め、Relay では `RR-003`、`RR-005` および `RR-007` と整合させる。

導出理由: 利用者が確認・承認した内容と異なる対象への署名を防ぐため。

根拠: コンセプト 3、6.2、6.3、11、13。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`。

### CR-NFR-010 要求の鮮度（Signer / End-to-End）

**MUST** Signer は、期限切れ、失効済みまたは現在の署名処理として有効でない要求を署名してはならない。Relay の復旧や再配送によって、無効な要求を有効な要求として扱ってはならない。

鮮度管理の具体方式は後続仕様で定め、Relay では `RR-004` および `RR-006` と整合させる。

導出理由: 失効済み、期限切れまたは現在有効でない要求への署名を防ぐため。

根拠: コンセプト 3、6.3、11。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`。

### CR-NFR-011 Replay・重複・遅延配送の拒否（Signer / End-to-End）

**MUST** 古い要求の replay、使用済み要求の再利用、同一要求の重複配送、ネットワークまたは Relay による重複、遅延した要求の後着、過去セッションの要求の再出現によって、追加の署名が発生してはならない。

再利用防止・重複排除・状態管理の具体方式は後続仕様で定め、Relay では `RR-006` および `RR-007` と整合させる。

導出理由: 一度の承認から追加の意図しない署名が発生することを防ぐため。

根拠: コンセプト 3、6.3、11、13。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`。

### CR-NFR-012 署名結果と元要求の対応（End-to-End / dApp）

**MUST** 署名結果は、元の署名要求、署名者、Account、Chain および Network に対応していることを確認できなければならない。dApp は受け取った署名結果を独立して検証し、Relay または Provider が成功を返したことだけを署名結果の正当性の根拠としてはならない。

結果の形式・対応付け・error の具体方式は後続仕様で定め、Relay では `RR-002`、`RR-005` および `RR-007` と整合させる。

導出理由: 元の要求に対応しない結果を dApp が署名成功として扱うことを防ぐため。

根拠: コンセプト 6.4、7、9、11、13。下流: `docs/requirements/relay.md`、`docs/specifications/web-transaction-handoff-spec.md`、各 platform の署名結果受け入れ条件。

### CR-NFR-013 Security guarantee boundary（Signer / 承認境界）

**MUST** MosaicLynx の共通 Security 要求および成功条件は、MosaicLynx が管理する Signer / 承認境界が正常に動作していることを前提とする。その範囲では、秘密情報を外部主体へ不要に公開せず、利用者の明示的承認なしに署名せず、信頼境界外の入力を無条件に信頼せず、Signer の検証・認証・認可・署名条件を外部主体が迂回できないことを要求する。

この保証は、OS 全体、端末全体、Browser 全体、dApp / Web page、正規配布 artifact その他 Signer の管理境界外の完全な compromise まで防ぐことを意味しない。攻撃者分類、exploit scenario、OS isolation、extension process isolation、code signing、supply-chain controls、cryptographic mechanism、storage protection および詳細な残余リスクは後続の Design / Specification / release security で定める。

根拠: コンセプト 9、11、13、14。下流: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`、`docs/release/threat-model.md`。

## 7. 共通の対象外

MosaicLynx v1 の共通対象外は次のとおりとする。

- 残高、履歴、トークン、ネームスペースなどの資産管理。
- ノードの選択、ノードリスト管理、署名済みトランザクションの announce、継続的なネットワーク状態管理。
- 利用者の確認を省略する自動署名、永続的な署名許可、blind signing。
- 理解・確認できない要求を、警告だけを理由に署名すること。
- MosaicLynx 自身による dApp の企画、開発、運営、利用者獲得。
- 組織向け監査・統制・カストディ保証を v1 の第一対象または完了条件とすること。
- ハードウェアウォレット、コールドウォレット、企業カストディと同等の保証を標榜すること。
- Profile 全体の backup / restore を v1 全体の共通能力または完了条件に含めること。個別 platform での提供は、その platform の要件・仕様で定める。
- Relay による署名対象の意味解釈、署名、秘密情報の取り扱い、announce、長期保管。

## 8. 共通の成功条件・受け入れ条件

MosaicLynx v1 は、一般ユーザーの安全な署名判断、秘密情報の分離、提供形態間の責任境界が確認できた状態を成功とする。以下の Security 要求および成功条件は、MosaicLynx が管理する Signer / 承認境界が正常に動作していることを前提として判定する。主要な要求の受入条件を以下に示す。

| 受け入れ ID | 関連要求                                       | 適用主体                           | 成功時に確認できる状態                                                                                                                                                                                                                                                                                                              | 拒否・失敗時に確認できる安全側結果                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CR-AC-001   | `CR-002`, `CR-003`, `CR-NFR-003`, `CR-NFR-007` | Signer                             | 利用者が署名対象、Chain、Network、確認可能な影響を確認し、要求ごとに明示的に承認または拒否でき、承認対象と実際の署名対象が対応している。                                                                                                                                                                                            | 表示・解析不能、明示的承認なし、確認後の対象変更または判断不能の場合は署名しない。                                                                                                                                                                     |
| CR-AC-002   | `CR-004`                                       | Signer                             | Signer が理解・確認できる要求だけが署名対象となり、blind signing が行われない。                                                                                                                                                                                                                                                     | 理解不能、対象外または検証不能な要求は警告だけで継続せず、署名結果を返さず終了する。                                                                                                                                                                   |
| CR-AC-003   | `CR-005`, `CR-009`, `CR-NFR-005`               | Signer / End-to-End                | Symbol / NEM、Mainnet / Testnet、Account、Profile および署名対象の整合性を確認でき、利用者が署名 Account を選択・確認できる。                                                                                                                                                                                                       | Chain、Network、Account または許可範囲が不一致・確認不能な場合は署名しない。                                                                                                                                                                           |
| CR-AC-004   | `CR-006`, `CR-NFR-012`                         | End-to-End / dApp                  | dApp が、署名結果と元要求、署名者、Account、Chain、Network の対応を確認し、署名結果を独立して検証できる。                                                                                                                                                                                                                           | 対応を確認できない結果、受け渡し成功だけの結果または不正な結果は成功扱いせず、必要なネットワーク処理へ進めない。                                                                                                                                       |
| CR-AC-005   | `CR-007`, `CR-007-TX`                          | Signer                             | Browser Extension、Android、iOS の各 Signer が transaction signing を提供し、対応範囲内の transaction 全体と確認可能な影響を利用者へ提示できる。                                                                                                                                                                                    | transaction 全体、Chain / Network / Account または影響を確認できない場合は署名しない。                                                                                                                                                                 |
| CR-AC-006   | `CR-007`, `CR-007-MSG`                         | Signer                             | Browser Extension、Android、iOS の各 Signer が message signing を提供し、message 内容、message signing であること、適用される Chain / Network / Account および実際の署名対象を確認できる。                                                                                                                                          | raw bytes の羅列だけでは確認済みとせず、解釈不能、表示不能、内容不一致または未対応 format は署名しない。                                                                                                                                               |
| CR-AC-007   | `CR-008`, `CR-NFR-002`                         | 全体 / 責任境界                    | MosaicLynx が管理する Signer / 承認境界が正常に動作している前提で、秘密情報が dApp、Web page、SDK、Relay、URL、ログ、例外、warning、診断情報、外部通信または継続保存領域へ不要に公開・保持されない。                                                                                                                                | 秘密情報の境界を維持できない場合は処理を継続せず、秘密情報を結果・エラー・診断情報へ返さない。                                                                                                                                                         |
| CR-AC-008   | `CR-NFR-006`                                   | Platform / Release                 | 適用される Mainnet release policy が要求する gate を満たしたことを確認できた場合にのみ、Mainnet capability を有効化できる。                                                                                                                                                                                                         | 必須 evidence の欠落・不整合・期限切れ・検証不能、承認不足、署名・整合性検証失敗、trusted key 不備または policy 判定不能の場合は Mainnet を有効化しない。                                                                                              |
| CR-AC-009   | `CR-011`                                       | Signer / SDK / Relay / dApp        | Signer が解析・表示・承認・署名を担い、SDK が dApp 側の連携接点として署名せず、Relay が受け渡しだけを担い、dApp が署名結果を独立して検証する責任境界が維持される。                                                                                                                                                                  | SDK または Relay による検証・認証・認可・承認・署名の迂回、代替または弱体化がある場合は署名を継続しない。                                                                                                                                              |
| CR-AC-010   | `CR-013`, `CR-NFR-004`                         | Application / wallet-core / Signer | Profile、表示・承認、platform integration、Relay 連携、orchestration と、鍵管理、Wallet Store、秘密情報処理、raw signing の責任境界を確認できる。wallet-core の失敗も Application 側で安全に扱える。                                                                                                                                | 責任境界が不明確、wallet-core が失敗または Store / Binding が不整合な場合は署名を継続せず、秘密情報を漏らさない。                                                                                                                                      |
| CR-AC-011   | `CR-NFR-008`                                   | Signer / End-to-End                | 要求が許可した要求元、現在有効な接続・署名セッションまたは許可された権限範囲と対応していることを確認できる。                                                                                                                                                                                                                        | 要求元・接続・セッション・許可範囲との対応を確認できない場合は署名しない。                                                                                                                                                                             |
| CR-AC-012   | `CR-NFR-009`                                   | Signer / End-to-End                | 利用者が確認・承認した要求と実際に署名する対象が一致し、Account、Chain、Network の置換や承認後の内容変更がないことを確認できる。                                                                                                                                                                                                    | 改ざん、差し替え、取り違えまたは不一致を確認できない場合は署名しない。                                                                                                                                                                                 |
| CR-AC-013   | `CR-NFR-010`                                   | Signer / End-to-End                | 現在の署名処理として有効な要求だけが処理され、Relay の復旧・再配送だけで無効な要求が有効にならない。                                                                                                                                                                                                                                | 期限切れ、失効済みまたは有効性を確認できない要求は拒否し、署名しない。                                                                                                                                                                                 |
| CR-AC-014   | `CR-NFR-011`                                   | Signer / End-to-End                | replay、使用済み要求の再利用、重複・遅延配送または過去セッションの再出現によって追加の署名が発生しない。                                                                                                                                                                                                                            | 再利用、重複、遅延または過去セッションとの対応を確認できない要求は署名しない。                                                                                                                                                                         |
| CR-AC-015   | `CR-007`, `CR-012`                             | End-to-End / dApp                  | dApp が提供形態・transport の差異を越えて transaction signing / message signing を要求し、成功、利用者拒否、未対応、検証失敗その他の安全側失敗を区別して扱える。                                                                                                                                                                    | 未対応 operation / format、利用者拒否または検証不能を、別 operation の成功や署名成功として扱わない。                                                                                                                                                   |
| CR-AC-016   | `CR-001`, `CR-NFR-001`                         | Signer / End-to-End                | 外部要求が検証前に信頼されず、対象範囲内の dApp または SDK から Signer の確認領域へ安全性の確認対象として渡される。                                                                                                                                                                                                                 | 要求元、入力または受け渡しを検証できない場合は署名要求として処理せず、署名結果を成功として返さない。                                                                                                                                                   |
| CR-AC-017   | `CR-003`, `CR-009`, `CR-010`, `CR-016`         | Signer / dApp / SDK / Relay        | 対象署名要求について、利用者の認証条件、署名可能な unlock 状態、対象 Profile / Chain / Network / Account の署名認可および利用者の明示的承認がすべて成立した場合に限り、Signer が署名し署名結果を返す。                                                                                                                              | 未認証、locked、Account authorization 不成立、authorization 状態の確認不能、Profile / Chain / Network / Account 不整合または利用者未承認の場合は、Signer が署名せず署名結果を成功として返さない。dApp、SDK、Relay はこれらを成立・更新・迂回できない。 |
| CR-AC-018   | `CR-015`, `CR-008`, `CR-NFR-001`, `CR-NFR-002` | SDK / Signer / Relay / dApp        | SDK が dApp 側の Signer 外の連携接点として動作し、秘密情報を保管・復号・利用せず、署名せず、利用者の最終承認を成立させず、Signer が SDK 経由の入力を検証前に信頼しない。                                                                                                                                                            | SDK、dApp または Relay が秘密情報を扱う、署名する、最終承認を成立させる、または Signer の検証・承認・署名条件を迂回する場合は、Signer が署名を継続せず署名結果を返さない。                                                                             |
| CR-AC-019   | `CR-NFR-013`                                   | 全体 / Security boundary           | Security 要求の合否が、MosaicLynx が管理する Signer / 承認境界の正常動作を前提に判定され、同境界内の秘密情報分離、明示的承認、入力非信頼および外部主体による条件迂回不可を確認できる。OS、端末、Browser、dApp / Web page、正規配布 artifact その他管理境界外の完全 compromise は、MosaicLynx の完全防御保証の対象として扱われない。 | 保証境界を特定できない場合、または管理境界外の完全 compromise まで防御する無条件保証として扱う場合は、Security の成功条件を満たさない。                                                                                                                |

## 9. 共通の未決事項

### OPEN-001：中心課題の実在性と現在の回避方法

- 論点: 一般ユーザーが署名対象と秘密情報の境界を判断しにくいという課題が、どの場面でどの程度発生しているか。また、現在どのような手段で回避されているか。
- 扱い: 既存手段、想定利用場面、課題仮説を可能な範囲で確認する。未確認部分は検証前の仮説として追跡し、必要に応じて要件定義中および初期 milestone でも検証する。未完了であることだけを理由に要件定義全体を停止しない。
- 引継ぎ: 課題仮説の検証結果を、要求の根拠と区別して扱う。

### OPEN-002：一般ユーザーが必要とする確認情報

- 論点: 一般ユーザーが署名判断を完了するために、どの情報を確認できる必要があるか。
- 扱い: 署名対象、チェーン、ネットワーク、影響の確認を求める。表示項目、表示粒度、transaction type 別の内容は利用者検証と後続仕様で定める。
- 引継ぎ: `CR-002`、`CR-NFR-007`、`CR-AC-001` を具体化する。

### OPEN-003：4 milestone の個別完了条件

- 論点: ブラウザ拡張機能、Android アプリ、iOS アプリ、Relay が、それぞれ何を提供できれば個別 milestone / release を完了し、次へ進めるか。
- 確定済み: 実施順序はブラウザ拡張機能 → Android → iOS → Relay。Relay milestone 完了を MosaicLynx v1 全体完了とする。Browser Extension、Android、iOS の各 Signer が、CR-007 に定める transaction signing と message signing を共通能力として提供する。共通の安全要求と責任境界も確定事項とする。
- 未決範囲: 各 platform 固有の外部要求、CR-007 以外の platform 固有追加能力、個別 milestone の完了条件、次 milestone へ進む条件、platform 固有の依存関係および共通要件を具体化する仕様・設計上の条件。CR-007 の operation 対応可否、共通の安全要求および責任境界は未決範囲に含めない。

### OPEN-004：履歴上の欠番

OPEN-004 は履歴上の欠番であり、現在の未決事項としては扱わない。

### OPEN-005：Mainnet 一般公開の詳細条件

- 確定済み: Mainnet release gate は存在し、初期 Mainnet release には ADR 0001 で Lite gate が採用されている。適用される current release policy / evidence policy に従い、gate 未達成または判定不能の場合は Mainnet を有効化しない。
- 論点: 確定済みの gate を、将来の release approval の具体的運用、CI/CD への組み込み、evidence の保存・配布、policy evaluator の実装、checklist / runbook、strict policy への移行時期・手順、team 化後の approver 分離および policy 改訂へどう反映するか。
- 引継ぎ: 上記の運用・実装・将来改訂は、後続の release / security operation で定める。

### FUTURE-001：組織向け監査・統制・カストディ保証の範囲

- 現在の扱い: 組織利用、監査、統制、カストディ保証は MosaicLynx v1 の初期対象外とし、v1 の完了条件に含めない。
- 将来の論点: 一般ユーザー向け提供の後、どこまで保証するか。
- 扱い: v1 の進行・完了を妨げず、将来の組織向け展開時に改めて判断する。具体的な機能、要件、設計、保証範囲は定めない。

### CR-OPEN-001：wallet-core との具体的統合方式

- 確定事項: `symbol-nem-wallet-core` は、鍵管理、Wallet Store、秘密情報を使用する暗号処理および raw byte signing の正本である。MosaicLynx / Application は Profile、表示・承認、dApp 接続・権限、platform integration、Relay 連携および orchestration を担当する。この責任境界自体は未決事項ではない。
- 論点: 確定した責任境界を、各 platform から利用する具体的な API、Binding、FFI、WASM / Native、React Native 連携、既存 TypeScript 実装からの移行および error mapping へどう反映するか。
- 下流への引継ぎ: 既存 Binding の利用、platform ごとの Binding の追加、既存 TypeScript 実装からの段階移行を含む具体的な統合方式、移行手順および error mapping は、wallet-core を正本とする責任境界を維持して設計で定める。

### CR-OPEN-002：wallet-core Binding と実行環境の責任境界

- 論点: Browser Extension、iOS、Android から wallet-core を利用する Binding、秘密情報の一時的な受け渡し、OS保護機能との境界をどこに置くか。
- 下流への引継ぎ: 既存 Native / WASM Binding の利用、platform ごとの Binding の追加、配布境界の設定を含む具体方式は設計で定める。各 platform の秘密情報ライフサイクルと失敗時の扱いは、当該 platform の詳細設計前に決定する。

## 10. 下流工程への引継ぎ

1. `CR-OPEN-001` で、確定した責任境界に沿った wallet-core の具体的な統合方式を決定する。
2. `CR-OPEN-002` で各 platform の Binding と秘密情報ライフサイクルの境界を決定する。
3. Profile 全体の backup / restore は v1 共通要求へ含めず、個別 platform で提供する場合の Application と wallet-core の責任分担を、その platform の要件・仕様で定める。
4. `CR-015`、`CR-016`、`CR-NFR-013` を含む共通要求を、適用範囲に応じて [ブラウザ拡張機能要件](./browser-extension.md)、[スマホアプリ要件](./mobile-app.md)、[Relay 要件](./relay.md) および [SDK 要件](./sdk.md) へ引き継ぐ。各 Signer は署名前提を満たし、SDK と Relay は Signer の外部境界として検証・認証・認可・承認・署名条件を迂回しない責任を具体化する。
5. `OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005` を各 platform 要件へ引き継ぐ。`OPEN-005` は確定済みの Mainnet gate を前提に、release / security operation の詳細を扱う。`OPEN-004` は履歴上の欠番であり、未決事項として引き継がない。
6. 共通要求を満たすために必要な API、データ形式、parser、エラー、状態遷移、暗号方式、UI、テストの詳細を、後続の仕様・設計で定める。
7. `FUTURE-001` は MosaicLynx v1 の要求・完了判定へ取り込まず、将来検討時まで保留する。

## 11. 参照資料

- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/design/architecture.md`
- `docs/adr/0001-mainnet-evidence-lite.md`
- `docs/evidence/evidence-policy.json`
- `docs/release/mainnet-release-evidence.md`
- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
