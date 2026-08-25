# MosaicLynx SDK 要件定義書

## 1. 文書の目的と位置付け

本書は、MosaicLynx を外部アプリケーションおよび Web アプリケーションから利用するための SDK に固有の要求を定める。SDK は MosaicLynx 本体の Signer ではなく、外部アプリケーションと MosaicLynx の接続・連携を安全かつ一貫した形で扱う統合層として位置付ける。

本書は [MosaicLynx 共通要件](./requirements.md) を SDK の適用範囲へ具体化する補足要件である。Signer の署名可否、利用者確認、秘密情報の処理および Relay の受け渡し責任を SDK へ移すものではない。

本書で定めないものは、公開 API の型・関数・クラス、データ形式、URL、RPC または WebSocket のメッセージ、Deep Link 形式、暗号アルゴリズム、暗号パラメータ、状態遷移、package 分割、build 構成および実装ライブラリである。これらは、承認済み要件を満たす後続の仕様・設計で定める。

### 1.1 要求の表記

- **MUST**: SDK の対象範囲に含まれる場合、満たさなければならない要求。
- **MUST NOT**: SDK が指定された行為または状態を成立させてはならない要求。
- **SHOULD**: 原則として満たすべき重要な要求。満たせない場合は理由と影響を記録する。
- **MAY**: v1 の成立条件ではないが、他の要求に反しない範囲で許容される事項。

## 2. SDK の位置付けと対象利用者

### 2.1 SDK が解決する課題

外部アプリケーションが MosaicLynx を利用する際、Browser Extension、将来の Mobile App、Relay など提供形態ごとの差異を個別に実装すると、接続、要求の受け渡し、結果の解釈、失敗処理および安全境界が分断される。SDK はこの統合上の差異を、Signer の安全条件を弱めない範囲で吸収する。

SDK が提供する価値は、外部アプリケーションが次を一貫して扱えることである。

- MosaicLynx の利用可能性と対応能力を確認する。
- 利用者が許可した公開アカウントと Chain / Network の文脈を扱う。
- 署名要求を適切な MosaicLynx の提供形態へ渡す。
- 成功、利用者拒否、未対応および安全側の失敗を区別する。
- 署名結果を元の要求との対応を含めて確認し、外部アプリケーションへ返す。

### 2.2 対象利用者と責任主体

| 主体                        | SDK 要件上の位置付け                                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 一般ユーザー                | SDK の直接利用者ではない。MosaicLynx 側の確認領域で署名対象を確認し、要求ごとに承認または拒否する。                                         |
| dApp / 外部アプリケーション | SDK の主要な利用者。要求を生成し、SDK の結果を受け取り、必要な検証・ネットワーク処理を行う。                                                |
| dApp 開発者                 | 主要な統合者。提供形態ごとの差異を個別に扱わず、MosaicLynx の共通連携を利用する。                                                           |
| Browser Extension           | SDK が接続する Signer の一つ。要求元、許可、表示、承認、署名および Extension 内の秘密情報境界を管理する。                                   |
| Mobile App                  | 将来 milestone の Signer。外部要求の検証、表示、利用者の承認、署名および端末側の秘密情報境界を管理する。                                    |
| Relay                       | Mobile 連携時の受け渡し基盤。SDK は必要なクライアント側連携を行い得るが、Relay サーバーは署名、意味解釈、承認および秘密情報処理を担わない。 |
| Wallet Core                 | 鍵管理、Wallet Store、秘密情報を使用する暗号処理および raw signing の正本。SDK はこの責務を代替しない。                                     |

## 3. スコープ

### 3.1 SDK が責任を持つ範囲

SDK は、承認済みの MosaicLynx 連携契約が提供する範囲で、次を責任範囲とする。

- 外部アプリケーションから MosaicLynx への接続・連携の抽象化。
- MosaicLynx の利用可能性、対応能力および互換性の確認。
- 外部アプリケーションの要求を、Signer が検証・確認できる要求として生成または受け渡すこと。
- Browser Extension、Mobile App、Relay などの提供形態差異を、共通の意味が保たれる範囲で吸収すること。
- 公開アカウント情報、要求結果および署名結果の受信・解釈・正規化。
- 要求と結果、要求元、接続・署名文脈、Chain / Network の対応確認。
- 利用者拒否、未対応、接続失敗、期限切れ、Relay 障害その他の失敗分類の正規化。
- 署名結果を外部アプリケーションが独立して検証できる状態で返すこと。
- 連携に必要な最小限の非秘密診断情報を扱うこと。

SDK は、上記を実現するために必要な client-side adapter または handoff 処理を持ち得る。ただし、具体的な transport、protocol および暗号方式を本書で固定しない。

### 3.2 SDK が原則として責任を持たない範囲

SDK は、次を責任範囲に含めない。

- 秘密鍵、Mnemonic、Profile password、復号済み Vault または署名用秘密情報の要求、永続保存、管理または外部公開。
- Wallet Core の鍵管理、Wallet Store、秘密情報を使用する暗号処理、raw signing およびその失敗処理の代替。
- MosaicLynx の承認 UI、署名対象の最終表示、利用者に代わる承認・拒否判断。
- Browser Extension 本体、Mobile App 本体、Vault、Profile、Account 管理および platform 固有の認証。
- Relay サーバーの実装、運用、長期保管、署名対象の意味解釈、署名、承認または announce。
- Symbol / NEM ノード、ノード選択、署名済み transaction の announce、残高・履歴その他の継続的な network state 管理。
- Symbol SDK / NEM SDK に代わる汎用 blockchain SDK または、根拠のない chain 共通化。
- 組織向け監査、カストディ、永続的な包括署名許可およびユーザー確認を省略する自動署名。
- 独自の RPC framework、transport framework または、外部アプリケーションから指定された任意 Relay の運用。

Transaction construction の便利機能を SDK の必須責任とするかは未決であり、`SDK-OPEN-004` で扱う。いずれの場合も、SDK が announce または node 管理を担うことはない。

## 4. 前提・制約

- MosaicLynx の実施順序は Browser Extension、Android、iOS、Relay である。SDK は最初の Browser Extension 連携を優先し、Mobile / Relay 連携は対応する milestone の成立を前提とする。
- Mobile 対応を定義する要求は、将来 milestone の統合要求として扱う。
- MosaicLynx の共通要件は transaction signing と message signing を共通の署名能力として定めている。SDK v1 も両方を必須 operation として扱う。具体的な operation 名、message format、wire contract および対応 milestone の実現方法は後続仕様で定める。
- Symbol と NEM、Mainnet と Testnet は SDK の全ての要求・結果で明示的に区別する。SDK は一方の Chain / Network を他方へ暗黙に変換しない。
- Mainnet capability は適用される Mainnet release gate を満たす Signer / build の能力だけを扱い、SDK が gate を迂回して Mainnet capability を有効化してはならない。gate が未達成または判定不能でも、安全な unavailable / unsupported として扱えることを優先する。
- Wallet Core の責任境界は、MosaicLynx Application の表示・承認・orchestration と混同しない。SDK は Application や Wallet Core の責任を外部アプリケーションへ移さない。
- 外部アプリケーションが受け取った署名結果の独立検証と、必要な network 処理は外部アプリケーションの責任である。SDK が検証補助を行っても、その責任を肩代わりしない。
- 本書で未決とした事項は、API や protocol の詳細を推測して確定する根拠としては扱わない。

## 5. SDK の利用モデル

外部アプリケーションから MosaicLynx を利用する概念フローを次に示す。具体的な関数名、URL、データ形式、message 形式および状態遷移は定めない。

1. 外部アプリケーションが、MosaicLynx の利用可能性と必要な operation / Chain / Network の対応能力を確認する。
2. 必要に応じて、外部アプリケーションが接続・公開情報の利用を要求し、MosaicLynx 側で利用者が許可する。
3. 外部アプリケーションが、自身の責任で用意した transaction または message の署名要求を SDK へ渡す。
4. SDK が要求の文脈、許可状態、対応能力および受け渡し経路を確認し、対応する MosaicLynx へ要求を渡す。
5. Browser Extension または Mobile App が、外部入力を検証し、署名対象、Chain、Network、Account および確認可能な影響を利用者へ提示する。
6. 利用者が要求ごとに承認または拒否する。SDK、外部アプリケーションまたは Relay が利用者の判断を代行してはならない。
7. MosaicLynx 側が、明示的な承認とその他の安全条件を満たした場合だけ署名し、結果または拒否・失敗を返す。
8. SDK が応答の要求対応、完全性、Chain / Network / Account および対応する capability を確認し、正規化した結果または安全側の失敗を外部アプリケーションへ返す。
9. 外部アプリケーションが結果を独立して検証し、必要な announce や network 処理を自ら行う。

