# MosaicLynx Relay 要件

## 1. 文書の目的と適用範囲

本書は、[MosaicLynx 共通要件](./requirements.md) に加えて、dApp とスマホアプリの間で署名要求・署名結果を受け渡す Relay に固有の要求を定義する。

署名対象の確認、利用者による明示的な承認または拒否、blind signing の禁止、秘密情報の保護、Symbol / NEM と Mainnet / Testnet の区別は共通要件およびスマホアプリ要件で定める。本書では、それらを Relay 経由でも破らないための責任境界と安全性を扱う。

Relay は MosaicLynx v1 の第4 milestone である。ブラウザ拡張機能、Android アプリ、iOS アプリ、Relay の順序、および Relay milestone の完了を MosaicLynx v1 全体の完了とする定義は、コンセプトシートと共通要件に従う。

本書は、API、データ形式、通信方式、暗号方式、インフラ、保存方式、詳細な状態遷移、実装ライブラリを確定しない。

### 1.1 要求の表記

- **MUST**: Relay の対象範囲に含まれる場合、満たさなければならない要求。
- **SHOULD**: 原則として満たすべき重要な要求。満たせない場合は理由と影響を記録する。
- **MAY**: 追加機能、optional capability または実装上の選択肢として許容される事項。MUST の要求、security boundary または受け入れ条件を弱めたり、省略したりする根拠にはならない。Relay の milestone 完了条件を免除するためには使用しない。

## 2. Relay の目的と責任境界

### 2.1 目的

Relay は、dApp からスマホアプリへ transaction signing または message signing の署名要求を受け渡し、必要に応じてスマホアプリから dApp へ対応する署名結果を受け渡すための基盤である。

MosaicLynx v1 の Relay は、共通要件で定める transaction signing と message signing の両方を必須の handoff 範囲とする。Relay は両 operation の意味を解釈せず、スマホアプリがそれぞれの要求を復号・検証・表示・承認・署名でき、dApp が対応する結果を独立検証できる受け渡し境界を提供する。

Relay の可用性より、利用者の署名安全性を優先する。Relay の障害または侵害によって署名できなくなることは許容し得るが、利用者が意図しない署名が成立する状態を生じさせてはならない。

### 2.2 Relay が担う責任

- 署名要求を dApp とスマホアプリの間で受け渡せること。
- 必要に応じて、署名結果をスマホアプリから dApp へ受け渡せること。
- E2E で保護された opaque request / response envelope と、handoff に必要な最小限の安全な metadata および transport credential の検証に必要な最小限の情報だけを扱うこと。
- 受け渡しの失敗、改ざん、差し替え、重複、遅延、要求の分離不備が、意図しない署名につながらないこと。
- Relay を信頼境界の内側に置かず、Relay が侵害された場合もスマホアプリが署名要求を検証し、利用者が承認する責任境界を維持すること。

### 2.3 Relay が担わない責任

Relay は次を担わない。

- 署名すること。
- 署名対象の意味を解釈、解析、表示すること。
- 利用者に代わって署名内容を承認すること。
- private key、Mnemonic、Profile password、復号済み Wallet Store、signing secret その他の、署名能力そのものを与える署名秘密情報を扱うこと。
- トランザクションを announce すること。
- ノードを選択すること、または継続的なネットワーク状態を管理すること。
- 署名要求や署名結果を履歴サービスとして長期管理すること。
- request / response plaintext を復号または解析すること。transaction、message signing payload、復号済み request / response、Signer に表示される意味内容または署名対象の解釈結果を取得、保持、露出してはならない。

Relay を経由する場合も、スマホアプリが要求の復号・検証、署名対象の意味解釈、利用者への確認、承認または拒否、署名を担う。dApp は返却された署名結果を独立して確認し、必要なネットワーク処理を担う。

## 3. Relay 固有の機能要求

### RR-001 署名要求の受け渡し

**MUST** Relay v1 は、dApp からスマホアプリへ、transaction signing と message signing の両方の署名要求を、安全性の確認対象として受け渡せなければならない。

