# MosaicLynx 共通要件定義書（たたき台）

## 1. 文書の目的と位置付け

本書は、[MosaicLynx Concept Sheet](../concept/concept-sheet.md) に基づき、ブラウザ拡張機能とスマホアプリのどちらにも適用する共通要求を整理するたたき台である。

プラットフォーム固有の要求は、次の文書へ分離する。

- [ブラウザ拡張機能要件](./browser-extension.md)
- [スマホアプリ要件](./mobile-app.md)
- [Relay 要件](./relay.md)

本書は、API、データ形式、暗号アルゴリズム、クラス、画面レイアウト、状態遷移、実装ライブラリを確定しない。既存仕様書は要求の根拠または具体化候補として参照し、コンセプトと整合しない記述は未決事項または下流整合事項として扱う。

### 1.1 要求の表記

- **MUST**: 対象範囲に含まれる場合、満たさなければならない要求。
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

| 主体                     | 共通要件上の位置付け                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| 一般ユーザー             | 第一対象。署名対象を確認し、承認または拒否する。                                                          |
| dApp 開発者              | 主要な協力者。共通の署名接点を利用して、複数の提供形態で署名体験を提供する。                              |
| dApp                     | 署名要求を発行し、署名結果を独立して確認し、必要なネットワーク処理を行う外部主体。                        |
| Relay                    | 署名要求をスマホアプリへ受け渡す基盤。署名、意味解釈、秘密情報の取り扱い、announce は担わない。           |
| 運用者                   | 提供環境、公開 build、リリースに必要な証跡を管理する関係者。                                              |
| `symbol-nem-wallet-core` | 鍵管理、Wallet Store、raw byte への署名など、承認済み契約に含まれる低レベル責任を担う利用予定のコンポーネント。 |

組織利用、カストディ利用、企業向け監査・統制は MosaicLynx v1 の第一対象ではない。将来の保証範囲は `FUTURE-001` として保留し、現在の要件定義や v1 完了の blocker としない。

## 3. v1、milestone、release の共通境界

`MosaicLynx v1` は、次の4 milestone 全体を指す。

1. ブラウザ拡張機能
2. Android アプリ
3. iOS アプリ
4. Relay

実施順序は上記の順で固定し、Relay milestone の完了を MosaicLynx v1 全体の完了とする。各 milestone は個別の milestone / release 単位として扱える。`Extension MVP` などの個別 release 名称を MosaicLynx v1 全体と同義にしない。

共通の安全な署名判断と責任境界は、各 milestone で維持する。各 milestone の外部要求、個別完了条件、次 milestone へ進む条件、依存関係は `OPEN-003` で決定する。実施順序は未決事項ではない。

## 4. 共通の対象範囲

### 4.1 共通で提供する能力

MosaicLynx は、プラットフォームにかかわらず、少なくとも次の能力を持たなければならない。

- dApp からのメッセージまたはトランザクションの署名要求を受け付ける。
- 利用者が署名対象、チェーン、ネットワーク、確認可能な影響を確認できるようにする。
- 要求ごとに利用者が明示的に署名を承認または拒否できるようにする。
- 理解できない、対象範囲外、検証できない要求を署名せず、安全に終了する。
- 署名に必要な秘密情報と、利用者が署名に用いるアカウントを Signer の責任境界で保護する。
- Symbol / NEM と Mainnet / Testnet を区別し、要求された対象との整合性を確認する。
- 署名結果を dApp へ返し、dApp が結果を独立して確認できる前提を提供する。
- 署名後の announce、ノード選択、継続的なネットワーク状態管理を MosaicLynx の責任外とする。
- 提供形態が変わっても、利用者の明示的な判断と安全側終了の方針を維持する。

### 4.2 Profile と Account の共通要求

- 署名対象となる Profile、Account、Chain、Network の関係を曖昧にしてはならない。
- 利用者が署名に使用する Account を確認・選択できなければならない。
- 秘密情報を利用できない状態では署名してはならない。
- dApp へ公開する情報は利用者が許可した公開情報に限定し、秘密鍵や Mnemonic を公開してはならない。
- Profile、Account、lock / unlock、backup / restore の具体的な操作と保存条件は、`symbol-nem-wallet-core` の契約および既存の Profile / Account 仕様と整合させる。

