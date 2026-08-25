# MosaicLynx 共通セキュリティ設計書

## 1. 目的

本書は、Browser Extension、Mobile App、Relay、SDK および `symbol-nem-wallet-core` を含む MosaicLynx 全体で共有するセキュリティ原則、信頼境界、秘密情報の責任分界、署名承認ルールおよび安全側の失敗条件を定める共通設計書である。

MosaicLynx は秘密鍵を扱う署名器であるため、可用性や利便性よりも、秘密情報の保護、利用者の明示的な意思確認、署名対象の完全性および fail-closed を優先する。本書の MUST / MUST NOT は、下位設計・実装・運用が必ず満たす共通の安全条件である。

本書は暗号方式、API、画面遷移、データ形式または実装コードを定めるものではない。下位設計が未確定の事項は、本書の原則を弱めない範囲で委譲または OPEN とする。

## 2. 適用範囲と責務の境界

### 2.1 適用範囲

対象は、次の主体をまたぐ署名要求と署名結果の End-to-End 境界である。

- Browser Extension とその Provider / privileged layer
- Mobile App とその外部受け渡し境界
- `@mosaiclynx/sdk` を含む SDK
- Relay とその短期受け渡し状態
- Symbol / NEM の transaction inspection と署名 orchestration
- `symbol-nem-wallet-core` との秘密情報処理境界
- Profile、Account、permission、session、backup および release のセキュリティ責任

現在のワークスペースに Mobile App の実装は存在しない。Mobile に関する本書の記述は共通設計上の責任と安全条件であり、実装済み機能や検証済み capability を意味しない。

### 2.2 本書で決めない事項

次は本書の対象外であり、対応する下位設計へ委譲する。

- Wallet Core の暗号アルゴリズム、KDF、DEK / KEK、Wallet Store 内部形式、メモリ消去実装
- Browser Extension / Mobile 固有の OS API、画面遷移、UI レイアウト、具体的なタイムアウト値
- Relay のプロトコル詳細、wire format、Redis key、TTL、キャッシュ方式および実装構造
- SDK の具体的 API 名、wire 契約、transport 選択順および error code
- Symbol / NEM の transaction schema、byte 列、対応 type / version の詳細仕様
- GitHub Actions の SHA pin、SBOM、成果物署名などの release operation 詳細

これらを理由に、署名確認、認証、秘密情報分離、完全性検証または replay 防止を省略してはならない。

### 2.3 用語と規範

- **MUST / MUST NOT**: 必須または禁止する安全条件。
- **SHOULD / SHOULD NOT**: 原則として満たす条件。満たせない場合は理由と影響を記録する。
- **MAY**: 安全条件を弱めない範囲で許容される事項。
- **Signer**: Browser Extension または Mobile App。署名対象の解析、表示、承認、認証および Wallet Core 呼び出しを担う。
- **Wallet Core**: 鍵管理、Wallet Store、秘密情報を使用する暗号処理および raw byte signing の正本である `symbol-nem-wallet-core`。

## 3. 前提・責任分界

### 3.1 信頼の前提

Wallet Core、Browser Extension 本体および Mobile App 本体は、設計上の trusted component とする。ただし、trusted component に届く入力や、そこから得る外部由来の値まで自動的に信頼してよいという意味ではない。

OS Secure Storage は限定的に信頼する。保存場所としての機密性・完全性・可用性の保証範囲、端末状態、バックアップ、復元および OS の認証 capability は platform ごとに評価し、OS の存在だけで秘密鍵保護を保証したり、署名承認を代行させたりしない。

SDK、dApp / Web page、Deep Link 入力、Relay、Symbol / NEM ノード、外部 API は信頼しない。署名器の外部から入るデータは、経路、形式、送信元の自己申告、表示文言を問わずすべて untrusted input として扱う。

### 3.2 主体ごとの責任

