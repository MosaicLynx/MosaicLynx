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
- **MUST NOT**: 対象範囲に含めてはならない要求または扱い。
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

| 主体                     | 共通要件上の位置付け                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| 一般ユーザー             | 第一対象。署名対象を確認し、承認または拒否する。                                                |
| dApp 開発者              | 主要な協力者。共通の署名接点を利用して、複数の提供形態で署名体験を提供する。                    |
| dApp                     | 署名要求を発行し、署名結果を独立して確認し、必要なネットワーク処理を行う外部主体。              |
| Relay                    | 署名要求をスマホアプリへ受け渡す基盤。署名、意味解釈、秘密情報の取り扱い、announce は担わない。 |
| 運用者                   | 提供環境、公開 build、リリースに必要な証跡を管理する関係者。                                    |
| `symbol-nem-wallet-core` | 鍵管理、Wallet Store、秘密情報を使用する暗号処理、raw byte signing の正本となるコンポーネント。 |

組織利用、カストディ利用、企業向け監査・統制は MosaicLynx v1 の第一対象ではない。将来の保証範囲は `FUTURE-001` として保留し、現在の要件定義や v1 完了の blocker としない。

## 3. v1、milestone、release の共通境界

`MosaicLynx v1` は、次の4 milestone 全体を指す。

1. ブラウザ拡張機能
2. Android アプリ
3. iOS アプリ
4. Relay

実施順序は上記の順で固定し、Relay milestone の完了を MosaicLynx v1 全体の完了とする。各 milestone は個別の milestone / release 単位として扱える。`Extension MVP` などの個別 release 名称を MosaicLynx v1 全体と同義にしない。

共通の安全な署名判断と責任境界は、各 milestone で維持する。各 milestone の外部要求、個別完了条件、次 milestone へ進む条件、依存関係は `OPEN-003` で決定する。実施順序は未決事項ではない。

### Signer と Relay の適用主体

- **Signer**: ブラウザ拡張機能、Android アプリ、iOS アプリ。署名対象の解析・確認、表示、Chain / Network / Account の確認、利用者の明示的な承認または拒否、blind signing の禁止、承認対象と実際の署名対象の一致確認、安全側失敗および署名処理を担う。
- **Relay**: 署名要求・署名結果の受け渡し基盤。署名対象の意味解釈、表示、利用者の承認・拒否、blind signing 判定および署名を担わず、Signer の安全条件を迂回、代替または弱体化させないことを担う。詳細は [Relay 要件](./relay.md) に定める。
- **End-to-End**: dApp、Signer、Relay を通る全体。要求元・許可範囲、要求内容、鮮度、再利用防止および署名結果の対応を確認でき、Relay の障害・侵害・重複・遅延が意図しない署名につながらないことを確認する。

Relay milestone の完了条件は、Relay 自身が利用者判断や署名を実行することではなく、Relay 経由でも Signer の安全条件が迂回されず、要求・結果の受け渡し責任が成立することで判定する。

## 4. 共通の対象範囲

### 4.1 共通で提供する能力

MosaicLynx 全体は、プラットフォームにかかわらず、少なくとも次の能力を提供しなければならない。以下のうち、解析・表示・承認・拒否・署名を直接担うのは Signer であり、Relay はそれらを実行せず、受け渡しによって安全条件を迂回させない。

- dApp からのメッセージまたはトランザクションの署名要求を受け付ける。
- transaction signing と message signing を、ブラウザ拡張機能、Android、iOS の各 Signer に共通する署名操作として提供する。
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

MosaicLynx / Application は、アプリケーション上の Profile、Account の表示・選択・関連付け、Chain / Network 設定、dApp 権限、UI、platform integration および wallet-core を利用する orchestration を担当する。`symbol-nem-wallet-core` は、鍵管理、Wallet Store、秘密情報を使用する暗号処理、raw byte signing を担当する。両者を同じ責任主体として扱ってはならない。