## 5. 共通機能要求

### CR-001 署名要求の受付

**MUST** 対象範囲内の dApp から署名要求を受け付け、利用者が判断する Signer の確認領域へ渡さなければならない。

根拠: コンセプト 3、6.1、8。参考: `docs/specifications/product-spec.md` 2、5、12。

### CR-002 署名対象の確認

**MUST** 利用者が少なくとも、署名対象、対象チェーン、対象ネットワーク、Signer が確認できる範囲の影響を確認できなければならない。

トランザクションは、対応範囲内の全体を確認できるように解析し、資産移動、権限変更、その他の状態変更に関わる情報を確認できない場合は署名へ進めてはならない。

具体的な表示項目、transaction type ごとの表示、raw data の表現は後続仕様で決定する。表示できない情報を利用者の自己責任で補完させてはならない。

根拠: コンセプト 3、4、6.2、11。参考: `docs/specifications/product-spec.md` 3、12。

### CR-003 明示的な承認または拒否

**MUST** 署名要求ごとに、利用者が明示的に承認または拒否できなければならない。承認前に署名を開始してはならない。

根拠: コンセプト 3、4、6.3、11。

### CR-004 blind signing の禁止

**MUST** Signer が理解・確認できない要求、対象範囲外の要求、検証できない要求を署名してはならない。警告を表示するだけで未解析の要求を許可してはならない。

拒否、判断不能、対象外、検証失敗の場合は、署名結果を返さず安全に終了する。

根拠: コンセプト 3、8、10、11、13。参考: `_snwc/README.md` の「Blind signing の防止」、`docs/specifications/product-spec.md` 3、12.3。

### CR-005 チェーンとネットワークの区別

**MUST** Symbol と NEM、Mainnet と Testnet をそれぞれ区別し、要求、Account、Profile、署名対象の整合性を確認しなければならない。

具体的な transaction schema、署名 byte 列、鍵導出、network constant は `docs/specifications/chain-compatibility-spec.md` および後続仕様で管理する。

根拠: コンセプト 8、11、12。参考: `docs/specifications/chain-compatibility-spec.md`。

### CR-006 署名結果の検証可能性

**MUST** 署名結果が元の要求、対象チェーン、対象ネットワーク、署名者と対応していることを確認できる形で返さなければならない。dApp は受け取った署名結果を独立して確認し、必要なネットワーク処理を自ら行う。

結果の具体的な型、データ形式、エラー表現は後続仕様で決定する。MosaicLynx は dApp に代わって announce してはならない。

根拠: コンセプト 6.4、7、9、11、13、14。参考: `docs/specifications/web-transaction-handoff-spec.md` 2、6。

### CR-007 共通の署名接点

**MUST** dApp 開発者が、ブラウザ拡張機能とスマホアプリの提供形態差異を、利用者向け署名連携として個別に扱わずに済む共通の署名接点を提供する方向性を持たなければならない。

本要求は API 名、引数、データ形式、transport 選択、fallback を確定しない。プラットフォームごとに必要な差異は、各プラットフォーム要件で明示する。

根拠: コンセプト 2、3、4、5、7、8。参考: `docs/specifications/web-transaction-handoff-spec.md` 1、2。

### CR-008 秘密情報の分離

**MUST** 秘密鍵、Mnemonic、Profile password、復号済み backup、署名に必要な秘密情報を、dApp、Web ページ、Relay へ公開してはならない。

秘密情報の保存、復号、鍵導出、backup 形式は、本書で再定義せず、`symbol-nem-wallet-core` の契約、Profile / Account 仕様、OS・Extension 固有要件に従う。

根拠: コンセプト 4、7、9、11、13。参考: `_snwc/README.md`、`docs/specifications/profile-account-spec.md`。

### CR-009 利用者が管理する Account

**MUST** 利用者が署名に用いる Account を確認・選択でき、dApp へ公開する Account の範囲を利用者の許可なしに拡大してはならない。