| 主体                           | 担う責任                                                                                                                    | 担わない責任                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Browser Extension / Mobile App | 外部入力の検証、caller / permission / session、署名対象の解析・表示、利用者承認、再認証、署名 orchestration、結果の対応確認 | Wallet Core の暗号・KDF・Wallet Store 内部仕様の再実装             |
| Wallet Core                    | 鍵管理、暗号処理、Wallet Store 契約、公開 identity、承認済み raw bytes の署名                                               | 利用者向け表示、dApp 接続、permission、承認判断、Relay、OS 固有 UI |
| SDK                            | 外部アプリとの受け渡し、結果 correlation、公開契約、失敗の安全な伝達                                                        | 秘密情報の取得・保存・復号、最終的な意味解析、表示、認証、署名     |
| Relay                          | 暗号化された要求・結果の配送と短期状態の構造検証                                                                            | 秘密情報、意味解釈、署名、認証、承認の代行、announce               |
| dApp / Web page                | 要求の発行、受信結果の独立検証、必要な network 処理                                                                         | 秘密情報の取得、Signer の認証・承認の省略                          |
| Node / 外部 API                | 補助的な network 情報の提供                                                                                                 | 署名可否、承認、署名結果の正当性の単独根拠                         |

Relay や SDK が侵害されても、秘密鍵を取得できず、利用者の確認・再認証を経ない署名へ直結しない構造を MUST とする。

## 4. Threat Model

### 4.1 保護対象

- private key、mnemonic、復号用鍵、パスコード由来の秘密情報
- Wallet Store、復号済み秘密情報および署名用の一時データ
- 利用者が確認した署名対象と、実際に署名する payload の一致
- Account、Chain、Network、caller、permission、session および request の対応
- 署名承認、認証状態、署名結果および replay 防止状態
- 接続元と公開を許可した Account の関係
- 秘密情報・Sensitive 情報の confidentiality、integrity、retention

### 4.2 想定攻撃者

- 悪意のある dApp、Web page、Provider 利用コードまたは SDK 利用者
- 侵害・改ざんされた SDK、Relay、Deep Link、外部 API または node
- 悪意のある node response、古い要求の再送、要求の差し替え、結果の取り違えを試みる主体
- phishing 用のアプリ名、アイコン、HTML、Markdown、説明文または URL を提示する主体
- 不正な同時要求、別 Account / Network への状態流用、認証後の payload 差し替えを試みる主体

本書は、正規配布物や trusted host 本体そのものが完全に侵害された場合の全面的な保証を主張しない。その場合は Software Integrity と Incident Recovery の境界で検知、署名停止、session 無効化および鍵移行を行う。

### 4.3 主要 attack surface と緩和

| Attack surface                         | 主要脅威                                       | 共通の緩和                                                                                |
| -------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Provider、SDK、Deep Link、Relay        | 要求の改ざん、差し替え、replay、caller 偽装    | 完全性、期限、requestId、caller、permission、Chain / Network / Account を Signer で再検証 |
| Confirmation / Authentication UI       | phishing、外部文言による誤認、認証の横取り     | MosaicLynx 自身の UI、外部 HTML / Markdown の不使用、署名ごとの再認証                     |
| Transaction inspection                 | 未知 type、parse 差異、表示と payload の不一致 | chain-specific parse / validate、表示内容の生成、canonical 対応確認、解析不能時の拒否     |
| Wallet Core Binding / host memory      | 秘密情報の不要な複製、長期保持、誤った暗号実装 | Wallet Core を正本とし、host の一時 lifecycle と公開境界を管理、内部暗号を再実装しない    |
| Storage、backup、clipboard、screenshot | Secret の漏えい、削除後の復元                  | 暗号化形式、明示操作、再認証、最小保持、clipboard / preview / temp file の制限            |
| Node / 外部 API                        | 悪意のある補助情報、wrong network、可用性依存  | node を信頼せず、ローカル解析を署名判断の根拠とし、失敗時は fail closed                   |
| Update / migration / release           | 改ざん、依存関係経由の侵害、平文退避           | 正規配布、改ざん検出、version 管理、厳格なレビュー、平文 migration の禁止                 |

## 5. Trust Boundary

```text
外部・信頼しない領域
  dApp / Web page / SDK / Provider / Deep Link / Relay / Node / 外部 API / network
                    │ すべて untrusted input
                    ▼
MosaicLynx trusted host boundary
  Browser Extension 本体 / Mobile App 本体
  caller・permission・session・request integrity
  Chain・Network・Account の整合性
  transaction inspection・表示・明示承認・再認証
                    │ approved raw payload のみ
                    ▼
Wallet Core logical / API boundary
  鍵管理・Wallet Store 契約・秘密情報を使用する暗号処理・raw signing
```