`symbol-nem-wallet-core` が Wallet Store 内部の Profile 単位で操作する場合も、それを MosaicLynx / Application の Profile 全体の管理責任とは扱わない。Profile 全体の backup / restore、export / import、migration、merge / overwrite および保存方法は、MosaicLynx v1 の共通 MUST または共通完了条件として確定しない。これらの責任分担と具体方式は、将来その機能を扱う段階で決定する。

## 5. 共通機能要求

### CR-001 署名要求の受付（Signer / End-to-End）

**MUST** 対象範囲内の dApp から署名要求を受け付け、利用者が判断する Signer の確認領域へ渡さなければならない。

根拠: コンセプト 3、6.1、8。参考: `docs/specifications/product-spec.md` 2、5、12。

### CR-002 署名対象の確認（Signer）

**MUST** 利用者が少なくとも、署名対象、対象チェーン、対象ネットワーク、Signer が確認できる範囲の影響を確認できなければならない。

トランザクションは、対応範囲内の全体を確認できるように解析し、資産移動、権限変更、その他の状態変更に関わる情報を確認できない場合は署名へ進めてはならない。

具体的な表示項目、transaction type ごとの表示、raw data の表現は後続仕様で決定する。表示できない情報を利用者の自己責任で補完させてはならない。

根拠: コンセプト 3、4、6.2、11。参考: `docs/specifications/product-spec.md` 3、12。

### CR-003 明示的な承認または拒否（Signer）

**MUST** 署名要求ごとに、利用者が明示的に承認または拒否できなければならない。承認前に署名を開始してはならない。

根拠: コンセプト 3、4、6.3、11。

### CR-004 blind signing の禁止（Signer）

**MUST** Signer が理解・確認できない要求、対象範囲外の要求、検証できない要求を署名してはならない。警告を表示するだけで未解析の要求を許可してはならない。

拒否、判断不能、対象外、検証失敗の場合は、署名結果を返さず安全に終了する。

根拠: コンセプト 3、8、10、11、13。参考: `_snwc/README.md` の「Blind signing の防止」、`docs/specifications/product-spec.md` 3、12.3。

### CR-005 チェーンとネットワークの区別（Signer / End-to-End）

**MUST** Symbol と NEM、Mainnet と Testnet をそれぞれ区別し、要求、Account、Profile、署名対象の整合性を確認しなければならない。

具体的な transaction schema、署名 byte 列、鍵導出、network constant は `docs/specifications/chain-compatibility-spec.md` および後続仕様で管理する。

根拠: コンセプト 8、11、12。参考: `docs/specifications/chain-compatibility-spec.md`。

### CR-006 署名結果の検証可能性（End-to-End / dApp）

**MUST** 署名結果が元の要求、対象チェーン、対象ネットワーク、署名者と対応していることを確認できる形で返さなければならない。dApp は受け取った署名結果を独立して確認し、必要なネットワーク処理を自ら行う。

結果の具体的な型、データ形式、エラー表現は後続仕様で決定する。MosaicLynx は dApp に代わって announce してはならない。

根拠: コンセプト 6.4、7、9、11、13、14。参考: `docs/specifications/web-transaction-handoff-spec.md` 2、6。

### CR-007 共通の署名接点と署名操作

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

対応する message format の範囲、表示・解釈の具体的な規則は後続の message signing / SSO / handoff 仕様で決定する。UTF-8、JSON、CBOR、schema、MIME type、prefix、domain separator、challenge、nonce、timestamp、canonicalization、encoding、SSO protocol、OAuth / OIDC その他の具体方式は本要求で確定しない。既存の `docs/specifications/web-transaction-handoff-spec.md` に message signing を対象外とする記述があるため、本要件で確定した v1 共通 MUST を優先し、仕様側は後続工程で整合させる。