接続許可の識別単位、公開情報の具体的な契約、Account の表示方法は後続仕様で決定する。

根拠: コンセプト 5、7、11、13。参考: `docs/specifications/product-spec.md` 3、11。

### CR-010 共通の安全側失敗

**MUST** 認証、対象確認、チェーン・ネットワーク整合性、署名対象検証、署名結果検証のいずれかに失敗した場合、署名結果を返さず安全側に終了しなければならない。

根拠: コンセプト 3、8、11、13、14。参考: `docs/specifications/product-spec.md` 3、12、`docs/specifications/web-transaction-handoff-spec.md` 7、13。

### CR-011 Platform 間の責任境界維持

**MUST** ブラウザ拡張機能、Android アプリ、iOS アプリ、Relay の各 milestone で、利用者の明示的な判断、秘密情報保護、blind signing の禁止、dApp の独立検証、announce 非対応の責任境界を維持しなければならない。

機能や操作が完全に同一でない場合でも、共通の安全要求を満たす範囲でプラットフォーム差異を認める。

根拠: コンセプト 1、6.5、9、11、12、14。コンセプトレビュー CS-003。

### CR-012 共通の失敗結果

**MUST** 拒否、対象不一致、検証失敗、認証失敗、利用不能、wallet-core 失敗など、署名を完了できない場合に、署名結果を成功として返してはならない。呼び出し側が安全に処理できる失敗結果を返し、秘密情報や過剰な内部情報を含めてはならない。

失敗の分類、公開エラーコード、再試行条件は後続仕様で決定する。

## 6. 共通の非機能・セキュリティ要求

### CR-NFR-001 外部入力を信頼しない

**MUST** dApp、Web ページ、Relay、ネットワーク、Provider、Mobile アプリ、wallet-core Binding など外部境界から受け取る入力を、検証前に信頼してはならない。

### CR-NFR-002 秘密情報を不要に複製・出力しない

**MUST** 秘密情報をログ、例外、warning、診断情報、URL、Web ページ、Relay へ不要に含めてはならない。プラットフォーム側の一時的な入力仲介が発生する場合も、継続保存・公開主体になってはならない。

根拠: コンセプト 9、13。参考: `AGENTS.md`、`_snwc/README.md`、`_snwc/docs/decisions/binding-implementation.md`。

### CR-NFR-003 署名前の再確認

**MUST** 署名直前に、利用者が確認・承認した対象と、実際に署名へ渡す対象の対応を確認できなければならない。確認後に対象が変化した場合は署名してはならない。

具体的な revision、digest、request ID、timeout、状態遷移は後続仕様で決定する。

根拠: コンセプト 6.2、6.3、11、13。参考: `_snwc/README.md` の「表示対象と署名対象の同一性」、`docs/specifications/product-spec.md` 12。

### CR-NFR-004 wallet-core の失敗を安全に扱う

**MUST** `symbol-nem-wallet-core` の失敗、警告、Binding エラー、Store 検証失敗を無視して署名を継続してはならない。失敗時は署名結果を返さず、秘密情報をエラーや診断情報へ含めず、利用者に判断可能な範囲の結果を返す。

wallet-core の stable error code、warning、Binding 契約の詳細は wallet-core 側の正本に従う。

### CR-NFR-005 Symbol / NEM の相互運用性

**MUST** Symbol と NEM の導出、address、transaction、署名処理を暗黙に共通化してはならない。対応範囲内の要求と結果は、対象チェーンの承認済み仕様・固定 vector・wallet-core 契約に従わなければならない。

### CR-NFR-006 Mainnet の公開制御

**MUST** Mainnet は、対象 platform に必要な release evidence、セキュリティ確認、承認が整うまで一般利用可能にしてはならない。詳細な evidence 項目、security gate、承認者、公開手順、CI/CD、テストケースは `OPEN-005` として後続のリリース設計へ引き継ぐ。

根拠: コンセプト 12、14、15。参考: `docs/adr/0001-mainnet-evidence-lite.md`、`docs/release/mainnet-release-evidence.md`。

### CR-NFR-007 利用者判断可能性