Wallet Core を信頼することは、Application の承認を Wallet Core に代行させることを意味しない。Wallet Core は契約に従って秘密情報処理と署名を実行し、利用者の意思確認、caller、permission、表示および fail-closed は MosaicLynx host の責任である。Binding 自体が host runtime、WASM memory、JavaScript buffer、別 process または hardware から秘密情報を自動的に隔離・消去することも前提にしない。

## 6. Key Lifecycle

### 6.1 保持主体と生成・import

- private key と mnemonic を永続保持できるのは、Browser Extension / Mobile App の鍵保管領域だけとする。
- SDK、dApp、Relay、外部 API に private key、mnemonic、復号鍵または password を渡してはならない。
- Wallet Core は暗号処理中に秘密鍵を扱うが、平文の秘密情報を永続保存しない。永続化する場合は Wallet Core が提供する安全な暗号化形式を host の保管領域で扱う。
- アプリ内で新規秘密鍵を生成でき、mnemonic import と raw private key import を許可する。
- import は MosaicLynx 自身の UI で利用者が明示的に行う。外部アプリ、SDK、dApp からの自動 import は禁止する。

Symbol と NEM の Account / Key Identity は別々に管理する。Account は Chain、Profile が固定する Network および chain-specific な Key Identity に明示的に関連付ける。mnemonic から導出する場合は対象 Chain を明示し、その Chain に対応する導出契約を使用する。Symbol 用に導出した秘密鍵を NEM 用として、または NEM 用に導出した秘密鍵を Symbol 用として暗黙に利用する Account model は採用しない。具体的な導出 path、algorithm、library、address 導出および Wallet Store 形式は Wallet Core / Chain integration へ委譲する。

### 6.2 保存・処理・破棄

- private key / mnemonic を平文で永続保存してはならない。
- Browser Extension / Mobile App は Wallet Core の暗号仕様を独自再実装せず、固定された契約を利用する。
- 平文秘密鍵をアプリ全体の共有状態、Provider、Content Script、長寿命 object、URL、通知または長期 cache に保持してはならない。
- 署名、復号、export 等の処理が終わったら、復号済み秘密情報を可能な限り速やかに破棄する。
- lock、session 期限切れ、revoke、account 削除時は、復号済み秘密情報、一時認証状態、該当 session および不要な cache を無効化・削除する。
- cryptographic erasure を基本とし、物理的完全消去を保証できない storage の性質を隠さない。

Wallet Core の KDF、AEAD、salt、nonce、DEK / KEK、Wallet Store schema および zeroization の具体仕様は Wallet Core の責務であり、本書では再設計しない。

### 6.3 Backup / export への入口

backup / export は利用者の明示操作時だけ実行でき、外部要求から起動してはならない。実行前に再認証し、秘密情報の表示・出力は専用の trusted UI で行う。形式、暗号化および migration は §13 と Wallet Core / platform 下位設計に従う。

## 7. Lock / Authentication Model

### 7.1 共通状態

- Browser Extension / Mobile App は、起動、再起動、reload、process recreation、Browser Extension の extension reload または browser restart 後に MUST `LOCKED` とする。利用者の明示認証なしに `UNLOCKED`、署名可能状態または以前の認証済み状態へ移行・復帰してはならない。
- 利用者認証後だけ UNLOCKED とする。
- 明示的な lock と、一定時間の非操作等による自動 lock を提供する。具体的な時間値は platform 設計へ委譲する。
- Browser Extension はブラウザ再起動・拡張機能再ロード時に lock する。
- 外部の署名要求を受信しただけで unlock してはならない。unlock は利用者主体の操作とする。
- 署名ごとに再認証を必須とし、自動署名を許可しない。接続済み permission、既存 session または直前の認証を別 request に流用してはならない。
- lock 時は復号済み秘密情報と一時認証状態を破棄する。

### 7.2 Platform 差異