API 名、関数名、引数、payload、transport、result type、error code および fallback の具体形式は後続仕様へ委ねる。利用者拒否、未対応 operation / format、検証不能その他の安全側失敗を、別の署名操作の成功として返してはならない。

根拠: コンセプト 2、3、4、5、7、8。参考: `docs/specifications/product-spec.md` 2、3、5、12、`docs/specifications/web-transaction-handoff-spec.md` 1、2。

### CR-008 秘密情報の分離

**MUST** 秘密鍵、Mnemonic、Profile password、復号済み backup、署名に必要な秘密情報を、dApp、Web ページ、Relay、URL、ログ、例外、warning、診断情報、外部通信または継続保存領域へ不要に公開・保持してはならない。

秘密情報の保存、復号、鍵導出および raw byte signing は `symbol-nem-wallet-core` の契約を正本とする。MosaicLynx 側で wallet-core 内部の鍵管理、Wallet Store、秘密情報を使用する暗号処理、raw signing を再実装してはならない。Profile 全体の backup / restore や backup 形式は本書で確定せず、MosaicLynx v1 の共通 MUST ともしない。

根拠: コンセプト 4、7、9、11、13。参考: `_snwc/README.md`、`docs/specifications/profile-account-spec.md`。

### CR-009 利用者が管理する Account（Signer）

**MUST** 利用者が署名に用いる Account を確認・選択でき、dApp へ公開する Account の範囲を利用者の許可なしに拡大してはならない。

接続許可の識別単位、公開情報の具体的な契約、Account の表示方法は後続仕様で決定する。

根拠: コンセプト 5、7、11、13。参考: `docs/specifications/product-spec.md` 3、11。

### CR-010 共通の安全側失敗（Signer / End-to-End）

**MUST** 認証、対象確認、チェーン・ネットワーク整合性、署名対象検証、署名結果検証のいずれかに失敗した場合、署名結果を返さず安全側に終了しなければならない。

根拠: コンセプト 3、8、11、13、14。参考: `docs/specifications/product-spec.md` 3、12、`docs/specifications/web-transaction-handoff-spec.md` 7、13。

### CR-011 Platform 間の責任境界維持

**MUST** 主体ごとに次の責任境界を維持しなければならない。

- Signer（ブラウザ拡張機能、Android、iOS）は、署名対象の解析・表示、Chain / Network / Account の確認、利用者の明示的な承認または拒否、blind signing の禁止、承認対象と署名対象の一致確認、安全側失敗および署名処理を担う。
- Relay は、署名対象の意味解釈、表示、利用者の承認・拒否、blind signing 判定および署名を担わず、Signer の検証・承認・署名を迂回、代替または弱体化させない。
- dApp は、署名結果を独立して検証し、必要なネットワーク処理を担う。MosaicLynx は dApp に代わって announce、ノード選択または継続的なネットワーク状態管理を行わない。

機能や操作が完全に同一でない場合でも、Signer と Relay の適用主体を混同せず、共通の安全要求を満たす範囲でプラットフォーム差異を認める。Relay 固有の受け入れ条件は `docs/requirements/relay.md` に定める。

根拠: コンセプト 1、6.5、9、11、12、14。コンセプトレビュー CS-003。

### CR-012 共通の失敗結果

**MUST** 拒否、未対応 operation / format、要求元・許可範囲不一致、要求内容不一致、期限切れ、replay / duplicate 等による拒否、Chain / Network / Account 不一致、解析・表示不能、検証失敗、認証失敗、利用不能、wallet-core 失敗など、署名を完了できない場合に、署名結果を成功または別の署名操作の成功として返してはならない。dApp が成功とこれらの失敗を区別して安全に処理できる結果を返し、秘密情報や過剰な内部情報を含めてはならない。

失敗の分類、公開エラーコード、再試行条件は後続仕様で決定する。

### CR-013 Application と wallet-core の責任境界