**MUST** 署名確認の提示は、一般ユーザーが要求を理解・確認し、承認または拒否できるものでなければならない。Signer が確認できない内容を、ユーザーの自己責任だけで補完させてはならない。

表示レイアウト、文言、支援技術、表示の詳細粒度はプラットフォーム要件・利用者検証・後続仕様で決定する。

## 7. 共通の対象外

MosaicLynx v1 の共通対象外は次のとおりとする。

- 残高、履歴、トークン、ネームスペースなどの資産管理。
- ノードの選択、ノードリスト管理、署名済みトランザクションの announce、継続的なネットワーク状態管理。
- 利用者の確認を省略する自動署名、永続的な署名許可、blind signing。
- 理解・確認できない要求を、警告だけを理由に署名すること。
- MosaicLynx 自身による dApp の企画、開発、運営、利用者獲得。
- 組織向け監査・統制・カストディ保証を v1 の第一対象または完了条件とすること。
- ハードウェアウォレット、コールドウォレット、企業カストディと同等の保証を標榜すること。
- Relay による署名対象の意味解釈、署名、秘密情報の取り扱い、announce、長期保管。

## 8. 共通の成功条件・受け入れ条件

MosaicLynx v1 は、一般ユーザーの安全な署名判断、秘密情報の分離、提供形態間の責任境界が確認できた状態を成功とする。本章は要件レベルの成功条件・受け入れ条件であり、個別テストケースや UI 仕様ではない。

| ID        | 受け入れ可能な状態                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| CR-AC-001 | 一般ユーザーが、署名対象、チェーン、ネットワーク、確認可能な影響を確認したうえで、要求ごとに承認または拒否できる。 |
| CR-AC-002 | 理解できない、対象外、検証不能な要求が署名されず、署名結果を返さずに安全に終了する。                               |
| CR-AC-003 | 秘密情報が dApp、Web ページ、Relay、ログ、例外、診断情報へ不要に公開されない。                                     |
| CR-AC-004 | Symbol / NEM と Mainnet / Testnet の不一致が署名前に検出され、誤った対象へ署名されない。                           |
| CR-AC-005 | dApp が署名結果を独立して確認でき、MosaicLynx が announce、ノード選択、継続的な状態管理を行わない。                |
| CR-AC-006 | 4 milestone 全体で、明示的承認、安全側失敗、秘密情報保護、責任境界が維持される。                                   |
| CR-AC-007 | wallet-core の失敗または Store / Binding の不整合時に署名が継続されず、秘密情報が漏えいしない。                    |
| CR-AC-008 | Mainnet は必要な release gate を通過するまで有効化されない。                                                       |

## 9. 共通の未決事項

### OPEN-001：中心課題の実在性と現在の回避方法

- 論点: 一般ユーザーが署名対象と秘密情報の境界を判断しにくいという課題が、どの場面でどの程度発生しているか。また、現在どのような手段で回避されているか。
- 扱い: 既存手段、想定利用場面、課題仮説を可能な範囲で確認する。未確認部分は検証前の仮説として追跡し、必要に応じて要件定義中および初期 milestone でも検証する。未完了であることだけを理由に要件定義全体を停止しない。
- 影響: 根拠不足の仮説を確定要求へ昇格させる前に、根拠状態を追跡する。

### OPEN-002：一般ユーザーが必要とする確認情報

- 論点: 一般ユーザーが署名判断を完了するために、どの情報を確認できる必要があるか。
- 扱い: 要件では署名対象、チェーン、ネットワーク、影響の確認を求める。表示項目、表示粒度、transaction type 別の内容は利用者検証と後続仕様で決定する。
- 影響: `CR-002`、`CR-NFR-007`、`CR-AC-001` の具体化に影響する。

### OPEN-003：4 milestone の個別完了条件

- 論点: ブラウザ拡張機能、Android アプリ、iOS アプリ、Relay が、それぞれ何を提供できれば個別 milestone / release を完了し、次へ進めるか。
- 確定済み: 実施順序はブラウザ拡張機能 → Android → iOS → Relay。Relay milestone 完了を MosaicLynx v1 全体完了とする。
- 未決範囲: 各 milestone の外部要求、個別完了条件、次 milestone へ進む条件、必要な依存関係。順序そのものは未決ではない。