Relay は要求の意味を解釈せず、スマホアプリが受信後に要求の完全性、対象、送信元、許可状態および有効性を検証できる状態で受け渡さなければならない。

operation ごとの具体的な schema、payload、transport および保護方式は本要件で定めない。未対応の operation または format を、別の operation の要求として受け渡してはならない。

### RR-002 署名結果の受け渡し

**MUST** Relay v1 は、スマホアプリが利用者の承認を経て生成した transaction signing と message signing の両方の署名結果を、元の署名要求に対応する結果として dApp へ受け渡せなければならない。

Relay は署名結果を生成、変更、承認してはならない。dApp は受け取った結果を独立して検証し、受け渡しが成功したことだけを署名の正当性の根拠としてはならない。

operation ごとの結果形式、message payload の具体形式および署名結果の wire 表現は後続仕様へ委ねる。transaction signing と message signing の結果を、相互に別の operation の成功として扱ってはならない。

### RR-003 Relay を信頼しない安全境界

**MUST** Relay または Relay との通信経路が侵害されても、Relay の応答や保存状態だけを根拠として署名を成立させてはならない。

**MUST** Relay は、E2E で保護された opaque request / response envelope と、handoff に必要な最小限の安全な metadata および transport credential の検証に必要な最小限の情報だけを扱わなければならない。Relay は request / response plaintext を復号してはならず、transaction、message signing payload、operation または署名対象の意味を解釈してはならない。Signer が利用者へ表示する内容の検証、署名対象の semantic validation、復号済み payload の解析または plaintext から署名可否を判断することも行ってはならない。

**MUST** Relay は、handoff を安全に成立させるため、envelope の受入可能な外形、request / response size、expiry / lifetime、protocol / version および operation-independent metadata の許容性、許可された envelope metadata、transport credential / authorization、request / session / result の対応、許可された lifecycle / state transition、duplicate / replay / stale state を、transport / structural validation として検証できなければならない。これらの検証は plaintext の復元・推測・意味解釈を伴わず、Signer が行う semantic validation、表示または承認の代替になってはならない。必要最小限の metadata を署名対象の意味内容の解釈が可能になる範囲へ拡大してはならない。

Relay API、storage、backup、log、diagnostics、analytics または telemetry に、平文の transaction、message signing payload、復号済み request / response、Signer に表示される意味内容または署名対象の解釈結果を出してはならない。Relay 運用者または logging infrastructure が通常経路でこれらを取得できる設計を許容してはならない。

スマホアプリは、Relay を経由した要求についても、利用者が確認・承認した要求と実際に署名する対象の対応を確認しなければならない。具体的な改ざん検出、認証、暗号化の方式は後続仕様で決定する。

### RR-004 Relay 障害時の安全側終了

**MUST** Relay の停止、通信断、タイムアウト、再起動、内部状態の消失その他の障害が発生した場合、署名連携を安全に失敗させなければならない。

少なくとも次を満たすこと。

- Relay 障害を理由に、署名対象の検証または利用者の明示的承認を省略してはならない。
- 署名結果が不明な要求を成功として扱ってはならない。
- 復旧後に古い pending request を無条件で署名処理へ復帰させてはならない。
- dApp は、受け渡しの失敗または期限切れを成功と区別できなければならない。
- 再試行する場合は、古い要求の再利用ではなく、新しい署名要求として扱えること。

具体的な期限、再試行条件、pending request の保持方法および状態遷移は後続仕様で決定する。

### RR-005 要求・結果の改ざんおよび差し替えの防止

**MUST** Relay または通信経路による次の操作が、利用者が確認した内容とは異なる署名の成立につながってはならない。

- 署名要求の改ざん。
- 署名要求の別要求への差し替え。
- 署名結果の改ざんまたは別結果への差し替え。
- 他利用者または他セッションの要求・結果への置換。

改ざんまたは対応関係の検証に失敗した場合、スマホアプリまたは dApp は安全側に終了し、署名結果を成功として扱ってはならない。具体的な検出方式は後続仕様へ委ねる。