**MUST** `symbol-nem-wallet-core` を、鍵管理、Wallet Store、秘密情報を使用する暗号処理および raw byte signing の正本として扱わなければならない。MosaicLynx / Application は、Profile、Account の表示・選択・関連付け、Chain / Network 設定、dApp 接続・権限、UI、利用者の承認・拒否、platform integration、Relay 連携および署名処理の orchestration を担当しなければならない。

既存 TypeScript 実装のうち wallet-core と責任が重複する処理を正本として扱ってはならない。ただし、transaction / message の解析、Symbol / NEM の表示用変換、UI、dApp 接続・権限管理、platform 固有処理、Relay 連携その他の Application 層の処理は、wallet-core の責任外として MosaicLynx 側に残す。

wallet-core の API、Binding、FFI、WASM / Native、React Native 連携、既存実装からの移行手順および error mapping の具体方式は後続設計へ委ねる。

### CR-014 Profile 全体 backup / restore の共通要件外化

**MUST NOT** Profile 全体の backup / restore、export / import、Profile ID の重複判定、merge / overwrite、migration、backup password または backup の保存方法を、MosaicLynx v1 の共通 MUST または共通完了条件として扱ってはならない。

将来 Profile backup 機能を扱う場合の Application と wallet-core の責任分担、Wallet Store の扱い、復元範囲および具体方式は、その機能を対象とする後続の要件・仕様で決定する。既存仕様書に記載された Profile 全体 backup / restore は、現時点の MosaicLynx v1 共通要求へ自動的に取り込まない。

## 6. 共通の非機能・セキュリティ要求

### CR-NFR-001 外部入力を信頼しない

**MUST** dApp、Web ページ、Relay、ネットワーク、Provider、Mobile アプリ、wallet-core Binding など外部境界から受け取る入力を、検証前に信頼してはならない。

### CR-NFR-002 秘密情報を不要に複製・出力しない

**MUST** 秘密情報をログ、例外、warning、診断情報、URL、Web ページ、Relay、外部通信または継続保存領域へ不要に含めてはならない。プラットフォーム側の一時的な入力仲介が発生する場合も、継続保存・公開主体になってはならない。

根拠: コンセプト 9、13。参考: `AGENTS.md`、`_snwc/README.md`、`_snwc/docs/decisions/binding-implementation.md`。

### CR-NFR-003 署名前の再確認（Signer）

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

### CR-NFR-007 利用者判断可能性（Signer）

**MUST** 署名確認の提示は、一般ユーザーが要求を理解・確認し、承認または拒否できるものでなければならない。Signer が確認できない内容を、ユーザーの自己責任だけで補完させてはならない。

表示レイアウト、文言、支援技術、表示の詳細粒度はプラットフォーム要件・利用者検証・後続仕様で決定する。

### CR-NFR-008 要求元と許可範囲の対応（Signer / End-to-End）

**MUST** Signer は、署名要求が許可した要求元、現在有効な接続、現在有効な署名セッションまたは許可された権限範囲のうち、適用されるコンテキストと対応していることを確認できなければならない。対応を確認できない要求は署名してはならない。

すべての dApp に暗号学的な本人認証を必須化することは本要求に含めない。Browser Extension の Origin・Provider connection、Mobile / Relay の handoff session などの具体方式は後続仕様で決定する。Relay はこの対応関係を独自に解釈・承認せず、別の要求元・セッション・権限範囲へ置換してはならない。

### CR-NFR-009 要求内容の完全性と承認対象の一致（Signer / End-to-End）

**MUST** 利用者が確認・承認した要求と、実際に署名する対象が一致していなければならない。要求の改ざん、差し替え、承認後の内容変更、別要求との取り違え、別 Account / Chain / Network への置換を検出または確認できない場合は署名してはならない。

具体的な digest、request ID、署名、MAC その他の方式は後続仕様へ委ねる。Relay では `RR-003`、`RR-005` および `RR-007` と整合させる。