### OPEN-005：Mainnet 一般公開の詳細条件

- 論点: release evidence、セキュリティ確認、承認をどの証拠で満たしたと判定するか。
- 扱い: Mainnet は必要な gate を通過するまで有効化しない。具体的な evidence 項目、security checklist、承認者、CI/CD、公開手順、テストケースは後続の要件・リリース設計で決定する。

### FUTURE-001：組織向け監査・統制・カストディ保証の範囲

- 現在の扱い: 組織利用、監査、統制、カストディ保証は MosaicLynx v1 の初期対象外とし、v1 の完了条件に含めない。
- 将来の論点: 一般ユーザー向け提供の後、どこまで保証するか。
- 扱い: 現在の要件定義や v1 の進行・完了を妨げず、将来の組織向け展開時に改めて判断する。具体的な機能、要件、設計、保証範囲は現在決定しない。

### CR-OPEN-001：symbol-nem-wallet-core との統合境界

- 論点: MosaicLynx のどの範囲を `symbol-nem-wallet-core` に委譲し、既存の TypeScript chain adapter / profile-backup / signing 実装とどう責任分担するか。
- なぜ要件定義段階で決める必要があるか: 秘密情報、Wallet Store、鍵処理、raw byte 署名の正本を一つに定めないまま設計すると、暗号処理・署名処理・保存形式の二重実装や、異なる安全境界が生じる可能性がある。
- 主な選択肢: (A) wallet-core を鍵管理・Wallet Store・raw byte 署名の正本とし、MosaicLynx が解析・確認・権限・プラットフォーム境界を担う、(B) wallet-core を鍵管理・Wallet Store の正本とし、既存 TypeScript chain adapter と raw signing の接続を段階的に整理する、(C) milestone ごとに wallet-core への委譲範囲を段階化する。いずれも wallet-core の内部暗号を MosaicLynx 側で再実装しない。
- 後続設計まで保留可能か: API・Binding・移行方式を決める設計まで保留できる。ただし、Extension milestone の署名実装へ進む前に、採用する責任分担を決定する。

### CR-OPEN-002：wallet-core Binding と実行環境の責任境界

- 論点: Browser Extension、iOS、Android から wallet-core を利用する Binding、秘密情報の一時的な受け渡し、OS保護機能との境界をどこに置くか。
- なぜ要件定義段階で決める必要があるか: wallet-core の内部責任を上位アプリへ複製せず、各プラットフォームが秘密情報を継続保持・公開しないための受け入れ条件を明確にする必要がある。
- 主な選択肢: wallet-core の既存 Native / WASM Binding を利用する、プラットフォームごとの Binding を追加する、Binding を含む配布境界を別途定める。具体的な方式は設計で決定する。
- 後続設計まで保留可能か: Binding の具体方式は保留できる。各 platform の秘密情報ライフサイクルと失敗時の扱いは、当該 platform の詳細設計前に決定する。

## 10. 下流工程への引継ぎ

1. `CR-OPEN-001` で wallet-core と既存 TypeScript 実装の正本・委譲範囲を決定する。
2. `CR-OPEN-002` で各 platform の Binding と秘密情報ライフサイクルの境界を決定する。
3. `OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005` を各 platform 要件へ追跡する。実施順序は変更しない。
4. 共通要求を満たすために必要な API、データ形式、parser の詳細、エラー、状態遷移、暗号方式、UI、テストを、承認後の仕様・設計で決定する。
5. `FUTURE-001` は MosaicLynx v1 の要求・完了判定へ取り込まず、将来検討時まで保留する。

## 11. 参照資料

- `docs/concept/concept-sheet.md`
- `.agents/project-context.md`
- `AGENTS.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/architecture/architecture.md`
- `docs/adr/0001-mainnet-evidence-lite.md`
- `docs/release/mainnet-release-evidence.md`
- `_snwc/README.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
- `docs/reviews/concept/concept-sheet-review-001.md`