### RR-006 Replay・重複・遅延配送への耐性

**MUST** 古い要求の replay、使用済み要求の再利用、Relay またはネットワークによる重複配送、遅延した要求の後着、Relay 再起動後の古い状態の再出現によって、追加の署名が発生してはならない。

**MUST** Relay restart、state loss または storage loss の後に、旧 request identity、旧 session identity または同一 ciphertext を新しい handoff として再登録・再処理してはならない。遅延配送された旧 request も新規 request として扱ってはならない。retry は新しい request identity を使用する新しい署名要求でなければならず、スマホアプリでは新しい利用者承認を必要としなければならない。

要求の有効性、使用済み判定、重複処理、遅延処理および再起動後の扱いは、後続仕様で一貫した安全側の規則として定義する。具体的な識別子、nonce、期限値および保存形式は本書で決定しない。

### RR-007 要求・結果の分離

**MUST** 第三者が他者の署名要求または署名結果を取得し、または別セッションの要求・結果へ置換することによって、署名安全性を破壊できてはならない。

Relay は、要求と結果が意図した dApp、スマホアプリおよび署名処理の対応関係から外れた場合に、スマホアプリまたは dApp が安全側に終了できる状態を提供しなければならない。具体的な session ID、request ID、token その他の識別方式は後続仕様で決定する。

### RR-008 署名秘密情報と transport credential の分離

**MUST** Relay は、private key、Mnemonic、Profile password、復号済み Wallet Store、signing secret その他の、署名能力そのものを与える署名秘密情報を受信、復号、処理、保持または結果・ログ・診断情報へ出力してはならない。

**MUST** Relay が handoff の認証、アクセス制御、要求・結果の対応または transport security のために bearer credential、capability token、session secret、request / response access credential、導出鍵その他の transport credential を扱う場合、それを署名秘密情報と同一視してはならず、protocol 上必要な最小限の範囲に限定しなければならない。

transport credential の raw 値、session secret または導出鍵を、URL の query / fragment、application log、diagnostics、error message、analytics、telemetry または不要な継続保存へ露出・出力してはならず、session secret や導出鍵を履歴情報として保持してはならない。handoff に必要な検証用表現を扱うこと自体は妨げないが、その具体的な形式、検証方式および保存方式は後続仕様へ委ねる。transport credential を署名能力、利用者承認または Wallet Core の代替として扱ってはならない。

### RR-009 Relay 障害・侵害時の承認責任

**MUST** Relay が利用可能であること、Relay が要求を配送したこと、または Relay が結果を返したことだけを、利用者の承認の代わりに扱ってはならない。

利用者の明示的承認はスマホアプリの管理下で行い、Relay の自動処理や復旧処理から署名を開始してはならない。

## 4. DoS および可用性に関する要求

### RR-010 DoS 時の安全性

**MUST** DoS、大量要求、過剰な接続またはその他の負荷によって Relay の可用性が低下した場合でも、次を行ってはならない。

- 要求検証の条件を緩和すること。
- 利用者の明示的承認を省略すること。
- 秘密情報を露出すること。
- 大量要求を理由に、利用者が意図しない署名を発生させること。

DoS により署名連携が利用できなくなること自体は、直ちに Relay のセキュリティ違反とは扱わない。ただし、失敗は成功と区別でき、安全側に終了しなければならない。

### RR-011 可用性と安全性の優先順位

**MUST** Relay の可用性を維持するために、署名対象の検証、要求・結果の対応確認、利用者承認、秘密情報分離の要求を弱めてはならない。

冗長化、rate limit、WAF、message broker、データベース、ロードバランサその他の可用性・負荷対策は、要件を満たすための具体的な実現方法として後続設計へ委ねる。

## 5. Relay 固有の非機能・セキュリティ要求

### RR-NFR-001 外部入力を信頼しない

**MUST** dApp、スマホアプリ、Relay、通信経路および Relay の内部状態から受け取る情報を、検証前に信頼してはならない。