### CR-NFR-010 要求の鮮度（Signer / End-to-End）

**MUST** Signer は、期限切れ、失効済みまたは現在の署名処理として有効でない要求を署名してはならない。Relay の復旧や再配送によって、無効な要求を有効な要求として扱ってはならない。

具体的な TTL、期限値、失効条件および timestamp の形式は後続仕様へ委ねる。Relay では `RR-004` および `RR-006` と整合させる。

### CR-NFR-011 Replay・重複・遅延配送の拒否（Signer / End-to-End）

**MUST** 古い要求の replay、使用済み要求の再利用、同一要求の重複配送、ネットワークまたは Relay による重複、遅延した要求の後着、過去セッションの要求の再出現によって、追加の署名が発生してはならない。

具体的な nonce、request ID、保存方式および状態管理方式は後続仕様へ委ねる。Relay では `RR-006` および `RR-007` と整合させる。

### CR-NFR-012 署名結果と元要求の対応（End-to-End / dApp）

**MUST** 署名結果は、元の署名要求、署名者、Account、Chain および Network に対応していることを確認できなければならない。dApp は受け取った署名結果を独立して検証し、Relay または Provider が成功を返したことだけを署名結果の正当性の根拠としてはならない。

具体的な結果形式、対応付け方式および error code は後続仕様へ委ねる。Relay では `RR-002`、`RR-005` および `RR-007` と整合させる。

## 7. 共通の対象外

MosaicLynx v1 の共通対象外は次のとおりとする。

- 残高、履歴、トークン、ネームスペースなどの資産管理。
- ノードの選択、ノードリスト管理、署名済みトランザクションの announce、継続的なネットワーク状態管理。
- 利用者の確認を省略する自動署名、永続的な署名許可、blind signing。
- 理解・確認できない要求を、警告だけを理由に署名すること。
- MosaicLynx 自身による dApp の企画、開発、運営、利用者獲得。
- 組織向け監査・統制・カストディ保証を v1 の第一対象または完了条件とすること。
- ハードウェアウォレット、コールドウォレット、企業カストディと同等の保証を標榜すること。
- Profile 全体の backup / restore を v1 の共通 MUST または共通完了条件とすること。
- Relay による署名対象の意味解釈、署名、秘密情報の取り扱い、announce、長期保管。

## 8. 共通の成功条件・受け入れ条件

MosaicLynx v1 は、一般ユーザーの安全な署名判断、秘密情報の分離、提供形態間の責任境界が確認できた状態を成功とする。以下は主要な MUST と、適用主体、成功時に外部または責任境界から確認できる状態、拒否・失敗時の安全側結果を対応付ける最小限の traceability である。個別テストケース、テストデータ、証拠形式および UI 操作手順は後続工程で定義する。