- Browser Extension は利用開始前にパスコード設定を必須とし、パスコード未設定では利用開始できない。署名ごとにパスコードを再入力する。
- Mobile は PIN / パスコードを利用でき、生体認証も利用できる。生体認証の具体的な API、credential 保管、fallback および lifecycle は Mobile 設計へ委譲する。

### 7.3 Brute-force protection

- パスコード照合を単純な高速 hash だけで実装せず、鍵導出・照合方式は Wallet Core の契約に従う。
- 認証失敗を無制限かつ高速に試行できないようにし、連続失敗には段階的な待機時間を設ける。
- アプリ再起動だけで失敗状態を容易にリセットできないようにする。
- 認証失敗を理由に秘密鍵を自動削除せず、エラー文言から内部状態を推測できないようにする。
- Mobile は利用可能な OS 認証・rate limit を優先できる。dApp、SDK、Relay は認証試行を直接実行できない。

## 8. Signing Authorization / Blind Signing

### 8.1 承認の必須条件

署名前に、Signer 自身が署名対象を解析・検証し、trusted UI で利用者に表示して確認を求める。外部アプリが渡す表示用文言、app 名、icon、説明文または raw payload の自己申告を署名判断の根拠にしてはならない。

MosaicLynx 自身が署名対象から確認情報を生成し、利用者が確認した内容と Wallet Core に渡す実際の payload が一致することを、署名直前にも検証する。確認情報の生成後に payload、caller、Account、Chain または Network が変化した場合、承認を無効化して再確認する。

署名対象に存在する security-relevant field は、対象 Chain / operation に応じてすべて利用者が確認可能でなければならない。Signer は適用可能な field を解析し、意味を解釈し、trusted UI に表示できない場合は署名してはならない。field を意図的に省略・隠蔽してはならない。具体的な field 一覧、表示順および UI は Chain integration / platform 設計へ委譲する。

外部から取得する補助情報がなくても、署名対象そのものから判断できる重要情報は必ず表示する。補助情報の取得失敗を理由に、署名対象の事実を誤って表示してはならない。必須の確認情報を安全に生成・表示できない場合は署名しない。

例として、対象 Chain / operation に適用される次の情報を確認可能にする。

- Network、Transaction type、Recipient、Amount / Mosaic、Fee、Deadline、Message
- Aggregate 内部 Transaction
- Metadata の変更内容、権限変更、その他の資産・状態変更に関わる情報

解釈できないフィールド、省略された危険な情報、取得できなかった必須情報を隠してはならない。

### 8.2 Blind Signing

- Blind Signing は原則禁止する。
- MosaicLynx が解析し、安全に表示できない署名対象には署名しない。
- 未知の Transaction Type、対象外 version、parse / validate 不能な raw payload は拒否する。
- raw payload だけの要求も、安全に解釈できなければ拒否する。
- 通常モードで警告だけを表示して bypass できる経路を設けない。
- 将来 developer mode を設ける場合は、本書を変更せず別途脅威分析・設計・承認を行う。

### 8.3 Message signing の共通原則

Message signing では、対象 protocol / operation が要求する署名文脈を維持しなければならない。適用される security context には、検証済み caller / origin、Account、Chain / Network、purpose / operation、message contents、freshness information、nonce および domain separation が含まれる。すべての operation が全項目を要求するとは限らないが、対象 operation が要求する文脈を MosaicLynx が検証・表示できない場合は署名しない。

ここでいう message-level の署名文脈は、request-level の `requestId` / `createdAt` / `expiresAt` による受け渡し要求の相関・期限・replay 防止とは別のセキュリティ層である。signed message 自体の replay、cross-domain および cross-purpose protection も、対象 protocol / operation の文脈として維持・検証する。具体的な API、wire schema、encoding、nonce format、domain separator の値、expiresAt の値および serialized message format は既存仕様と下位設計へ委譲する。

## 9. External Request / Permission Model

- 接続元ごとに permission を分離し、Browser Extension は origin 単位を基本とする。
- Mobile は Deep Link、Relay、アプリ識別子等の識別可能な caller 単位で扱う。外部が自己申告した文字列だけで caller verified としてはならない。
- 接続時に利用者が利用 Account を選択し、接続元へ公開するのは許可した Account の公開情報だけとする。
- 接続許可と署名許可は別物である。接続済みでも署名は毎回確認・再認証する。
- permission は利用者が revoke でき、revoke 時点で無効化する。
- 外部側から Account、scope、Chain、Network または権限範囲を勝手に拡張できない。
- account、caller、session、permission、Chain / Network を署名要求ごとに明示的に紐付ける。