### RR-NFR-002 結果不明状態を成功にしない

**MUST** Relay の応答欠落、通信切断、再起動、状態消失その他によって処理結果が不明になった場合、その状態を署名成功または承認済みとして扱ってはならない。

### RR-NFR-003 受け渡しの一時性と責任限定

**MUST** Relay は、署名要求、署名結果、transport credential および handoff に関連する metadata を、署名連携に必要な期間を越えて保持してはならない。Relay は、履歴、分析、ユーザーアカウントその他のサービス責任を持たない。

正常完了、利用者拒否、cancel、expiry、validation failure、timeout、Relay restart、Relay state loss その他の終端状態の後は、古い要求、結果、credential または metadata を再利用できない状態にしなければならない。具体的な保持期間、削除契機、再利用不能の方式および障害復旧時の扱いは後続仕様で決定する。

Relay が旧 state を失っていても、参加者側を含めた E2E の境界として、旧 request identity または旧 ciphertext の再利用を新しい handoff として許容してはならない。retry は新しい identity と新しい署名承認を伴うものとし、epoch、tombstone、nonce、persistent replay database その他の方式は後続仕様で決定する。

### RR-NFR-004 失敗情報からの秘密情報分離

**MUST** 障害、改ざん、replay、分離失敗、DoS その他の失敗を記録・通知する場合も、秘密情報やそれを復元できる情報をログ、エラー、診断情報へ含めてはならない。

この要求における秘密情報には、署名秘密情報に加え、transport credential の raw 値、session secret、導出鍵およびそれらを復元できる情報を含む。transport credential の検証用表現を扱う場合も、不要な raw 値や復元可能な情報を失敗情報へ含めてはならない。

### RR-NFR-005 安全側失敗分類の最低保証

**MUST** Relay が関与する署名連携は、成功と安全側の失敗を、dApp とスマホアプリが少なくとも安全な終了または新しい要求による再試行を判断できる形で区別できなければならない。

最低限、次の状態を成功と区別できなければならない。

- 利用者拒否。
- unsupported operation または unsupported format。
- sender / request origin の不一致。
- 許可範囲の不一致。
- request content の不一致。
- expiry、replay、duplicate または late delivery。
- Chain、Network または Account の不一致。
- parse / display inability または validation failure。
- result unknown または Relay unavailable。

これらをすべて個別の wire error code とすることは要求しない。ただし、expiry、result unknown、validation failure を署名成功・承認済み・署名結果取得済みとして扱ってはならない。古い要求を再試行に再利用してはならず、再試行する場合は新しい署名要求として扱わなければならない。具体的な error code、HTTP status、error message、再試行条件および分類の統合範囲は後続仕様で定める。

## 6. Relay の対象外

Relay の対象外は次のとおりとする。

- アカウント管理、Profile 管理、鍵管理、Mnemonic 管理。
- トランザクションの解析、意味解釈、表示、署名。
- 利用者の承認、承認状態の決定、承認の代行。
- トランザクションの announce、blockchain node の選択、blockchain 状態の監視。
- ユーザーアカウントサービス、OAuth / OIDC、管理画面、課金。
- 履歴サービス、analytics、telemetry。
- Push Notification を必須とすること。
- Relay をカストディサービスまたは署名サービスとして扱うこと。
- Relay の障害時に、検証や承認を省略して署名を継続すること。
- HTTP / HTTPS API、WebSocket、polling、Deep Link、Universal Link、App Link、QR、token、nonce、MAC、デジタル署名、E2E encryption などの具体方式を本書で確定すること。
- Redis、RDB / NoSQL、message broker、WAF、ロードバランサ、Kubernetes、Docker 等のインフラ構成を本書で確定すること。

Relay が利用できない場合の代替経路、redirect、Deep Link、QR、Relay 導入前の Mobile 接続方式は、共通コンセプトおよびスマホアプリ要件に従い、後続の要件・仕様・設計で必要性と方式を整理する。本書は特定の fallback を要求しない。