Relay を経由する場合も、Relay は受け渡しの一部に留まり、最終的な検証・表示・承認・署名は Mobile App が担う。Relay の受け渡し成功だけを署名成功の根拠にしてはならない。

## 6. 機能要求

### SDK-FR-001 利用可能性と capability の判定

**MUST** SDK は、外部アプリケーションが、利用可能な MosaicLynx の接続方式、対応 operation、対応 Chain / Network および互換性を判定できる能力を提供しなければならない。

利用可能性は、単なる Provider、アプリまたは Relay の存在を署名可能性・接続済み・アプリ導入済みと同一視してはならない。判定不能、対応経路なし、非対応 version および未対応 operation は、成功や接続済みとして報告してはならない。

根拠: Concept §8、共通要件 CR-007、CR-012。整合確認: `docs/specifications/web-transaction-handoff-spec.md` §5.3、§6。下流: SDK specification、Provider compatibility、platform capability 判定。

### SDK-FR-002 接続と許可の要求

**MUST** SDK は、外部アプリケーションが指定した Chain / Network の公開連携を要求でき、MosaicLynx 側で利用者が許可した結果だけを受け取れるようにしなければならない。

接続許可と各署名要求の利用者承認は別の責任として維持し、接続済みであることだけを署名承認として扱ってはならない。未接続状態から署名を行うための暗黙接続を成立させてはならない。

根拠: Concept §5、§6.3、§11、共通要件 CR-003、CR-009。整合確認: `docs/specifications/product-spec.md` §11、§16、`docs/requirements/browser-extension.md` BR-003〜BR-005、`docs/requirements/mobile-app.md` MR-002〜MR-004。下流: Extension / Mobile の connection contract、SDK specification。

### SDK-FR-003 公開 Account と接続文脈

**MUST** SDK は、許可された範囲に限り、外部アプリケーションが署名者の公開 Account identity と、その Account に対応する Chain / Network の接続文脈を確認できるようにしなければならない。

内部の Profile ID、Account ID、Wallet Store の識別子その他の内部管理情報を、外部アプリケーションへ公開することを必須としてはならない。公開情報の取得や cache の存在を、署名時の認可または最新状態の証明として扱ってはならない。

独立した node status、残高、履歴または blockchain network 状態を取得する SDK 機能は本要求に含めない。Chain / Network context をどの公開情報契約で提供するかは下流仕様で定める。

根拠: Concept §5、§7、§11、共通要件 §4.2、CR-005、CR-009。整合確認: `docs/specifications/product-spec.md` §15、§16、`docs/specifications/profile-account-spec.md`。下流: Provider / Mobile 公開 identity contract、SDK specification。

### SDK-FR-004 切断・許可撤回の連携

**MUST** SDK は、外部アプリケーションが現在の連携を終了するための契約を、対応する MosaicLynx の許可・状態管理と矛盾しない形で利用できるようにしなければならない。

切断または許可撤回後の公開 Account 情報を新しい署名要求の認可に利用してはならない。Profile 切替、Chain 切替、lock、unlock または認証の操作を、外部アプリケーションが SDK 経由で利用者の確認なしに実行できるようにしてはならない。

根拠: Concept §6.3、§11、共通要件 CR-009、CR-011。整合確認: `docs/specifications/product-spec.md` §11、§16、`docs/specifications/web-transaction-handoff-spec.md` §5。下流: Provider / Mobile permission contract。

### SDK-FR-005 署名要求の生成・受け渡し

**MUST** SDK は、外部アプリケーションの署名要求を、Signer が要求元、許可状態、署名対象、Chain / Network、Account および有効性を検証できる形で MosaicLynx 側へ受け渡さなければならない。

Browser の実 Origin と browser context を観測・検証する最終責任は Browser Extension / browser platform 側にある。SDK は dApp が自己申告した caller または Origin 文字列を検証済み Origin として扱ってはならず、Extension が検証した保証を超える caller identity を表明してはならない。Mobile / Relay では、handoff session と要求元との対応を最終的に検証する責任は Mobile App / platform 側にある。SDK は契約上必要な binding 情報を受け渡し得るが、その情報の存在だけで caller の真正性を保証してはならない。Relay は caller identity の最終検証主体ではない。

要求元の対応または受け渡しが検証できない場合、SDK は署名成功、caller verified、verified Origin または接続済みとして報告してはならない。接続済みという事実は caller authenticity の代替にならない。

根拠: Concept §6.1、§13、共通要件 CR-001、CR-NFR-001、CR-NFR-008、CR-NFR-009。整合確認: `docs/requirements/browser-extension.md` BR-003、BR-004、`docs/requirements/mobile-app.md` MR-002、`docs/requirements/relay.md` RR-001、`docs/specifications/web-transaction-handoff-spec.md` §7。下流: SDK request contract、platform caller binding、handoff specification。

### SDK-FR-006 Transaction signing の連携

**MUST** SDK は、承認済みの MosaicLynx 共通能力に含まれる transaction signing 要求を、外部アプリケーションから Signer へ渡し、利用者の明示的承認後に得られた結果を受け取れるようにしなければならない。

Signer が対応範囲内の transaction 全体、Chain / Network / Account、資産移動、権限変更その他の確認可能な影響を解析・提示できない場合、SDK は未対応または安全側の失敗を成功として扱ってはならない。SDK が自ら署名を実行したり、Signer の確認を省略する代替経路を提供したりしてはならない。

Aggregate、multisig および cosignature を含む transaction 関連 operation は、対応する Chain Adapter と Signer が全体・親子関係・署名対象を安全に検証・提示できる場合だけ、その operation の意味を保って受け渡さなければならない。未対応の場合は通常の transaction signing または message signing へ暗黙に変換してはならない。cosignature を SDK v1 の必須公開能力とするかは `SDK-OPEN-002` で扱う。

根拠: Concept §6.1、§6.2、§8、§11、共通要件 CR-002、CR-004、CR-005、CR-007-TX。整合確認: `docs/specifications/product-spec.md` §12、`docs/specifications/chain-compatibility-spec.md`、`docs/specifications/web-transaction-handoff-spec.md` §2、§7。下流: SDK signing specification、chain-specific signing contract、Extension / Mobile approval specification。

### SDK-FR-007 Message signing の連携

**MUST** SDK は、MosaicLynx 共通要件で承認された message signing を SDK v1 の必須 operation として、transaction signing と区別された要求として Signer へ渡し、利用者が実際に署名する message の内容、用途および適用される Chain / Network / Account の文脈を確認できるようにしなければならない。

SDK は、利用者が理解できない raw bytes、未対応 format または表示不能な message を、警告だけで署名へ進める API や暗黙 fallback を提供してはならない。表示・承認された message と実際の署名対象が一致しない場合、署名成功を返してはならない。

SDK v1 が message signing を必須で扱うことは確定事項であり、未対応 message signing を transaction signing、raw signing または別の message format として成功扱いにしてはならない。具体的な message operation の名称、format、wire contract、API 型および handoff の詳細は後続仕様で定める。