## 10. Replay / Concurrent Request

### 10.1 Replay protection

外部署名要求には requestId、createdAt、expiresAt を持たせる。期限切れ要求は拒否し、処理済み requestId は再処理しない。同一 requestId で内容が異なる要求は改ざんまたは衝突として拒否する。Relay、Deep Link、SDK など経路によらず同じ原則を適用し、署名結果を元 requestId に紐付ける。保存期間・cache 方式・永続性は下位設計へ委譲する。

### 10.2 Concurrent request / approval isolation

- request ごとに独立した requestId と状態を持つ。
- 同時要求を混在させず、confirmation UI に caller、Account、Network、transaction を request 単位で明示する。
- ある request の承認結果、認証結果、署名結果を別 request に流用しない。
- パスコード入力後に署名対象を別 request へ差し替えない。
- confirmation 開始後に payload が変更された場合は承認を無効化し、再確認する。
- 1回の利用者承認を複数 request に適用しない。
- account ごと、接続元ごと、Network ごとに状態を分離する。別 Account / Network へ切り替えたとき、以前の署名要求・一時認証・承認状態を継続しない。
- Browser Extension の複数タブ要求、Mobile の複数 Relay / Deep Link 要求をそれぞれ独立した request / session として扱う。
- ある接続元の permission、session または承認状態を別の接続元へ流用しない。

不変原則は次のとおりである。

> 1 request = 1 confirmation = 1 authentication = 1 signing operation

## 11. Relay / Node / External API Trust Model

### 11.1 Relay

Relay は信頼しない。Relay は配送のみを担当し、private key / mnemonic を受け取らず、Relay 側で署名、transaction の意味解釈、承認または認証を行わない。

Relay から届くデータはすべて untrusted input として Signer が再検証する。Relay が要求を書き換え、差し替え、遅延、重複または結果を取り違えても、完全性・requestId・期限・caller・permission・payload の検証により検出または拒否できなければならない。Relay 障害・侵害だけでは資産移動が成立してはならない。

TLS を必須とし、Relay 上のデータ保持は必要最小限とする。TLS、opaque envelope、認証、期限、サイズ、回数、状態遷移、保存期間および protocol format の詳細は Relay 設計へ委譲する。

### 11.2 Node / network

Symbol / NEM ノードは信頼しない。node response、dApp / node から渡された payload、fee、metadata、namespace、mosaic 情報等は外部入力または補助情報として検証する。

- Network Type / Network ID の不一致を検出して拒否する。
- payload をそのまま表示・署名せず、Wallet Core および chain-specific inspection の parse / validate 結果を確認 UI に使う。
- 補助情報の取得失敗が署名内容の誤認や検証省略につながらないようにする。
- node が悪意を持っていても、利用者が確認していない内容への署名が成立しない構造にする。
- HTTPS を利用可能な通信では原則 HTTPS を使用する。可用性障害を理由に検証を省略しない。

### 11.3 SDK / 外部 API

SDK と外部 API は信頼しない。SDK は秘密情報、認証、最終的な署名判断または表示を扱わず、外部からの要求と結果を Signer が検証できる境界で受け渡す。外部 API の応答は補助情報に留め、署名可否の単独の根拠にしない。

## 12. Sensitive Data / Logging / Retention

### 12.1 情報分類

| 分類      | 例                                                                    | 取扱い                                                                                           |
| --------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Secret    | private key、mnemonic、復号用鍵、パスコード由来の秘密情報             | 必要な期間だけ trusted host / Wallet Core 境界で扱う。外部送信・ログ出力・永続平文保存を禁止する |
| Sensitive | Account と caller の紐付け、permission、session、Relay の一時識別情報 | 必要最小限のみ保持し、外部送信・ログ出力は原則行わない。期限切れ・revoke・lock で無効化する      |
| Public    | address、public key、network、公開済みオンチェーン情報                | 公開可能だが、目的なく記録・公開しない。Secret / Sensitive と結び付く文脈は保護する              |