## 7. Relay の受け入れ条件

| ID        | 関連要求                                              | 受け入れ可能な状態                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RR-AC-001 | RR-004、RR-NFR-002、RR-NFR-005                        | Relay が停止、通信断、タイムアウト、再起動または内部状態消失になった場合、署名連携が成功扱いにならず、検証・承認を省略せずに安全側へ終了する。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| RR-AC-002 | RR-005、RR-007、RR-NFR-001                            | Relay または通信経路で署名要求・署名結果が改ざん、差し替えまたは別セッションへ置換された場合、利用者が確認した内容と異なる署名が成立しない。Relay は request / response を opaque envelope として扱い、内容を解釈しない。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| RR-AC-003 | RR-006、RR-NFR-005                                    | replay、使用済み要求の再利用、重複配送、遅延配送、再起動後の古い状態の再出現によって追加の署名が発生しない。restart / state loss 後の旧 identity または同一 ciphertext の再登録・再処理も拒否され、retry は新しい identity と新しい利用者承認を必要とする。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| RR-AC-004 | RR-007、RR-NFR-001、RR-NFR-005                        | 第三者が他者または他セッションの要求・結果を取得・置換しても、対応関係の検証失敗として安全側に終了し、別の署名成功へ変換されない。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| RR-AC-005 | RR-010、RR-011                                        | DoS や大量要求によって可用性が低下しても、検証条件、承認要求、署名秘密情報・transport credential の保護が緩和されず、意図しない署名が発生しない。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| RR-AC-006 | RR-003、RR-008、RR-NFR-004                            | Relay が opaque request / response envelope と必要最小限の metadata だけを扱い、request / response plaintext の復号、transaction・message signing payload・operation・署名対象の意味解釈、Signer 表示内容の検証、semantic validation、復号済み payload の解析または plaintext に基づく署名可否判断を行わない。一方、envelope 外形・size・expiry / lifetime・許可された metadata・credential authorization・request / session / result の対応・許可された state transition・duplicate / replay / stale state 等の transport / structural validation を行え、その検証が plaintext の復元や意味解釈につながらない。平文 request / response、transaction、message payload または復号結果が API response、storage、backup、log、diagnostics、analytics、telemetry に現れず、Relay 運用者や logging infrastructure の通常経路で取得できない。署名秘密情報を受信・処理・保持せず、署名、利用者承認、announce、node 選択または継続的な blockchain 状態管理も担っていない。transport credential は必要最小限に限る。 |
| RR-AC-007 | RR-001、RR-002、RR-003、RR-009                        | スマホアプリが Relay 経由の transaction signing と message signing の要求を自ら復号・検証・表示し、利用者の明示的承認と必要な認証条件を経た場合だけ、対応する署名を実行できる。Relay が配送したことだけで署名を開始しない。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| RR-AC-008 | RR-002、RR-005、RR-NFR-005、CR-AC-004〜006、CR-AC-015 | dApp が transaction signing と message signing の署名結果を、元の要求、署名者、Account、Chain、Network および operation との対応を含めて独立検証でき、受け渡し成功だけを署名成功の根拠にしていない。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| RR-AC-009 | RR-001、RR-002、CR-AC-004、CR-AC-005、CR-AC-015       | 正常な transaction signing handoff で、dApp からの元要求がスマホアプリへ届き、利用者の承認後に生成された署名結果が、元の request、signer、Account、Chain、Network に対応する結果として dApp へ返る。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| RR-AC-010 | RR-001、RR-002、CR-AC-004、CR-AC-006、CR-AC-015       | 正常な message signing handoff で、dApp からの元要求がスマホアプリへ届き、利用者の承認後に生成された署名結果が、元の request、signer、Account、Chain、Network および message signing operation に対応する結果として dApp へ返る。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| RR-AC-011 | RR-006、RR-NFR-003、RR-NFR-004、RR-NFR-005            | 正常完了、利用者拒否、cancel、expiry、validation failure、timeout、Relay restart、Relay state loss その他の終端状態の後に、古い request、result、transport credential または関連 metadata が再利用できず、履歴・分析・ユーザーアカウントサービスとして保持されない。同一 identity または同一 ciphertext の再送は新しい handoff として復活せず、retry は新しい identity と新しい署名承認を必要とする。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| RR-AC-012 | RR-004、RR-006、RR-NFR-002、RR-NFR-005                | 利用者拒否、unsupported operation / format、sender / request origin 不一致、許可範囲不一致、content mismatch、expiry、replay、duplicate、late delivery、Chain / Network / Account mismatch、parse / display inability、validation failure、result unknown、Relay unavailable を成功と区別できる。再試行は古い request、identity または ciphertext を再利用せず、新しい request と新しい利用者承認として判断できる。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## 8. Traceability