| 受入 ID   | 関連要求                                       | 適用主体                           | 成功時に確認できる状態                                                                                                                                                                               | 拒否・失敗時に確認できる安全側結果                                                                                |
| --------- | ---------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| CR-AC-001 | `CR-002`, `CR-003`, `CR-NFR-003`, `CR-NFR-007` | Signer                             | 利用者が署名対象、Chain、Network、確認可能な影響を確認し、要求ごとに明示的に承認または拒否でき、承認対象と実際の署名対象が対応している。                                                             | 表示・解析不能、明示的承認なし、確認後の対象変更または判断不能の場合は署名しない。                                |
| CR-AC-002 | `CR-004`                                       | Signer                             | Signer が理解・確認できる要求だけが署名対象となり、blind signing が行われない。                                                                                                                      | 理解不能、対象外または検証不能な要求は警告だけで継続せず、署名結果を返さず終了する。                              |
| CR-AC-003 | `CR-005`, `CR-009`, `CR-NFR-005`               | Signer / End-to-End                | Symbol / NEM、Mainnet / Testnet、Account、Profile および署名対象の整合性を確認でき、利用者が署名 Account を選択・確認できる。                                                                        | Chain、Network、Account または許可範囲が不一致・確認不能な場合は署名しない。                                      |
| CR-AC-004 | `CR-006`, `CR-NFR-012`                         | End-to-End / dApp                  | dApp が、署名結果と元要求、署名者、Account、Chain、Network の対応を確認し、署名結果を独立して検証できる。                                                                                            | 対応を確認できない結果、受け渡し成功だけの結果または不正な結果は成功扱いせず、必要なネットワーク処理へ進めない。  |
| CR-AC-005 | `CR-007`, `CR-007-TX`                          | Signer                             | Browser Extension、Android、iOS の各 Signer が transaction signing を提供し、対応範囲内の transaction 全体と確認可能な影響を利用者へ提示できる。                                                     | transaction 全体、Chain / Network / Account または影響を確認できない場合は署名しない。                            |
| CR-AC-006 | `CR-007`, `CR-007-MSG`                         | Signer                             | Browser Extension、Android、iOS の各 Signer が message signing を提供し、message 内容、message signing であること、適用される Chain / Network / Account および実際の署名対象を確認できる。           | raw bytes の羅列だけでは確認済みとせず、解釈不能、表示不能、内容不一致または未対応 format は署名しない。          |
| CR-AC-007 | `CR-008`, `CR-NFR-002`                         | 全体 / 責任境界                    | 秘密情報が dApp、Web page、Relay、URL、ログ、例外、warning、診断情報、外部通信または継続保存領域へ不要に公開・保持されない。                                                                         | 秘密情報の境界を維持できない場合は処理を継続せず、秘密情報を結果・エラー・診断情報へ返さない。                    |
| CR-AC-008 | `CR-NFR-006`                                   | Platform / Release                 | Mainnet は必要な release gate を通過するまで一般利用可能な署名能力として有効化されない。                                                                                                             | gate 未達成の場合は Mainnet 署名を有効化せず、公開可として扱わない。                                              |
| CR-AC-009 | `CR-011`                                       | Signer / Relay / dApp              | Signer が解析・表示・承認・署名を担い、Relay が受け渡しだけを担い、dApp が署名結果を独立して検証する責任境界が維持される。                                                                           | Relay による検証・承認・署名の迂回、代替または弱体化がある場合は署名を継続しない。                                |
| CR-AC-010 | `CR-013`, `CR-NFR-004`                         | Application / wallet-core / Signer | Profile、表示・承認、platform integration、Relay 連携、orchestration と、鍵管理、Wallet Store、秘密情報処理、raw signing の責任境界を確認できる。wallet-core の失敗も Application 側で安全に扱える。 | 責任境界が不明確、wallet-core が失敗または Store / Binding が不整合な場合は署名を継続せず、秘密情報を漏らさない。 |
| CR-AC-011 | `CR-NFR-008`                                   | Signer / End-to-End                | 要求が許可した要求元、現在有効な接続・署名セッションまたは許可された権限範囲と対応していることを確認できる。                                                                                         | 要求元・接続・セッション・許可範囲との対応を確認できない場合は署名しない。                                        |
| CR-AC-012 | `CR-NFR-009`                                   | Signer / End-to-End                | 利用者が確認・承認した要求と実際に署名する対象が一致し、Account、Chain、Network の置換や承認後の内容変更がないことを確認できる。                                                                     | 改ざん、差し替え、取り違えまたは不一致を確認できない場合は署名しない。                                            |
| CR-AC-013 | `CR-NFR-010`                                   | Signer / End-to-End                | 現在の署名処理として有効な要求だけが処理され、Relay の復旧・再配送だけで無効な要求が有効にならない。                                                                                                 | 期限切れ、失効済みまたは有効性を確認できない要求は拒否し、署名しない。                                            |
| CR-AC-014 | `CR-NFR-011`                                   | Signer / End-to-End                | replay、使用済み要求の再利用、重複・遅延配送または過去セッションの再出現によって追加の署名が発生しない。                                                                                             | 再利用、重複、遅延または過去セッションとの対応を確認できない要求は署名しない。                                    |
| CR-AC-015 | `CR-007`, `CR-012`                             | End-to-End / dApp                  | dApp が提供形態・transport の差異を越えて transaction signing / message signing を要求し、成功、利用者拒否、未対応、検証失敗その他の安全側失敗を区別して扱える。                                     | 未対応 operation / format、利用者拒否または検証不能を、別 operation の成功や署名成功として扱わない。              |
| CR-AC-016 | `CR-001`, `CR-NFR-001`                         | Signer / End-to-End                | 外部要求が検証前に信頼されず、対象範囲内の dApp から Signer の確認領域へ安全性の確認対象として渡される。                                                                                             | 要求元、入力または受け渡しを検証できない場合は署名要求として処理せず、署名結果を成功として返さない。              |

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