### 12.2 Logging / telemetry

- Secret を log、warning、例外、Telemetry、Crash Report、analytics、通知、URL または clipboard に出してはならない。
- Sensitive も原則ログ出力せず、必要な診断は最小限の正規化された分類だけにする。
- transaction payload 全文ログを原則禁止する。Public 情報でも不要なら記録しない。
- エラーは秘密情報や内部状態を含まない形に正規化する。
- Debug build でも private key、mnemonic、password、復号済み Store を出力できる仕組みを作らない。
- Telemetry に秘密情報・取引内容を送信しない。

### 12.3 Retention / secure deletion

Secret は必要な期間だけ保持し、復号済み private key / mnemonic を長時間メモリに残さない。処理済み request は replay 防止に必要な最小情報だけ保持する。session は期限切れ、revoke、lock で無効化し、Relay 一時データも必要最小期間で削除する。

account 削除時は関連する Secret、session、permission を削除する。cache、temp file、backup、log から削除済み Secret を復元できる状態にしてはならない。物理的完全消去を保証できない storage では cryptographic erasure を基本とする。

## 13. Backup / Export / Clipboard / Screenshot

### 13.1 Backup / export

- backup / export は利用者の明示操作時のみ実行し、外部アプリ、SDK、dApp から実行できないようにする。
- 実行前に再認証する。private key / mnemonic の表示は専用の trusted UI で行う。
- 平文ファイルをデフォルトの export 形式にしない。Wallet Core の暗号化 Wallet Store 等が利用可能なら優先する。
- export 失敗時に平文一時ファイルを残さない。Cloud Backup へ自動保存しない。
- 暗号仕様、Wallet Store の内部形式、migration および復元整合性は Wallet Core / platform 下位設計の責務とする。

### 13.2 Clipboard / screenshot

- private key / mnemonic の clipboard コピーは原則禁止する。例外時は高リスク操作として再認証する。
- 例外的に clipboard を使う場合、可能な platform では一定時間後に消去する。
- address / public key は通常通りコピーできるが、Secret と混同しない。
- Mobile では、private key / mnemonic の入力・表示画面、パスコード / PIN / 生体認証等の認証画面、署名確認画面、transaction / message 承認画面、および caller / Account / Chain / Network / Amount 等の署名文脈を表示する画面を Sensitive UI として扱う。下位 Mobile 設計は、これらの画面について screenshot、screen recording、screen sharing、recent apps preview、notification、OS preview / task switcher その他の platform 固有の画面露出経路を必ず評価しなければならない。
- Mobile の Sensitive UI では、OS が防止可能な範囲で保護を利用する。OS が完全に防止できない範囲について、画面露出を完全に防止できると設計または UI で誤認させてはならない。具体的な対象画面、OS API および保護方法は Mobile 設計へ委譲する。
- Browser Extension では screenshot 防止を保証しない。
- private key / mnemonic を recent apps preview、通知、履歴または temp UI に残さない。
- private key / mnemonic の QR 表示は秘密情報表示と同等の高リスク操作として扱う。

## 14. Sensitive UI / Anti-Phishing

- パスコード入力画面と署名確認画面は、外部コンテンツから明確に分離する。
- Browser Extension の重要操作は Extension 自身が所有する UI で行う。Mobile の承認・認証も Mobile App 自身の画面で行う。
- dApp が渡した HTML、Markdown、任意 UI、app 名、icon、説明文をそのまま確認画面へ表示しない。
- caller / origin は MosaicLynx 自身が取得・検証した値を表示する。外部自己申告の表示名だけを信頼しない。
- パスコード入力欄を Web page 側へ提供しない。
- Deep Link、Relay が指定した文言、外部アプリの branding によって信頼表示を作らない。
- セキュリティ重要 UI は一貫したデザインで MosaicLynx の操作として識別できるようにする。

## 15. Fail-Closed / Incident Recovery

### 15.1 Fail-closed

次のいずれかを確認できない場合は署名しない。