上流根拠は Concept Sheet と共通要件に限定する。Mobile / Browser Extension 要件、Architecture、Product Specification は兄弟要件または整合確認資料として扱い、Web Transaction Handoff Specification、Relay protocol / SDK / implementation は下流引継ぎまたは実装 evidence として扱う。

| 要求 ID    | 上流根拠                                                          | 適用主体                        | 整合確認資料・外部契約                                                 | 下流引継ぎ                                                                                  | 受け入れ条件                                          |
| ---------- | ----------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| RR-001     | Concept §6.1、§8；CR-001、CR-007、CR-007-TX、CR-007-MSG           | Relay / End-to-End              | Mobile MR-002〜MR-004；Architecture §3、§5.5                           | Web handoff、Relay protocol、Mobile handoff                                                 | RR-AC-007、RR-AC-009、RR-AC-010                       |
| RR-002     | Concept §6.4、§7、§8；CR-006、CR-007、CR-012                      | Relay / End-to-End / dApp       | Mobile MR-004、MR-012；Browser Extension BR-005；Architecture §3、§5.5 | result contract、dApp verification、Web handoff                                             | RR-AC-008、RR-AC-009、RR-AC-010                       |
| RR-003     | Concept §9、§13；CR-011、CR-NFR-009、CR-NFR-012                   | Relay / Mobile / dApp           | Mobile MR-002〜MR-005；Architecture §3                                 | opaque envelope / transport validation / integrity / authentication / handoff specification | RR-AC-002、RR-AC-004、RR-AC-006                       |
| RR-004     | Concept §6.3、§11、§13；CR-010、CR-NFR-010、CR-NFR-011            | Relay / Mobile / dApp           | Mobile MR-005、MR-012；Browser Extension BR-007、BR-008                | failure / lifecycle / retry specification                                                   | RR-AC-001、RR-AC-003、RR-AC-012                       |
| RR-005     | Concept §6.2、§6.3、§13；CR-NFR-009、CR-NFR-012                   | Relay / Mobile / dApp           | Mobile MR-002、MR-005；Architecture §3                                 | request / result integrity specification                                                    | RR-AC-002、RR-AC-004、RR-AC-008                       |
| RR-006     | Concept §6.3、§11、§13；CR-NFR-010、CR-NFR-011                    | Relay / Mobile / dApp           | Mobile MR-005；Browser Extension BR-007、BR-008                        | freshness / replay / duplicate specification                                                | RR-AC-003、RR-AC-011、RR-AC-012                       |
| RR-007     | Concept §13；CR-NFR-008、CR-NFR-009、CR-NFR-012                   | Relay / Mobile / dApp           | Mobile MR-002、MR-003；Browser Extension BR-003、BR-004                | session / request correlation specification                                                 | RR-AC-002、RR-AC-004、RR-AC-008                       |
| RR-008     | Concept §9、§13；CR-008、CR-NFR-002                               | Relay / Mobile / dApp           | Mobile MR-003、MR-012；Architecture §3、§5.5                           | credential / secret boundary、handoff security specification                                | RR-AC-006、RR-AC-011                                  |
| RR-009     | Concept §6.3、§11、§13；CR-003、CR-011                            | Relay / Mobile                  | Mobile MR-004〜MR-006；Architecture §3                                 | Mobile approval / authentication specification                                              | RR-AC-001、RR-AC-007                                  |
| RR-010     | Concept §11、§13；CR-010、CR-NFR-001、CR-NFR-002                  | Relay / Operations              | Architecture §3；Relay operation design                                | DoS / availability operation specification                                                  | RR-AC-005                                             |
| RR-011     | Concept §11、§12、§13；CR-010、CR-NFR-006、CR-NFR-010、CR-NFR-011 | Relay / Operations              | `docs/adr/0001-mainnet-evidence-lite.md`；Architecture §3              | availability / release / failure specification                                              | RR-AC-001、RR-AC-005                                  |
| RR-NFR-001 | Concept §13；CR-NFR-001                                           | Relay / Mobile / dApp           | Mobile MR-002；Browser Extension BR-003；Architecture §3               | input validation specification                                                              | RR-AC-002、RR-AC-003、RR-AC-004、RR-AC-012            |
| RR-NFR-002 | Concept §6.3、§13；CR-010、CR-NFR-010、CR-NFR-012                 | Relay / Mobile / dApp           | Mobile MR-005、MR-012；Web handoff failure contract                    | result-unknown / failure specification                                                      | RR-AC-001、RR-AC-007、RR-AC-012                       |
| RR-NFR-003 | Concept §10、§13；CR-008、CR-011、CR-NFR-002、CR-NFR-011          | Relay / Operations / End-to-End | Mobile MR-003、MR-012；Architecture §3                                 | retention / deletion / state-loss reuse prevention specification                            | RR-AC-003、RR-AC-006、RR-AC-011                       |
| RR-NFR-004 | Concept §13；CR-008、CR-NFR-002                                   | Relay / Operations              | Mobile MR-003；Architecture §3、§5.5                                   | logging / diagnostics / privacy specification                                               | RR-AC-006、RR-AC-008、RR-AC-011                       |
| RR-NFR-005 | Concept §6.3、§11、§13；CR-012、CR-NFR-010、CR-NFR-011、CR-AC-015 | Relay / Mobile / dApp           | Mobile MR-005、MR-012；Web handoff §10                                 | error taxonomy / retry / dApp handling specification                                        | RR-AC-001、RR-AC-003、RR-AC-007、RR-AC-008、RR-AC-012 |