根拠: Concept §2、§3、§6、§8、§11、共通要件 CR-007-MSG、CR-004、CR-NFR-003、CR-NFR-009。整合確認: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/architecture/architecture.md` §2、§5.2、`docs/specifications/product-spec.md` §16、`docs/specifications/web-transaction-handoff-spec.md` §2、§5。下流: message signing specification、Provider / Mobile operation contract、test specification。

### SDK-FR-008 署名結果の受信・対応確認

**MUST** SDK は、受信した署名結果が、元の要求、要求元、署名者、Account、Chain、Network および必要な signer 指定に対応していることを確認できなければ、署名成功として返してはならない。

SDK が結果の形式や署名を検証した場合でも、外部アプリケーションが結果を独立して検証できる前提を維持しなければならない。Relay または Provider が成功応答を返したことだけを正当性の根拠にしてはならない。

根拠: Concept §6.4、§7、§9、§11、共通要件 CR-006、CR-NFR-009、CR-NFR-012。整合確認: `docs/requirements/relay.md` RR-002、RR-005、RR-007、`docs/specifications/web-transaction-handoff-spec.md` §7、§13。下流: result contract、SDK verification specification、dApp integration guidance。

### SDK-FR-009 Transport 差異の抽象化

**MUST** SDK は、対応する Browser Extension 直接連携、Mobile App 連携および Relay を介した連携について、外部アプリケーションが共通の意味を持つ接続・署名・結果・失敗の契約を利用できるようにしなければならない。transaction signing と message signing の正常な署名結果は、transport によらず同じ operation の意味を保たなければならない。

外部アプリケーションに transport 固有の秘密情報、Relay credential、内部 Account ID、任意 Relay の指定または platform 内部状態を要求してはならない。外部アプリケーションが利用可能な transport を個別に選択しなければ署名できない設計を v1 の必須条件としてはならない。

各 transport の利用可能性、提供 milestone、caller 検証および UI 差異を、同一の危険な意味へ変換してはならない。User rejection、mismatch / integrity / caller / replay failure および result unknown を自動 retry または別 transport fallback で迂回しないことは確定事項とする。具体的な選択順序、利用者が明示的に選択する代替経路の可否、unavailable / connection failure / timeout 時の扱いおよび将来の第三者 transport の追加方針は `SDK-OPEN-003` で扱う。

根拠: Concept §3、§4、§6.5、§8、共通要件 CR-007、CR-011、CR-AC-015。整合確認: `docs/architecture/architecture.md` §3、§5.5、`docs/specifications/web-transaction-handoff-spec.md` §1、§6、`docs/requirements/relay.md`。下流: transport adapter specification、Extension / Mobile / Relay contract。

### SDK-FR-010 要求のキャンセル・期限切れ・ライフサイクル

**MUST** SDK は、外部アプリケーションまたは連携環境によって要求がキャンセルされた場合、期限切れになった場合、要求元の文脈が変化した場合、または受け渡し状態が失われた場合に、署名結果を成功として返してはならない。

失敗後に同じ要求、承認または古い session を無条件に再利用してはならない。再試行を提供する場合は、新しい要求として改めて有効性と承認を確認できなければならない。具体的な timeout 値、再試行方式、保持方法および内部状態遷移は後続仕様で定める。

根拠: Concept §6.3、§11、§13、共通要件 CR-010、CR-NFR-010、CR-NFR-011。整合確認: `docs/requirements/browser-extension.md` BR-007、BR-008、`docs/requirements/relay.md` RR-004、RR-006、`docs/specifications/web-transaction-handoff-spec.md` §9〜§11。下流: lifecycle / cancellation specification、Relay failure contract、test specification。

### SDK-FR-011 エラーの正規化

**MUST** SDK は、提供形態・Provider・Relay の差異にかかわらず、外部アプリケーションが Success と、少なくとも次の九つの失敗分類を相互に区別して扱える結果を返さなければならない。

- MosaicLynx が存在しない、利用不能または対応 capability がない。
- 接続失敗、許可不足、未接続または接続状態の不一致。
- 利用者による拒否、承認画面の終了または署名キャンセル。
- timeout、期限切れ、要求元文脈の変更または要求の失効。
- invalid request、サイズ・形式・検証条件の不正。
- unsupported operation、Chain、Network、Account または signer の不一致。
- caller / Origin、許可範囲、完全性、correlation、replay または重複の検証失敗。
- Relay の停止、通信失敗、結果不明または handoff failure。
- Provider、Mobile App、Wallet Core、SDK その他の内部 failure。

失敗分類の具体的な error code、例外型、公開文言および再試行条件は定義しない。内部 stack trace、暗号詳細、credential、秘密情報および不要な parser / Vault 内部情報を外部へ返してはならない。

根拠: Concept §6.3、§11、§13、共通要件 CR-012、CR-NFR-004。整合確認: `docs/requirements/relay.md` RR-004、RR-NFR-002、`docs/specifications/web-transaction-handoff-spec.md` §10。下流: SDK error specification、provider / relay error mapping、developer guidance。

### SDK-FR-012 Chain / Network の整合性

**MUST** SDK は、要求、接続文脈、Account、Signer および結果の Chain / Network を対応付け、指定された対象と異なる Chain / Network へ暗黙に切り替えたり、成功として返したりしてはならない。

Symbol と NEM の transaction schema、address、署名 byte、hash および network constant を SDK 独自の共通規則で置き換えてはならない。SDK が結果検証を行う場合は、承認済みの Chain Compatibility と chain adapter の契約に従う。

根拠: Concept §8、§11、§12、共通要件 CR-005、CR-NFR-005。整合確認: `docs/specifications/chain-compatibility-spec.md`、`docs/specifications/product-spec.md` §11、§12。下流: chain compatibility contract、SDK result verification specification。

## 7. セキュリティ要求

### SDK-SEC-001 秘密情報を要求・保持しない

**MUST** SDK は、外部アプリケーションから秘密鍵、Mnemonic、Profile password、復号済み Vault、Wallet Store の秘密部分または署名用秘密情報を受け取ることを前提としてはならない。SDK はこれらを継続保持、ログ出力、診断出力、URL、外部通信または外部アプリケーションへ返却してはならない。

SDK が公開 Account identity や署名結果を扱う場合も、公開情報と秘密情報を混同してはならない。

根拠: Concept §4、§9、§13、共通要件 CR-008、CR-NFR-002。整合確認: `docs/architecture/architecture.md` §2、§3、§5.5、`_snwc/docs/requirements/requirements.md` §2、`_snwc/docs/specifications/specification.md` §2。下流: SDK data-boundary specification、Wallet Core binding contract、security test specification。

### SDK-SEC-002 最終的な承認主体を MosaicLynx 側に置く

**MUST** 署名の最終的な承認または拒否は、Browser Extension または Mobile App の MosaicLynx 管理下の確認領域で利用者が行わなければならない。SDK、Relay、外部アプリケーションおよびその callback は、利用者に代わって承認を成立させてはならない。

接続許可、SDK の capability 判定、Relay の受け渡し成功または外部アプリケーションの表示を、署名承認の代替として扱ってはならない。

根拠: Concept §6.2、§6.3、§11、§13、共通要件 CR-002、CR-003、CR-011。整合確認: `docs/requirements/browser-extension.md` BR-002、BR-005、`docs/requirements/mobile-app.md` MR-004、MR-013、`docs/requirements/relay.md` RR-009。下流: approval boundary specification、Extension / Mobile acceptance criteria。

### SDK-SEC-003 外部入力と表示情報を信頼しない

**MUST** SDK は、外部アプリケーション、Web page、Provider、Mobile App、Relay、network および SDK 利用者が渡した表示情報を、検証前に信頼してはならない。

SDK は、表示用の任意文字列を安全性・本人性・署名対象の正しさの根拠としてはならない。Signer が解釈・表示・確認できない要求を、SDK の便利な代替経路によって署名へ進めてはならない。

根拠: Concept §11、§13、共通要件 CR-NFR-001、CR-NFR-007。整合確認: `docs/specifications/product-spec.md` §12、`docs/specifications/web-transaction-handoff-spec.md` §7.4、§13。下流: input validation、approval presentation、chain inspection specification。

### SDK-SEC-004 Caller / Origin と許可範囲の対応

**MUST** SDK と接続先 Signer は、署名要求が現在の外部アプリケーション、browser context または handoff session、許可された接続範囲および署名文脈に対応していることを確認できなければならない。対応を確認できない要求は署名へ進めてはならない。

Browser の実 Origin と browser context を観測・検証する最終責任は Browser Extension / browser platform 側にある。SDK は dApp の自己申告 Origin を検証済み Origin として扱わず、Extension が実際に検証した保証を超える caller identity または verified Origin を外部へ表明してはならない。Mobile / Relay では、handoff session と要求元との対応を最終的に検証する責任は Mobile App / platform 側にあり、Relay は caller identity の最終検証主体ではない。SDK は binding 情報を契約に従って受け渡し得るが、その存在や Relay の配送成功だけで caller の真正性を保証してはならない。

caller / Origin、handoff session または許可範囲を検証できない場合、SDK は署名成功、caller verified、verified Origin または接続済みとして報告してはならない。接続済みという事実は caller authenticity の代替にならない。具体的な Origin proof、nonce、browser API、OS API、暗号方式および credential format は後続仕様で定める。

根拠: Concept §5、§13、共通要件 CR-NFR-008、CR-NFR-009、CR-011。整合確認: `docs/requirements/browser-extension.md` BR-003、BR-004、`docs/requirements/mobile-app.md` MR-002、`docs/specifications/web-transaction-handoff-spec.md` §7.1、§13。下流: caller authentication / origin binding specification。

### SDK-SEC-005 要求・承認・結果の対応と差し替え防止

**MUST** SDK は、要求、Signer が確認した対象、利用者の承認および返却された結果の対応を確認できる状態を維持しなければならない。要求の改ざん、差し替え、別 Account / Chain / Network への置換、承認後の内容変更または別 session の結果を検出・確認できない場合は成功として返してはならない。

要求と結果の correlation を行う具体的な識別子、digest、署名その他の方式は本書で定めない。

根拠: Concept §6.2、§6.3、§13、共通要件 CR-NFR-003、CR-NFR-009、CR-NFR-012。整合確認: `docs/requirements/relay.md` RR-003、RR-005、RR-007、`docs/specifications/web-transaction-handoff-spec.md` §7、§8、§13。下流: request / result integrity specification、cross-transport contract test。

### SDK-SEC-006 Freshness、Replay、重複および遅延配送

**MUST** SDK は、期限切れ、失効済み、使用済み、重複、遅延または過去 session に属する要求・結果によって、追加の署名、古い承認の再利用または署名成功の誤認が発生しないようにしなければならない。

Relay の復旧、再配送、通信再接続または外部アプリケーションの再送だけで、無効な要求を有効化してはならない。具体的な timeout、nonce、replay cache、状態遷移は後続仕様で定める。

根拠: Concept §3、§6.3、§11、§13、共通要件 CR-NFR-010、CR-NFR-011。整合確認: `docs/requirements/relay.md` RR-004、RR-006、RR-NFR-002、`docs/specifications/web-transaction-handoff-spec.md` §9、§11、§13。下流: freshness / replay specification、Relay integration test。

### SDK-SEC-007 Relay を信頼境界にしない

**MUST** SDK は、Relay の存在、応答、保存状態、配送完了またはエラーの内容だけを、署名対象の正しさ、利用者の承認または署名結果の正当性の根拠としてはならない。

Relay を介する場合、SDK と Mobile App が要求・結果の完全性、対応、鮮度および承認条件を確認できる境界を維持しなければならない。Relay に渡る情報は、承認済み handoff 契約が必要とする最小限の保護された情報に限り、Relay が秘密鍵、Mnemonic、Profile password、復号済み Wallet Store または raw signing secret を扱わないことを前提とする。

根拠: Concept §9、§13、共通要件 CR-011、CR-NFR-008〜CR-NFR-012。整合確認: `docs/requirements/relay.md` RR-001〜RR-009、`docs/architecture/architecture.md` §3、§5.5、`docs/specifications/web-transaction-handoff-spec.md` §7〜§9、§13。下流: Relay protocol、Mobile handoff、SDK security specification。

### SDK-SEC-008 エラー・診断からの情報漏洩防止

**MUST** SDK のエラー、warning、diagnostics、telemetry または開発者向け出力に、秘密情報、復元可能な秘密情報、Relay credential、session secret、復号済み payload、不要な full transaction / message、内部 Vault 情報または stack trace を含めてはならない。

安全な失敗を外部へ返す場合も、攻撃者が要求、session、credential または内部状態を推測できる詳細を不要に開示してはならない。

根拠: Concept §13、共通要件 CR-008、CR-NFR-002、CR-012。整合確認: `docs/requirements/relay.md` RR-NFR-004、`docs/specifications/web-transaction-handoff-spec.md` §10、§12。下流: error / diagnostics specification、privacy test。

## 8. プライバシー要求

### SDK-PRIV-001 収集情報の最小化

**MUST** SDK は、連携に必要な要求文脈、利用者が許可した公開 Account identity、Chain / Network および処理結果を越えて、一般ユーザーの情報を収集・送信・保持してはならない。

SDK は、残高、取引履歴、連絡先、広告識別子、利用者プロファイル、Mnemonic、秘密鍵、password または不要な dApp 利用履歴を収集する機能を要件として持たない。

根拠: Concept §10、§13、共通要件 CR-008、CR-NFR-002。整合確認: `docs/mobile/mobile-privacy.md`、`docs/requirements/relay.md` RR-008、`docs/specifications/web-transaction-handoff-spec.md` §12。下流: SDK privacy specification、Relay retention policy。

### SDK-PRIV-002 短期利用と保持範囲

**MUST** SDK は、要求・結果・連携文脈を処理に必要な期間と範囲を越えて継続保持してはならない。SDK の cache を認可の正本、長期履歴またはユーザー分析基盤として扱ってはならない。

Relay を介する受け渡しについても、SDK は Relay の一時性・削除・期限契約を弱める保存や再利用を行ってはならない。

具体的な保持期間、削除契機および browser storage の利用範囲は後続仕様で定める。

根拠: Concept §10、§13、共通要件 CR-NFR-002、CR-NFR-011。整合確認: `docs/requirements/relay.md` RR-NFR-003、`docs/mobile/mobile-privacy.md`、`docs/specifications/web-transaction-handoff-spec.md` §9、§12。下流: retention / lifecycle specification。

### SDK-PRIV-003 診断と利用者選択

**SHOULD** SDK の診断機能は、既定で無効または利用者・運用者が明示的に有効化できる状態とし、有効時も allowlist された安全な状態情報に限定すべきである。payload、署名結果、Origin、公開鍵、credential、session 情報その他の連携内容を診断へ含めない。

根拠: Concept §13、共通要件 CR-NFR-002。整合確認: `docs/specifications/web-transaction-handoff-spec.md` §12、`docs/mobile/mobile-privacy.md`。下流: diagnostics / privacy specification、release policy。

## 9. Platform / Runtime 要求

### SDK-PLAT-001 Web アプリケーションからの利用

**MUST** SDK は、MosaicLynx の初期連携対象である browser-based Web application が、TypeScript / JavaScript ecosystem から利用できる形で提供されなければならない。

具体的な module format、package manifest、bundler、framework、最低 browser version および配布 channel は本書で固定しない。初期 Browser Extension milestone の Chrome 対応は Browser Extension 要件に従う。

根拠: Concept §4、§5、§6.5、共通要件 §3、§4。整合確認: `docs/requirements/browser-extension.md` BR-001、`docs/specifications/web-transaction-handoff-spec.md` §1、§4、`docs/architecture/architecture.md` §1、§5.5。下流: SDK distribution / runtime specification、Browser Extension integration specification。

### SDK-PLAT-002 Browser Extension との連携

**MUST** SDK は、対応する Browser Extension の公開連携境界を利用して、外部アプリケーションが Extension の private context、Vault、承認状態または内部識別子へ直接アクセスせずに、公開情報の取得と署名要求の受け渡しを行えるようにしなければならない。

Browser が観測した実 Origin と browser context の要求への対応、およびその最終検証責任は Browser Extension / browser platform 側にある。Extension が要求元、許可、表示、承認、署名および wallet-core の境界を検証する責任を SDK へ移してはならない。SDK は dApp の自己申告 Origin を検証済み Origin として扱わず、Extension の検証結果を超える caller 保証を表明してはならない。

根拠: Concept §9、§13、共通要件 CR-011、CR-013。整合確認: `docs/requirements/browser-extension.md` BR-002〜BR-011、`docs/specifications/product-spec.md` §16、`docs/architecture/architecture.md` §5.3〜§5.5。下流: Provider / Extension integration specification。

### SDK-PLAT-003 Mobile App / Relay との連携

**MUST** SDK は、Mobile milestone が提供する契約を利用する場合、Mobile App の確認・承認・署名と Relay の受け渡し責任を分離したまま外部アプリケーションへ連携できなければならない。

handoff session と要求元との対応を最終的に検証する責任は Mobile App / platform 側にある。Relay は caller identity の最終検証主体ではなく、Relay の配送成功だけを caller 検証成功として扱ってはならない。SDK は契約上必要な binding 情報を受け渡し得るが、その存在だけで caller の真正性を保証してはならない。Mobile App が未提供、未対応または capability を満たさない場合、SDK はその状態を利用可能・署名成功として扱ってはならない。Relay は Mobile App の代わりに扱ってはならない。

根拠: Concept §1、§6.5、§9、§12、共通要件 CR-011、OPEN-003。整合確認: `docs/requirements/mobile-app.md` MR-002、MR-003、MR-004、MR-012、`docs/requirements/relay.md` RR-001〜RR-009、`docs/specifications/web-transaction-handoff-spec.md` §1、§6、§7。下流: Mobile handoff / Relay specification、Mobile milestone acceptance。

### SDK-PLAT-004 実行環境の境界

**MUST** SDK は、対象として宣言していない runtime、browser context または server-side context で、利用可能・caller 検証済み・署名可能であると誤認させてはならない。

Browser の Origin、user activation、Page lifecycle または Mobile App の導入状態を必要とする連携を、Node.js その他の server-side runtime で同じ保証があるように扱ってはならない。Node.js、Web Worker、SSR、非 browser runtime を正式対応対象とするかは `SDK-OPEN-005` で決定する。

根拠: Concept §11、§12、共通要件 CR-NFR-001、CR-NFR-008。整合確認: `docs/requirements/browser-extension.md` BR-004、BR-007、BR-008、`docs/specifications/web-transaction-handoff-spec.md` §5.3、§11、`docs/architecture/architecture.md` §3、§6。下流: runtime support matrix、caller binding specification。

### SDK-PLAT-005 配布と実行コードの信頼境界

**MUST** SDK の配布物は、外部の remote code、未検証の動的 script または利用者が認識できない実行時取得コードに依存して、署名要求・結果処理の安全性を成立させてはならない。

依存関係、artifact、package integrity、release evidence および更新時の互換性は、適用される release policy と後続仕様に従う。

根拠: Concept §12、§14、共通要件 CR-NFR-006。整合確認: `docs/specifications/web-transaction-handoff-spec.md` §4、`docs/specifications/product-spec.md` §17.4、`docs/adr/0001-mainnet-evidence-lite.md`。下流: distribution / release specification、Mainnet release gate。

## 10. Compatibility / Versioning 要求

### SDK-COMP-001 SDK と MosaicLynx の version 差異

**MUST** SDK は、SDK version、Provider / Signer version、Relay protocol version または Mobile App version の差異を、能力・互換性の確認なしに成功として扱ってはならない。

SDK version と MosaicLynx 本体 version は同一であることを前提にしてはならず、対応能力を確認できる契約を持たなければならない。具体的な version field、protocol version、互換表および検出方法は後続仕様で定める。

根拠: Concept §4、§6.5、共通要件 CR-007、CR-012、OPEN-003。整合確認: `docs/specifications/web-transaction-handoff-spec.md` §4、§6、§15、`docs/specifications/product-spec.md` §16。下流: versioning / capability specification、release policy。

### SDK-COMP-002 後方互換性と意味の維持

**MUST** 後方互換として宣言された SDK / Provider / handoff の組み合わせでは、同一 operation の意味、Chain / Network の境界、明示的承認、安全側失敗および結果対応を変更してはならない。

互換性を維持できない operation、format、Chain、Network または caller context は、別 operation の成功へ downgrade せず未対応または version mismatch として終了しなければならない。

具体的な backward compatibility の期間、supported version の範囲および release policy は `SDK-OPEN-006` で決定する。

根拠: Concept §8、§11、共通要件 CR-007、CR-010、CR-012。整合確認: `docs/specifications/web-transaction-handoff-spec.md` §6、§15、`docs/specifications/product-spec.md` §16。下流: API / protocol compatibility matrix、deprecation policy、release test。

### SDK-COMP-003 Capability negotiation と unsupported feature

**MUST** SDK は、対応していない operation、message format、transaction type / version、Chain / Network または transport を、利用可能なものとして報告してはならない。

未対応 feature を別の operation、raw signing、別 transport または別の chain-specific interpretation へ暗黙 fallback してはならない。外部アプリケーションが対応可否を判断でき、安全側の失敗として扱える結果を返さなければならない。

根拠: 共通要件 CR-004、CR-007、CR-012、CR-NFR-005。整合確認: `docs/specifications/web-transaction-handoff-spec.md` §5.3、§6、§10、`docs/specifications/chain-compatibility-spec.md` §4〜§7。下流: capability matrix、compatibility test specification。

### SDK-COMP-004 Deprecated feature の扱い

**MUST** deprecated とされた feature を、利用者の確認なしに別の意味へ置換してはならない。将来廃止される feature は、対応期間、代替可否および未対応時の安全側結果を外部アプリケーションが判断できるようにしなければならない。

具体的な Semantic Versioning 運用、deprecation notice、major / minor / patch の判定規則は release policy または後続仕様へ委ねる。

根拠: Concept §8、§12、共通要件 CR-012。整合確認: `docs/specifications/web-transaction-handoff-spec.md` §15、`docs/requirements/browser-extension.md` BR-012、BR-013。下流: release policy、deprecation specification、migration guidance。

## 11. エラーモデル要求

### SDK-ERR-001 外部から区別可能な失敗分類

**MUST** SDK は、少なくとも次の失敗分類を、署名成功および互いに意味の異なる失敗から区別できるようにしなければならない。

| 分類                            | 外部アプリケーションが判断できる必要があること                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| User rejection                  | 利用者が承認しなかったこと。自動再試行や別 transport への切替を成功の代わりに行わない。                  |
| Unavailable                     | 対応する MosaicLynx、Provider、Mobile App または transport が利用できないこと。                          |
| Connection / permission failure | 接続失敗、未接続、許可不足または接続 scope 不一致であること。                                            |
| Timeout / expired / cancelled   | 要求期限、キャンセルまたは lifecycle によって完了しなかったこと。                                        |
| Invalid request                 | 入力形式、対象、encoding、サイズまたは検証条件が不正であること。                                         |
| Unsupported                     | operation、format、transaction、Chain、Network、version または transport が未対応であること。            |
| Mismatch / integrity failure    | caller、Origin、Account、Chain、Network、request / result 対応、完全性または replay 検証に失敗したこと。 |
| Relay / transport failure       | Relay、通信または受け渡しの失敗であり、署名結果が不明または得られなかったこと。                          |
| Internal failure                | SDK、Provider、Mobile App、Wallet Core または依存 component の内部失敗であること。                       |

Success は、要求、operation、signer、Account、Chain、Network、correlation および Signer が確認・承認した対象との対応を確認でき、外部アプリケーションが署名結果を独立検証できる正常完了であることを表す。

User rejection は自動 retry または別 transport への自動 fallback で迂回してはならない。Mismatch / integrity failure は Relay / transport failure とみなして自動再送してはならず、caller / Origin / replay failure も同様に扱わなければならない。Relay / transport failure に含まれる result unknown は Success とみなしてはならず、署名済みまたは未署名だったと推測してはならない。Timeout / expired / cancelled の後に、古い承認、要求または session を再利用してはならない。

具体的な error code、exception class、message 文言、HTTP status、retry 回数および retry interval は定めない。

根拠: Concept §6.3、§13、共通要件 CR-010、CR-012。整合確認: `docs/requirements/relay.md` RR-004、RR-NFR-002、`docs/specifications/web-transaction-handoff-spec.md` §10。下流: SDK error specification、developer documentation、contract test。

## 12. 非機能要求

### SDK-NFR-001 安全性優先の信頼性

**MUST** SDK は、可用性、利便性または retry の成功率を高めるために、要求検証、承認、結果対応、Chain / Network 整合性、秘密情報保護または caller 検証を緩和してはならない。

Relay、Provider、Mobile App または network が利用できない場合に連携が完了しないことは許容するが、失敗を署名成功としてはならない。

根拠: Concept §11、§13、共通要件 CR-010、CR-NFR-006、CR-NFR-010、CR-NFR-011。整合確認: `docs/requirements/relay.md` RR-010、RR-011、`docs/adr/0001-mainnet-evidence-lite.md`。下流: failure / release specification。

### SDK-NFR-002 相互運用性

**MUST** SDK は、承認済みの Provider、Mobile App、Relay、Chain Adapter および Chain Compatibility の契約と相互運用できなければならない。Symbol と NEM の差異、Mainnet と Testnet の差異および署名結果の検証可能性を、提供形態の差異によって失わせてはならない。

根拠: Concept §8、§11、共通要件 CR-005、CR-006、CR-NFR-005。整合確認: `docs/specifications/chain-compatibility-spec.md`、`docs/specifications/web-transaction-handoff-spec.md`、`docs/architecture/architecture.md` §2、§6。下流: interoperability specification、fixed vector / differential test specification。

### SDK-NFR-003 Cross-transport の契約検証可能性

**MUST** SDK の共通契約は、Browser Extension 直接連携と、提供開始後の対応する Mobile / Relay 連携を個別に検証できなければならない。transaction signing と message signing の正常な署名結果、成功に至らない結果および安全側失敗が、transport により別の operation の意味へ変化しないことを確認できなければならない。

Mobile / Relay の提供開始前は、その cross-transport 対応を完了扱いにしてはならない。

根拠: Concept §6.5、§14、共通要件 CR-007、CR-011、CR-AC-009、CR-AC-015。整合確認: `docs/specifications/web-transaction-handoff-spec.md` §14、`docs/architecture/architecture.md` §5.5。下流: SDK contract test、platform E2E test、milestone acceptance。

### SDK-NFR-004 配布・更新時の安全性

**MUST** SDK の配布および更新は、対応する公開契約、依存関係、capability、署名結果検証および caller / Relay 境界を利用者に誤認させる状態を作ってはならない。互換性または Mainnet capability を確認できない更新後は、署名成功を継続してはならない。

具体的な package release、artifact、SBOM、証跡、rollout および rollback 手順は release policy と後続仕様で定める。

根拠: Concept §12、§14、共通要件 CR-NFR-006、CR-011。整合確認: `docs/specifications/product-spec.md` §17.4、§19、`docs/adr/0001-mainnet-evidence-lite.md`。下流: release readiness、Mainnet evidence、update compatibility specification。

### SDK-NFR-005 Testability と安全な可観測性

**MUST** SDK の主要契約は、正常系だけでなく、malformed input、unsupported feature、wrong Chain / Network、user rejection、timeout、cancel、context change、response mismatch、replay、Relay failure および secret leakage の不成立を検証できる形で定義されなければならない。

**SHOULD** SDK は、transport 選択、要求開始、応答受信および失敗分類など、秘密情報を含まない最小限の診断を提供できるようにすべきである。診断の有無や出力が署名可否・秘密情報保護の境界を変えてはならない。

根拠: Concept §14、共通要件 CR-AC-001〜CR-AC-016、CR-NFR-001〜CR-NFR-012。整合確認: `docs/specifications/web-transaction-handoff-spec.md` §12、§14、`docs/specifications/chain-compatibility-spec.md` §7、`docs/adr/0001-mainnet-evidence-lite.md`。下流: SDK test specification、release evidence、security review。

本書では、SDK の uptime、秒単位の latency、同時実行数、retry 回数または runtime ごとの性能目標を定めない。必要性と測定方法は、対象 milestone と release policy で判断する。

## 13. 責務境界

| 境界                       | SDK の責任                                                                                                                                                                | SDK が担わない責任                                                                                                        | 最終的なセキュリティ判断                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| SDK ↔ 外部アプリケーション | 接続・能力判定、要求の受け渡し、結果の対応確認、失敗の正規化、公開情報の最小限の提供。                                                                                    | 外部アプリケーションの業務判断、署名結果の最終的な network 処理、秘密情報の取得。                                         | 署名対象の承認は MosaicLynx 側の利用者。結果の利用可否は外部アプリケーションが独立検証する。                |
| SDK ↔ Browser Extension    | 公開 Provider / 連携契約を介した接続、公開 Account 情報、署名要求・結果の受け渡し。Browser が観測した実 Origin / browser context に基づく保証を超えない情報を外部へ出す。 | Extension の Origin / browser context の最終検証、permission、承認 UI、Vault、秘密鍵、raw signing、Extension lifecycle。  | 実 Origin と要求元 context の最終検証は Extension / browser platform、署名承認は Extension 管理下の利用者。 |
| SDK ↔ Mobile App           | 対応する Mobile handoff を通じた要求・結果の連携と、契約上必要な binding 情報の受け渡し。                                                                                 | App Link / OS integration の最終実装、handoff session と caller の最終検証、App の復号・検証・表示・認証・署名、OS 保護。 | handoff と caller の対応の最終検証および署名承認は Mobile App / platform。                                  |
| SDK ↔ Relay                | Relay を opaque な受け渡し境界として扱い、要求・結果の対応と失敗を確認する client-side 連携。                                                                             | Relay server の logging、retention、diagnostics、credential handling、意味解釈、承認、署名、長期保管、announce。          | Relay は caller identity の最終検証・署名判断主体でなく、Mobile App が検証・表示・承認・署名する。          |
| SDK ↔ Wallet Core          | Wallet Core を正本とする署名結果・公開 identity の境界を尊重する。                                                                                                        | 鍵管理、Wallet Store、復号、KDF / AEAD、raw signing、認証の代替。                                                         | Wallet Core は秘密情報処理の正本、利用者承認は Application / Signer。                                       |
| SDK ↔ Symbol / NEM network | Chain / Network の文脈を保持し、必要な結果対応を確認する。                                                                                                                | Node、REST / WebSocket、announce、node 選択、残高・履歴・継続状態、汎用 chain SDK の代替。                                | Signer が署名対象を確認し、外部アプリケーションが network 処理と結果利用を判断する。                        |

SDK が要求を整形・検証することは、Signer が行う最終的な transaction / message の意味解析、表示および承認判断を代替しない。

## 14. 受け入れ条件

| ID         | 関連要求                                             | 受け入れ可能な状態                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK-AC-001 | SDK-FR-001、SDK-COMP-003                             | 外部アプリケーションが、利用可能性、対応 operation、Chain / Network および version mismatch を、署名成功・接続済みと誤認せず判定できる。                                                                                                                                                                                                                                                                                                                                                                   |
| SDK-AC-002 | SDK-FR-002〜004、SDK-SEC-002                         | 接続・公開 Account の許可と各署名要求の利用者承認が分離され、未接続・許可撤回後の要求が署名へ進まず、Profile / lock / unlock 操作が外部アプリケーションへ移されていない。                                                                                                                                                                                                                                                                                                                                  |
| SDK-AC-003 | SDK-FR-005、SDK-SEC-003、SDK-SEC-004                 | Browser では browser が観測した実 Origin / browser context、Mobile / Relay では Mobile App / platform が検証した handoff session と要求元の対応を根拠にできる。自己申告 Origin、binding 情報の存在、Relay の配送成功または接続済みという事実だけでは、caller verified、verified Origin または署名成功を返さない。                                                                                                                                                                                          |
| SDK-AC-004 | SDK-FR-006、SDK-FR-007、SDK-COMP-003                 | transaction signing と message signing の両方が SDK v1 の正常系検証対象であり、各結果が対応する operation の意味を保つ。未対応、未解析、表示不能または raw signing への暗黙 fallback は成功しない。具体的な operation 名、format、wire contract および API 型は後続仕様で定める。                                                                                                                                                                                                                          |
| SDK-AC-005 | SDK-FR-008、SDK-FR-012、SDK-SEC-005                  | transaction signing と message signing の正常な署名結果について、dApp / 外部アプリケーションが、元要求、operation、signer、Account、Chain、Network、request / response correlation および実際に Signer が確認・承認した対象との対応を独立して検証できる。対応を確認できない結果は成功にしない。                                                                                                                                                                                                            |
| SDK-AC-006 | SDK-FR-009、SDK-NFR-003                              | Browser Extension と、提供開始後の Mobile / Relay で、transaction signing と message signing の正常結果、拒否、未対応、検証失敗および transport failure が同じ operation の意味を保つことを個別に確認できる。Mobile App が未実装・未提供の期間は、E2E 済み、contract test 済みまたは対応済みと報告しない。                                                                                                                                                                                                 |
| SDK-AC-007 | SDK-FR-010、SDK-SEC-006、SDK-ERR-001                 | cancel、timeout、期限切れ、context change、Relay 障害、重複、遅延または replay 後に、古い要求・承認だけで追加署名が発生せず、result unknown は success または「未署名」と推測されない。User rejection は自動 retry / 別 transport fallback で迂回せず、integrity / caller / replay failure は transport failure として自動再送しない。timeout / expired 後は古い承認を再利用しない。                                                                                                                       |
| SDK-AC-008 | SDK-FR-011、SDK-SEC-008                              | 外部アプリケーションが、Success、User rejection、Unavailable、Connection / permission failure、Invalid request、Unsupported、Mismatch / integrity / caller / replay failure、Timeout / expired / cancelled、Relay / transport failure / result unknown、Internal failure の十分類を相互に区別して、安全な終了・新規要求・再接続の制御を選択できる。具体的な error code、exception class、message 文言、HTTP status、retry 回数および retry interval は後続仕様へ委ね、秘密情報や過剰な内部情報は含めない。 |
| SDK-AC-009 | SDK-SEC-001、SDK-SEC-007、SDK-PRIV-001、SDK-PRIV-002 | SDK 自身の diagnostics、SDK client-side の一時保持および SDK が外部へ出す情報に、秘密鍵、Mnemonic、password、復号済み Vault、credential、session secret、不要な full payload が不要に現れず、要求・結果が目的を越えて継続保持されない。Relay server 側の logging、retention、diagnostics および credential handling は Relay requirements で管理し、SDK 要件が Relay server の内部実装を直接保証するものとはしない。                                                                                       |
| SDK-AC-010 | SDK-PLAT-001〜005                                    | 宣言された browser / platform 境界でのみ利用可能性と caller 検証の意味が保証され、非対応 runtime、未提供 Mobile、未達成 Mainnet gate または配布物の互換性不明を署名可能状態として扱わない。                                                                                                                                                                                                                                                                                                                |
| SDK-AC-011 | SDK-COMP-001〜004                                    | SDK、Provider、Mobile App および Relay protocol の version / capability の組み合わせが検証され、互換性を確認できない operation が別 operation へ downgrade されず、安全側に終了する。                                                                                                                                                                                                                                                                                                                      |
| SDK-AC-012 | SDK-NFR-002、SDK-NFR-005                             | Symbol / NEM × Mainnet / Testnet の対応、固定 compatibility 契約、正常系と異常系、malformed input、secret leakage 不成立を、SDK の contract test および必要な platform E2E で検証できる。                                                                                                                                                                                                                                                                                                                  |

## 15. 未決事項

### SDK-OPEN-002：Aggregate / multisig / cosignature の SDK 公開範囲

- 論点: transaction signing に含まれる aggregate / multisig の扱いと、cosignature を独立した SDK operation として v1 の必須能力に含めるか。
- 未決の理由: Product / Chain Compatibility は全体解析・確認を要求し、既存 handoff specification は cosignature の契約を記載するが、共通要件は独立した cosignature capability の v1 範囲を明示していないため。
- 影響: SDK-FR-006、公開 operation、Chain Adapter の検証契約、Mobile / Relay handoff、受け入れ fixture。
- 決定時期: SDK specification と Chain Compatibility の対応範囲を確定する前。対応しない operation は capability で未対応とし、通常署名へ変換しない。
- 根拠: 共通要件 CR-007-TX、`docs/specifications/product-spec.md` §12、`docs/specifications/chain-compatibility-spec.md` §4、`docs/specifications/web-transaction-handoff-spec.md` §5、既存 handoff contract。

### SDK-OPEN-003：Transport 選択、明示的代替経路および第三者連携

- 論点: Extension / Mobile / Relay の選択順、unavailable / connection failure / timeout 後の扱い、利用者による transport の明示的選択を許可するか、将来の第三者アプリ・第三者 transport を単一契約へ含めるか。
- 未決の理由: SDK は transport 差異を吸収する必要があるが、利用者の明示操作、user activation、origin / caller 保証および安全側失敗への影響が platform ごとに異なるため。
- 影響: SDK-FR-001、SDK-FR-009、SDK-PLAT-003、SDK-COMP-003、UX、Relay / Mobile milestone。
- 決定時期: 各 platform の handoff specification と SDK compatibility matrix の確定時。
- 制約: User rejection、mismatch / integrity / caller / replay failure および result unknown の後に、自動 retry または別 transport fallback で処理を迂回してはならない。dApp が Relay URL、credential または内部 transport 状態を任意指定して安全境界を変更できないことも、本要件の前提である。

### SDK-OPEN-004：Transaction construction の責務

- 論点: SDK が transaction construction の helper または domain-specific builder を提供するか、外部アプリケーションが Symbol / NEM SDK 等で構築した payload の受け渡しと結果検証に限定するか。
- 未決の理由: SDK の中心価値は署名連携であり、transaction construction を含めると Symbol / NEM SDK の代替や chain-specific ownership を招く一方、dApp の統合容易性に影響するため。
- 影響: SDK スコープ、依存関係、公開 package、Chain Compatibility、API / specification、test fixture。
- 決定時期: SDK specification で統合対象と依存責務を確定する前。
- 制約: SDK が node、announce、継続的な network state を担わないことは確定している。

### SDK-OPEN-005：正式対応 runtime と配布形態

- 論点: Browser ESM / TypeScript / JavaScript を初期対象とする範囲、Node.js、SSR、Web Worker、非 browser runtime、mobile browser の正式 support matrix、配布 package の互換条件。
- 未決の理由: Web handoff は browser context、Origin、page lifecycle および user activation に依存し得るが、全 runtime の保証範囲は既存要件で確定していないため。
- 影響: SDK-PLAT-001、SDK-PLAT-004、caller binding、distribution、test matrix。
- 決定時期: SDK distribution / runtime specification と各 platform milestone の決定時。
- 根拠: Concept §6.5、共通要件 OPEN-003、`docs/specifications/web-transaction-handoff-spec.md` §1、§4、§5.3、`docs/architecture/architecture.md` §1、§6。

### SDK-OPEN-006：Versioning、backward compatibility および deprecation policy

- 論点: SDK version と MosaicLynx / Provider / Relay protocol version の対応、保証する後方互換期間、version mismatch の扱い、deprecated feature の告知・廃止・移行条件。
- 未決の理由: 既存仕様には version / major の方向性があるが、SDK package、Provider API、Relay protocol、Mobile App の横断的な release policy は一つの要件として確定していないため。
- 影響: SDK-COMP-001〜004、capability negotiation、release evidence、developer migration。
- 決定時期: SDK compatibility specification と release policy の確定時。
- 制約: 非対応または意味を維持できない feature を別 operation へ silent downgrade しないことは確定している。

### SDK-OPEN-007：Caller / Origin binding の具体方式

- 論点: Browser Extension の browser-observed Origin、Mobile / Relay の handoff session、必要に応じた Origin proof を、SDK の共通契約へどの粒度で受け渡すか。
- 未決の理由: Browser Extension / browser platform または Mobile App / platform が最終検証主体であり、SDK がそれらの保証を超えないことは確定しているが、platform 間で同一の binding 方式を採用する必要はないため。
- 影響: SDK-SEC-004、SDK-FR-005、SDK-PLAT-002〜004、Mainnet release gate、Mobile handoff。
- 決定時期: platform-specific caller binding の具体方式を確定し、SDK の共通 result / error contract へ反映する前。
- 制約: 外部アプリケーションが渡した Origin 文字列だけを認証根拠にしないこと、検証不能時に署名成功・caller verified・verified Origin・接続済みを報告しないこと、保証範囲を越えて dApp の善性や非侵害を表示しないことは確定している。

## 16. Out of Scope

本書で SDK の対象外とする事項を明示する。

- 秘密鍵、Mnemonic、Profile password、Vault plaintext、Wallet Store の秘密部分を SDK に入力させること。
- SDK が秘密情報を保管、復号、鍵導出または raw signing すること。
- SDK、Relay または外部アプリケーションが、利用者確認なしに署名すること。
- SDK が承認 UI、署名対象の最終解釈・提示、ユーザー拒否の代行を担うこと。
- Browser Extension、Mobile App、Wallet Core または Relay server 本体を SDK に内包すること。
- Relay に署名、transaction / message の意味解釈、秘密情報処理、announce または長期履歴を担わせること。
- SDK に Symbol / NEM node、REST / WebSocket、announce、残高・履歴・資産管理を担わせること。
- SDK を汎用 blockchain SDK、Symbol SDK / NEM SDK の代替または自動 transaction builder とみなすこと。transaction construction helper の最終範囲は SDK-OPEN-004 が決める。
- dApp が任意 Relay URL、credential、session secret、内部 Account ID または transport を指定して安全境界を変更すること。
- 未対応 operation、unknown format、解析不能 transaction / message を raw signing、警告だけの承認または別 operation へ fallback すること。
- 組織向け監査・統制・カストディ、二者承認、hardware signer、MPC を v1 SDK の完了条件とすること。
- SDK 要件書で API 型、class / function、method signature、JSON schema、URL、protocol field、暗号方式、timeout 秒数、retry algorithm、内部 state machine、package directory または bundler を確定すること。

## 17. Traceability

主要要求の上流根拠は Concept、共通要件、該当する platform 要件および確定済み ADR とする。architecture、Provider / handoff / chain 仕様、Wallet Core 文書および SNIF は整合確認資料または下流引継ぎとして扱う。

| SDK 要求                                         | 上流根拠                                                                                                                                                     | 整合確認資料・既存契約                                                                                                                                             | 下流引継ぎ                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| SDK-FR-001、SDK-COMP-001、SDK-COMP-003           | Concept §8、§11；CR-007、CR-012                                                                                                                              | `docs/specifications/web-transaction-handoff-spec.md` §5.3、§6；`docs/architecture/architecture.md` §5.5                                                           | capability / version specification、Provider / Mobile support matrix          |
| SDK-FR-002〜004                                  | Concept §5、§6.3、§11；CR-003、CR-009、CR-011                                                                                                                | `docs/specifications/product-spec.md` §11、§16；BR-003〜BR-005；MR-002〜MR-004                                                                                     | connection / permission / public identity specification                       |
| SDK-FR-005、SDK-SEC-003〜005                     | Concept §6.1、§6.2、§13；CR-001、CR-NFR-001、CR-NFR-008、CR-NFR-009；BR-003、BR-004；MR-002；RR-001、RR-003、RR-005、RR-007                                  | `docs/architecture/architecture.md` §3、§5.5；handoff §7、§13                                                                                                      | request, caller binding, integrity and approval correspondence specification  |
| SDK-FR-006、SDK-FR-012、SDK-NFR-002              | Concept §6.1、§6.2、§8、§11；CR-002、CR-004、CR-005、CR-007-TX、CR-NFR-005                                                                                   | `docs/specifications/product-spec.md` §12；`docs/specifications/chain-compatibility-spec.md`；handoff §2、§7.4                                                     | transaction / chain compatibility / result verification specification         |
| SDK-FR-007                                       | Concept §2、§3、§6、§8；CR-007-MSG、CR-004；BR-005；MR-004；RR-001、RR-002                                                                                   | `docs/architecture/architecture.md` §2、§5.2；product §16；handoff §2、§5                                                                                          | message operation specification、Provider / Mobile operation contract         |
| SDK-FR-008、SDK-FR-010〜011、SDK-SEC-005〜008    | Concept §6.3、§6.4、§13；CR-006、CR-010、CR-012、CR-NFR-003、CR-NFR-009〜012；BR-005、BR-008；MR-004、MR-005、MR-012；RR-002〜RR-007、RR-NFR-002、RR-NFR-005 | handoff §7〜§13                                                                                                                                                    | result / error / lifecycle / replay specification、dApp verification guidance |
| SDK-FR-009、SDK-PLAT-002〜003、SDK-NFR-003       | Concept §4、§6.5、§8；CR-007、CR-011；BR-001〜BR-013；MR-001〜MR-013；RR-001〜RR-009                                                                         | `docs/architecture/architecture.md` §3、§5.5                                                                                                                       | Extension / Mobile / Relay cross-transport contract、milestone acceptance     |
| SDK-SEC-001〜002、SDK-SEC-007、SDK-PRIV-001〜002 | Concept §4、§9、§10、§13；CR-008、CR-013、CR-NFR-002                                                                                                         | `docs/architecture/architecture.md` §2、§3、§5；`_snwc/docs/requirements/requirements.md`；`_snwc/docs/specifications/specification.md`；RR-008                    | wallet-core binding、data boundary、Relay privacy / retention specification   |
| SDK-PLAT-001、SDK-PLAT-004〜005                  | Concept §1、§6.5、§12；CR-011、CR-NFR-006；BR-001、BR-010、BR-013；`docs/adr/0001-mainnet-evidence-lite.md`                                                  | handoff §1、§4、§5.3                                                                                                                                               | runtime / distribution / release evidence specification                       |
| SDK-COMP-002、SDK-COMP-004、SDK-OPEN-006         | Concept §8、§12、§15 OPEN-003；CR-007、CR-012                                                                                                                | handoff §4、§6、§15；BR-012、BR-013；MR-013                                                                                                                        | API / protocol compatibility matrix、deprecation and release policy           |
| SDK-OPEN-002〜005、SDK-OPEN-007                  | Concept §6.5、§12、§15 OPEN-003、OPEN-005；CR-011、CR-NFR-006、CR-NFR-008                                                                                    | `docs/specifications/web-transaction-handoff-spec.md`；`docs/requirements/relay.md` RR-OPEN-001〜002；`docs/requirements/mobile-app.md` MR-OPEN-001〜008；ADR 0001 | SDK specification、platform / transport / caller binding / release decisions  |

## 18. 参照資料

### 18.1 上流根拠

- `docs/concept/concept-sheet.md`: MosaicLynx の目的、対象利用者、署名利用シナリオ、Signer / Relay の責務境界、秘密情報保護、基本原則および未決事項。
- `docs/requirements/requirements.md`: 共通の署名能力、接続・Account・Chain / Network、秘密情報分離、署名結果検証、Platform 境界、共通 error および security 要求。

### 18.2 整合確認資料・既存外部契約

- `docs/requirements/browser-extension.md`: Browser Extension の Origin、permission、確認領域、Provider、lifecycle および Extension / wallet-core 境界。
- `docs/requirements/mobile-app.md`: Mobile App の将来 milestone、外部要求、確認・承認、OS / wallet-core / Relay 境界。
- `docs/requirements/relay.md`: Relay の受け渡し、opaque 境界、障害、改ざん、replay、秘密情報分離および未決事項。
- `docs/specifications/product-spec.md`: Product の署名確認、Provider、Chain / Network、Mainnet gate および外部可視動作。
- `docs/specifications/web-transaction-handoff-spec.md`: SDK、Extension Adapter、Mobile Relay Adapter、result / error、handoff の既存仕様。message signing を v1 対象として扱う下流整合確認先である。
- `docs/specifications/chain-compatibility-spec.md`: Symbol / NEM の chain-specific compatibility、transaction、署名および固定 vector。
- `docs/specifications/profile-account-spec.md`: Profile、Account、Network、署名認証および秘密情報の責任境界。
- `docs/architecture/architecture.md`: SDK、Provider、Extension、Mobile、Relay、Chain Adapter、Wallet Core の依存方向と責務分担。
- `_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`: Wallet Core の鍵管理、Wallet Store、秘密情報処理および raw signing の外部契約。
- `docs/adr/0001-mainnet-evidence-lite.md`: 初期 Mainnet release gate と、gate 未達成時に Mainnet を有効化しない制約。
- `_sns/packages/symbol-nem-interchange-format/doc/requirements.md`、`_sns/packages/symbol-nem-interchange-format/doc/spec-format.md`、`_sns/packages/symbol-nem-interchange-format/doc/spec-api.md`: SNIF の形式・API と責務境界の整合確認資料。SNIF は transport 非依存にデータと `id` / `replyTo` 等の correlation 情報を搬送できるが、replay 防止、freshness、使用済み管理、session binding、caller / Origin の真正性、authentication / authorization、利用者承認、署名生成・検証および transaction semantic validation を担わない。SNIF を transport に用いる場合も、Browser Provider、Deep Link / App Link、Relay 固有の安全境界を SDK 要件から消去しない。MosaicLynx SDK が SNIF を使用すること自体は、本要件では確定しない。

### 18.3 下流引継ぎ

- SDK specification: 公開契約、要求・結果形式、capability、error、lifecycle、transport adapter および versioning。
- Browser Extension / Provider specification: Origin、connection、permission、公開 Account、承認および Provider compatibility。
- Mobile App / Relay specification: Mobile handoff、caller binding、Relay の opaque 受け渡し、Mobile 側の検証・承認・署名。
- Chain compatibility / transaction inspection specification: Symbol / NEM、Mainnet / Testnet、transaction、message、aggregate / cosignature の対応範囲。
- Platform / runtime / distribution specification: browser、Node.js その他 runtime の support matrix、配布および更新互換性。
- Release policy / evidence: Mainnet capability、SDK artifact、dependency、compatibility および security evidence。
- Test specification: cross-transport contract、error、malformed input、replay、response correspondence、privacy および secret leakage。