- transaction / message の parse、validate、表示可能性
- 未知 transaction type、未対応 version、対象 Chain / Network
- network 判定、Account、caller、permission、session
- request の期限、requestId、完全性、重複および内容整合性
- 利用者の確認内容と実際の payload の一致
- 利用者認証、Wallet Core validation、署名結果の対応

Wallet Core が `error`、validation failure、warning、binding error、Store integrity / verification failure、または安全な署名処理の成立を保証できないその他の非成功状態を返した場合、Signer は署名処理を継続してはならない。その場合、署名結果を成功として返さず、warning を UI 警告だけで bypass して署名を継続せず、error / diagnostic に Secret を含めない。復旧後も以前の署名承認を流用してはならない。

Relay、Node、外部 API の障害を理由に検証を省略せず、必須情報を危険な推測値で補完しない。内部例外、復号失敗、部分的な UI 状態または result unknown では処理を中断し、復旧後に以前の承認状態を使い回さない。

### 15.2 Security incident / recovery

セキュリティ異常を検知・疑義判定した場合は、署名可能状態を解除し、UNLOCKED / 一時認証状態を破棄し、session を無効化可能にする。必要に応じて permission を revoke し、処理中の署名要求を中断する。再承認なしに処理を再開してはならない。

侵害疑いだけを理由に秘密鍵を自動削除してはならない。鍵漏洩疑いがある場合は、ユーザーが Account 移行・鍵更新を行えるよう促す。Relay / 外部サービスの侵害だけで private key 更新が必須になる構造にはしない。復旧後も以前の認証・署名承認状態を復元しない。詳細な incident response 手順は運用設計へ委譲する。

## 16. Software Integrity / Update Policy

- Browser Extension / Mobile App は正規配布経路から更新する。
- リリース成果物は改ざん検出可能な形で管理し、Wallet Core のバージョンを明示的に管理する。
- セキュリティ重要依存関係を不用意に無制限の version range で取り込まない。
- CI/CD から配布までの supply chain を保護する。
- 署名・鍵管理・認証変更は通常機能より厳格にレビューする。
- セキュリティ更新不能な旧版を無期限に許容しない。
- migration で Secret を平文退避せず、移行後に暗号データの互換性・完全性を検証する。
- 開発版、debug 版、正式版を明確に分離する。

具体的な GitHub Actions SHA pin、SBOM、成果物署名、release gate、配布停止および旧版廃止の手順は release / operation 設計へ委譲する。本書の原則を満たさない build capability を、UI を隠すだけで有効化してはならない。

## 17. Security Invariants

以下は、実装・下位設計・運用を通じて破ってはならない MUST である。

1. 秘密鍵・mnemonic その他の Secret を untrusted external boundary に渡さない。例として SDK、dApp / Web page、Provider、Content Script、Deep Link、Relay、Node、外部 API、URL、log / telemetry / diagnostics を含むが、これらに限らない。
2. 秘密情報を平文で永続保存しない。
3. 外部入力はすべて untrusted input として扱う。
4. 署名内容を解析・検証・表示できない場合は署名しない。
5. ユーザーが確認した内容と実際に署名する payload を一致させる。
6. `1 request = 1 confirmation = 1 authentication = 1 signing` とする。
7. 署名ごとにユーザー認証を必須とし、自動署名を許可しない。
8. 外部連携経路・補助サービス・untrusted component の単独侵害だけでは、秘密鍵取得または無確認署名を成立させない。
9. Secret を log / telemetry / crash report に出力しない。
10. 安全性を確認できない場合は Fail Closed とする。
11. 認証・署名確認 UI は MosaicLynx 自身が制御する。
12. セキュリティ異常時は署名可能状態を解除し、以前の承認状態を再利用しない。

## 18. 下位設計への委譲事項