### CR-OPEN-001：wallet-core との具体的統合方式

- 確定事項: `symbol-nem-wallet-core` は、鍵管理、Wallet Store、秘密情報を使用する暗号処理および raw byte signing の正本である。MosaicLynx / Application は Profile、表示・承認、dApp 接続・権限、platform integration、Relay 連携および orchestration を担当する。この責任境界自体は未決事項ではない。
- 論点: 確定した責任境界を、各 platform から利用する具体的な API、Binding、FFI、WASM / Native、React Native 連携、既存 TypeScript 実装からの移行および error mapping へどう反映するか。
- なぜ要件定義段階で決める必要があるか: 各 platform の署名実装へ進む前に、wallet-core の正本を二重実装せず、Application 層の処理だけを適切に接続する境界を設計へ引き継ぐ必要があるため。
- 主な選択肢: wallet-core の既存 Binding を利用する、platform ごとの Binding を追加する、既存 TypeScript 実装から段階的に接続を移行する。具体的な採用方式は本書で決定しない。
- 後続設計まで保留可能か: 具体的な統合方式、移行手順および error mapping は保留可能。ただし、wallet-core を正本とする責任境界を変更せずに設計する。

### CR-OPEN-002：wallet-core Binding と実行環境の責任境界

- 論点: Browser Extension、iOS、Android から wallet-core を利用する Binding、秘密情報の一時的な受け渡し、OS保護機能との境界をどこに置くか。
- なぜ要件定義段階で決める必要があるか: wallet-core の内部責任を上位アプリへ複製せず、各プラットフォームが秘密情報を継続保持・公開しないための受け入れ条件を明確にする必要がある。
- 主な選択肢: wallet-core の既存 Native / WASM Binding を利用する、プラットフォームごとの Binding を追加する、Binding を含む配布境界を別途定める。具体的な方式は設計で決定する。
- 後続設計まで保留可能か: Binding の具体方式は保留できる。各 platform の秘密情報ライフサイクルと失敗時の扱いは、当該 platform の詳細設計前に決定する。

## 10. 下流工程への引継ぎ

1. `CR-OPEN-001` で、確定した責任境界に沿った wallet-core の具体的な統合方式を決定する。
2. `CR-OPEN-002` で各 platform の Binding と秘密情報ライフサイクルの境界を決定する。
3. Profile 全体の backup / restore は v1 共通要求へ取り込まず、将来その機能を扱う段階で Application と wallet-core の責任分担を決定する。
4. `OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005` を各 platform 要件へ追跡する。実施順序は変更しない。
5. 共通要求を満たすために必要な API、データ形式、parser の詳細、エラー、状態遷移、暗号方式、UI、テストを、承認後の仕様・設計で決定する。
6. `FUTURE-001` は MosaicLynx v1 の要求・完了判定へ取り込まず、将来検討時まで保留する。

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