## 9. Relay 固有の未決事項

### RR-OPEN-001：Relay の受け渡し契約と milestone 完了条件

- 確定事項: Relay v1 が受け渡す operation は transaction signing と message signing の両方である。operation の対象範囲そのものは未決事項ではない。
- 論点: 両 operation の外部 handoff 契約、dApp・スマホアプリ間で保証する共通結果、Relay milestone の個別完了条件および MosaicLynx v1 全体の完了判定への接続。
- 後続判断が必要な理由: operation ごとの具体的な要求・結果形式、Mobile 側の検証・承認範囲、dApp が独立検証できる結果の境界に影響するため。
- 主な選択肢: 共通要件の両 operation に同じ安全境界を適用する、operation ごとに milestone の詳細完了条件を分ける。
- Relay milestone 完了の最低条件: Relay 固有の全 MUST、`RR-AC-001`〜`RR-AC-012` の全受け入れ条件、および Relay に適用される共通 `CR-AC-*`（少なくとも `CR-AC-004`、`CR-AC-005`、`CR-AC-006`、`CR-AC-007`、`CR-AC-009`、`CR-AC-011`〜`CR-AC-016`）を満たすこと。これらは必要条件であり、MAY の採用または未採用によって免除されない。MosaicLynx v1 全体の完了判定や具体的な release process / test runner は共通要件・後続の release 文書へ委ねる。

### RR-OPEN-002：Relay 障害時の利用者・dApp 向け失敗境界