| 対象                | 委譲する事項                                                                                                                      | 維持すべき共通条件                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Wallet Core         | 暗号アルゴリズム、KDF、DEK / KEK、Wallet Store 内部仕様、秘密情報の一時処理、raw signing                                          | host が暗号を再実装せず、承認済み payload だけを渡し、平文 Secret を永続化しない                        |
| Browser Extension   | Chrome API、origin 観測、privileged layer、UI、再ロード、Storage、具体的な自動 lock 時間、clipboard / screenshot の platform 限界 | Browser 本体 UI、per-origin permission、毎回再認証、外部コンテンツ分離、再起動時 lock                   |
| Mobile App          | Deep Link / App Link、OS Secure Storage、生体認証、PIN、lifecycle、screen capture、preview、Sensitive UI の画面露出 policy、UI    | caller 検証、毎回の確認・再認証、OS を限定的に信頼、未確認要求の再開禁止、Sensitive UI の露出リスク評価 |
| Relay               | protocol format、opaque envelope、TLS、認証、TTL、サイズ、回数、Redis、保存・削除                                                 | Relay を信頼せず、秘密情報・承認・署名・意味解釈を持たせない                                            |
| SDK / Provider      | API、wire format、transport、caller binding、error mapping、retry                                                                 | Secret を扱わず、認証・承認・semantic inspection・fail-closed を Signer から奪わない                    |
| Chain integration   | Symbol / NEM の対応 type / version、parse、validate、表示、canonicalization                                                       | chain と network を混同せず、unknown / parse failure / 表示不能を拒否する                               |
| Release / Operation | CI/CD、SHA pin、SBOM、成果物署名、incident response、旧版廃止                                                                     | 改ざん検出、厳格な security review、侵害時の署名停止、平文 migration 禁止                               |

## 19. 未決事項

本書の確定方針を弱める判断は、次の未決事項を理由に行ってはならない。

- `CR-OPEN-001` / `CR-OPEN-002`: 固定済み Wallet Core Binding の host integration、React Native 連携、秘密 byte の一時 lifecycle、OS 保護、error mapping、migration。
- `MR-OPEN-002` / `MR-OPEN-003` / `MR-OPEN-005` / `MR-OPEN-006`: Mobile の受信経路、OS 保護、Binding integration、lifecycle、backup / migration。
- `SDK-OPEN-002` / `SDK-OPEN-003` / `SDK-OPEN-004` / `SDK-OPEN-006` / `SDK-OPEN-007`: aggregate / cosignature の公開範囲、transport 選択と代替経路、transaction construction、version policy、caller / Origin binding。
- 共通要件 `OPEN-003`: Android / iOS / Relay の milestone 完了条件と platform 固有依存。
- Symbol / NEM の対応 transaction type / version、aggregate / multisig / cosignature を含む semantic inspection の範囲。
- Profile 全体 backup / restore の platform ごとの責任分担と Wallet Core opaque Store の移行方法。

既存資料との整合について、次を OPEN として記録する。

- **SEC-OPEN-002**: 同仕様 §22 は生体認証を将来 capability と記載している。本書は Mobile で生体認証を利用可能とするため、Mobile の capability、fallback および Profile 仕様の位置付けを整合させる必要がある。
- **SEC-OPEN-004**: 共通要件と既存 handoff 仕様で定義済みの message signing 契約を前提とし、platform 側の表示受け入れ条件および既存 handoff 契約との最終整合だけを確認対象とする。解析不能な message を署名しない原則は変更しない。具体 API、wire schema、encoding および serialized message format は本書で再定義しない。

次は解決済み事項である。

- **SEC-OPEN-001（解決済み）**: Profile / Account 仕様 §20 を署名ごとの再認証に固定し、`while-unlocked` による署名時認証の省略を有効な実装条件から除外した。UNLOCKED は profile の利用状態であり、signing authentication の代替ではない。
- **SEC-OPEN-003（解決済み）**: Symbol / NEM は別 Key Identity として扱い、mnemonic からは対象 Chain を明示して Chain ごとの導出契約を利用する。具体的な導出仕様は Wallet Core / Chain integration に委譲し、一つの Account の秘密鍵を Symbol / NEM で暗黙共用する Account model は採用しない。

## 関連資料

- [MosaicLynx アーキテクチャ設計](./architecture.md)
- [MosaicLynx 共通要件定義書](../requirements/requirements.md)
- [Profile / Account 仕様](../specifications/profile-account-spec.md)
- [Web Transaction Handoff 仕様](../specifications/web-transaction-handoff-spec.md)
- [Chain Compatibility 仕様](../specifications/chain-compatibility-spec.md)
- [Product Specification](../specifications/product-spec.md)
- [Release Threat Model](../release/threat-model.md)
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