- 論点: Relay の停止、期限切れ、結果不明、再試行可能な失敗を、利用者と dApp がどの粒度で区別し、どの条件で新しい署名要求として再試行できるか。
- 後続判断が必要な理由: 失敗を成功と誤認しないこと、古い要求を再利用しないこと、Relay unavailable 時の v1 の利用可能範囲に影響するため。
- 主な選択肢: 失敗・期限切れを共通の終了として扱う、再試行可能性を分けて示す、dApp の再試行判断へ委ねる範囲を定める。
- 下限: 分類の粒度や wire error code を未決としても、`RR-NFR-005`、`RR-AC-001`、`RR-AC-003`、`RR-AC-012` より弱い保証にしてはならない。expiry、result unknown、validation failure は成功として扱わず、再試行は新しい request としなければならない。

## 10. 下流工程への引継ぎ

1. `RR-OPEN-001` で、transaction signing と message signing の両 operation を前提に、Relay が v1 で保証する handoff 契約と個別 milestone の完了条件を決定する。operation 範囲を縮小する判断は本書の下流引継ぎに含めない。
2. `RR-OPEN-002` で、障害・期限切れ・結果不明・validation failure 時の外部から観測できる失敗境界を決定する。`RR-NFR-005` の最低保証を弱めず、Relay の具体的な fallback 方式は本書で決定しない。
3. 署名秘密情報と transport credential の分類、改ざん検出、要求・結果の分離、replay 防止、重複・遅延処理および credential の検証用表現の具体的な契約を、承認後の仕様で定義する。
4. bounded retention の保持期間、削除・再利用不能の方式、終端状態、expiry、cancel、restart / state loss 後の扱いを、具体的 storage / purge / backup 方式を固定せずに仕様へ引き継ぐ。
5. HTTP / HTTPS API、通信方式、データ形式、認証・暗号方式、rate limit、インフラ構成およびテストを基本設計・詳細設計・仕様へ引き継ぐ。API、schema、暗号方式、storage、infra、retry interval、HTTP status は本書で決定しない。
6. `docs/specifications/web-transaction-handoff-spec.md` では transaction signing と message signing の両 operation を v1 対象として扱い、共通要件・本書との operation 範囲の整合を維持する。
7. `OPEN-003` の4 milestone 個別完了条件および `OPEN-005` の Mainnet 公開条件と、本書の受け入れ条件を整合させる。Relay milestone の最低条件は `RR-OPEN-001` に記載した Relay 固有 MUST、全 `RR-AC-*` および適用される全 `CR-AC-*` であり、MAY はこの条件を弱めない。

## 11. 参照資料

### 11.1 上流根拠

- [MosaicLynx Concept Sheet](../concept/concept-sheet.md): MosaicLynx の目的、v1 milestone、Signer / Relay の責任境界、セキュリティ原則および未決事項。
- [MosaicLynx 共通要件](./requirements.md): 共通要求、CR-*、共通受け入れ条件、Signer / Relay の責任境界および共通未決事項。

### 11.2 整合確認資料

以下は Relay 要求との整合を確認する資料であり、Relay 要求の上流根拠ではない。

- `docs/specifications/product-spec.md`: Relay を含む製品の範囲と外部可視動作。
- [MosaicLynx スマホアプリ要件](./mobile-app.md): Mobile が Relay 経由の要求を復号・検証・表示・承認・認証確認・署名する責任境界。
- [MosaicLynx ブラウザ拡張機能要件](./browser-extension.md): dApp、Signer、署名要求・結果および announce の責任境界。
- `docs/architecture/architecture.md`: Relay、Mobile App、MosaicLynx SDK および dApp の責務分離。

### 11.3 下流引継ぎ・実装 evidence

- `docs/specifications/web-transaction-handoff-spec.md`: SDK、Mobile handoff、Relay の API・protocol・暗号化・状態契約を具体化する仕様。transaction signing と message signing の両 operation を v1 対象とする本要件・共通要件との整合確認先である。
- `packages/relay-protocol/`、`packages/sdk/`、`apps/relay/`: Relay protocol、SDK adapter、Relay server の後続実装および整合確認先。これらの実装・テストの存在だけを本要件の上流根拠とはしない。
