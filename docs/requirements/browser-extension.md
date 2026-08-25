# MosaicLynx ブラウザ拡張機能要件定義書

## 1. 目的と位置付け

本書は、[MosaicLynx 共通要件](./requirements.md) に追加される Browser Extension 固有の要求を定める。共通要件で定めた署名対象の確認、明示的な承認・拒否、blind signing の禁止、秘密情報保護、Chain / Network の区別などは、必要な範囲を除き本書で重複して定義しない。

本書の上流根拠は Concept Sheet と共通要件とし、ブラウザプラットフォームの外部制約および `symbol-nem-wallet-core` の責任境界を整合確認に用いる。

API、データ形式、画面レイアウト、Manifest、Storage、内部通信、暗号、状態遷移、migration、rollback の方式は後続の仕様・設計で定める。

## 2. ブラウザ拡張機能要求

### BR-001 対応ブラウザと提供形態

**MUST** 初回 Browser Extension milestone の対応ブラウザを Chrome のみに限定し、Chrome ブラウザ拡張機能から一般ユーザー向けの安全な署名判断を提供しなければならない。

### BR-002 拡張機能管理下の確認領域

**MUST** 署名対象の確認、承認、拒否および失敗結果を、Web ページが置き換えたり改変したりできない拡張機能管理下の確認領域で扱わなければならない。

Web ページが提供する表示や確認文言だけを、MosaicLynx の承認証拠として扱ってはならない。

### BR-003 Web ページからの署名要求受付

**MUST** 外部 Web ページからの署名要求を受け付ける場合、要求内容、要求元のブラウザコンテキストおよび現在の許可状態を検証してから、拡張機能の確認領域へ渡さなければならない。

受付対象として検証可能な未許可 Web Origin からの要求は、署名要求として許可するのではなく接続要求として受け付けなければならない。接続要求と署名要求を区別し、有効な接続許可が成立する前の署名要求を署名確認へ進めてはならない。

### BR-004 Origin と接続許可の対応

**MUST** 接続許可を、検証済みの Web Origin、対象 Profile、Account、Chain、Network と対応付けなければならない。少なくとも Web Origin、Profile、Account、Chain、Network の組を接続許可の scope として扱わなければならない。

Web ページが自己申告する文字列だけを、Origin の検証結果として扱ってはならない。

検証済み Web Origin とは、ブラウザが観測した要求元コンテキストから、要求と Web Origin の対応を確認できることをいう。サイト運営者の本人確認、サイトの善性または非侵害の保証、dApp の暗号学的な本人認証を意味しない。

初回 Browser Extension milestone で外部 dApp の要求元として受け付けるのは、top-level browsing context の HTTPS Origin を原則とする。通常の HTTP Origin は拒否し、開発用途に限り `http://localhost`、`http://127.0.0.1` および `http://[::1]` の loopback Origin を許可する。これらの loopback Origin の port は固定しない。

`file:`、`data:`、opaque origin または Origin を一意に確認できないコンテキスト、browser internal page、他の browser extension Origin および iframe / child frame からの外部 dApp 要求は拒否しなければならない。初回 milestone では top-level browsing context からの要求のみを受け付ける。

接続許可は、拡張機能管理下の確認領域で利用者の明示操作によって成立しなければならない。利用者は接続許可を同じ管理下で明示的に変更または撤回できなければならず、変更後または撤回後の許可状態と一致しない署名要求を受け付けてはならない。

利用者が許可していない Origin、Profile、Account、Chain または Network からの要求を、暗黙の接続、許可 scope の拡張または Profile、Account、Chain、Network の切り替えによって許可してはならない。接続許可は包括的な署名許可ではなく、接続済みの Origin からの署名も要求ごとに利用者の明示的な承認を必要とする。自動署名または永続的な包括署名許可を導入してはならない。

### BR-005 拡張機能の署名確認

**MUST** 拡張機能の確認領域で、利用者が少なくとも次を区別して確認できなければならない。

- 要求元の Origin
- 署名対象
- 対象 Chain と Network
- 署名に用いる Account
- Signer が確認できる範囲の影響

### BR-006 Page context と Extension context の分離

**MUST** Web ページ、page context または content script から、拡張機能が管理する秘密情報、署名権限、承認状態および Wallet Store を直接操作できないようにしなければならない。

これらの Web 側の実行コンテキストを、署名を実行する責任主体として扱ってはならない。

### BR-007 拡張機能実行コンテキストのライフサイクル

**MUST** ブラウザ拡張機能の実行コンテキストが停止・再生成された場合、以前の承認だけを根拠に署名を自動再開してはならない。

処理を再開または再表示する場合も、現在の要求元、許可状態、署名対象および利用者の承認との対応を確認し、確認できない場合は署名せず終了しなければならない。

### BR-008 ページ遷移・タブ・フレームの変化

**MUST** 承認待ちの間に、要求元ページの navigation、tab、frame、Origin、Profile、Account、Chain、Network または署名対象が変化した場合、元の承認を別の要求へ適用してはならない。

対応を再確認できない要求は、署名せず終了しなければならない。

### BR-009 Extension Application と wallet-core の境界

**MUST** 秘密情報、Wallet Store、秘密情報を使用する暗号処理および raw signing は、`symbol-nem-wallet-core` の責任境界に従わなければならない。

MosaicLynx Application が管理する Profile、Account、dApp permission などの状態と、wallet-core が管理する Wallet Store の責任を混同してはならない。Web ページまたは content script に、これらの管理責任や直接操作を移してはならない。

wallet-core の内部形式および migration の実装方式を、本要件書で再定義しない。

### BR-010 権限最小化

**MUST** ブラウザ拡張機能の Web ページへのアクセス、拡張機能内権限および外部通信権限を、署名要求の受付と確認に必要な範囲へ限定しなければならない。

### BR-011 入力・コード実行境界の保護

**MUST** Web ページからの未検証入力、XSS、injection または remote code 等によって、拡張機能の確認表示、承認操作、署名権限または秘密情報が改変されないようにしなければならない。

リモートから取得した実行コードを信頼して署名処理へ組み込んではならない。

### BR-012 拡張機能の更新安全性

**MUST** 拡張機能の更新によって、既存の Profile、Account、接続許可または Wallet Store を、利用者の明示的な確認なしに別の対象へ置換してはならない。また、更新後の安全性や互換性を確認できない状態で、署名可能状態を継続してはならない。

### BR-013 拡張機能の公開と Mainnet gate

**MUST** 公開する拡張機能 build の Mainnet 署名能力は、適用される release evidence と Mainnet gate が成立した場合に限り有効化しなければならない。gate 未達成または判定不能の build を、Mainnet 署名可能な状態で公開してはならない。

Mainnet gate の評価時点、公開後に evidence が期限切れ・失効・検証不能となった場合の扱い、および build-time と runtime の責任境界は本書で定めず、release operation / Mainnet evidence policy へ引き継ぐ。

## 3. ブラウザ拡張機能の対象外

- dApp に代わる announce、node selection または継続的な network state 管理。
- Manifest、API、schema、RPC、Storage、CSP、内部通信などの具体設計を本要件書で確定すること。

## 4. 受け入れ条件

| ID        | 受け入れ可能な状態                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-AC-001 | 署名要求が、ブラウザが観測した top-level browsing context、検証済み Web Origin、対象 Profile、Account、Chain、Network およびそれらすべてに対応する有効な接続許可に対応付けられ、対応付けを確認できた場合だけ確認領域へ到達する。                                                                                                                                                                                                      |
| BR-AC-002 | Web ページ、page context または content script から秘密情報、署名権限、承認状態および Wallet Store を直接取得・操作できない。                                                                                                                                                                                                                                                                                                         |
| BR-AC-003 | 利用者が拡張機能管理下の確認領域で Origin、署名対象、Chain、Network、Account および確認可能な影響を確認し、要求ごとに承認または拒否できる。                                                                                                                                                                                                                                                                                           |
| BR-AC-004 | ページ遷移、tab / frame の変更、Profile の変更・削除、既存 permission との対応の喪失または拡張機能実行コンテキストの停止・再生成によって要求との対応が失われた場合、既存 permission を署名要求へ利用せず、署名が自動継続されない。                                                                                                                                                                                                    |
| BR-AC-005 | 未許可 Origin、対象の不一致、検証失敗、確認不能または未対応の要求が署名されず、安全側に終了する。                                                                                                                                                                                                                                                                                                                                     |
| BR-AC-006 | 拡張機能の更新後、既存の秘密情報、Profile、Account、接続許可および Wallet Store と署名可能状態との安全な対応を確認でき、確認不能な場合は署名可能状態を継続しない。更新または wallet-core の失敗時、既存状態を別の対象へ無断で置換せず、wallet-core の責任境界を確認できない場合も署名を継続しない。                                                                                                                                   |
| BR-AC-007 | Mainnet gate 未達成または判定不能の build が、Mainnet 署名可能な状態で公開されない。                                                                                                                                                                                                                                                                                                                                                  |
| BR-AC-008 | Web ページへのアクセス、拡張機能内権限および外部通信権限が、署名要求の受付・確認に必要な範囲へ限定されており、不要な権限を要求する状態が合格とならない。具体的な権限名や設定方式は下流で定める。                                                                                                                                                                                                                                      |
| BR-AC-009 | 敵対的または未検証の Web ページ入力によって確認領域、承認状態、署名権限または秘密情報を改変できず、署名処理がリモートから取得した実行コードに依存しないことを確認できる。具体的な防御・検証方式は下流で定める。                                                                                                                                                                                                                       |
| BR-AC-010 | 受付対象として検証可能な未許可 Origin からの接続要求が署名要求と区別され、拡張機能管理下で利用者の明示操作により接続許可を作成する前に、署名要求が署名確認へ進まない。接続済みであっても、各署名要求に明示的な承認が必要である。                                                                                                                                                                                                      |
| BR-AC-011 | 接続許可が Web Origin、Profile、Account、Chain、Network の組に対応付けられ、対応が一致しない要求は署名へ進まない。Profile A で成立した接続許可を Profile B の要求へ暗黙に転用せず、利用者が拡張機能管理下で明示的に permission を作成・変更・撤回でき、変更または撤回された旧 permission、および対応を確認できない permission をその後の署名要求へ利用しない。                                                                        |
| BR-AC-012 | 初回 milestone で top-level browsing context の HTTPS Origin と、開発用途に限る任意 port の `http://localhost`、`http://127.0.0.1`、`http://[::1]` が受付対象となり、通常の HTTP、`file:`、`data:`、opaque origin、browser internal page、他の browser extension Origin および iframe / child frame が拒否される。検証済み Web Origin は browser-observed context との binding として確認され、サイト認証や善性保証として扱われない。 |
| BR-AC-013 | 初回 Browser Extension milestone の提供・サポート対象が Chrome のみであることを確認できる。具体的な最低バージョン、channel、配布設定および Manifest version は下流で定める。                                                                                                                                                                                                                                                          |

## 5. Traceability

上流根拠、整合確認資料、下流引継ぎを分けて BR-* に対応付ける。

ブラウザプラットフォームの外部制約として、[Chrome content scripts / isolated worlds](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)、[Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)、[Chrome extension security](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure)、[permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)、[extension update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle) および [remote code guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/) を参照する。これらは Browser Extension の実行コンテキスト、ライフサイクルおよび権限境界を支持するが、MosaicLynx 固有の製品判断を代替しない。

| 要求   | 上流根拠                                                                                                                            | 対応・下流                                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| BR-001 | Concept Sheet 1、6.5、12；共通要件 §3、CR-011                                                                                       | BR-AC-013。対応範囲、配布および gate の詳細は下流仕様・release 設計。                 |
| BR-002 | Concept Sheet 6.2、6.3、11；共通要件 CR-002、CR-003、CR-004、CR-NFR-007；Chrome の実行コンテキスト制約                              | BR-AC-003。確認領域の具体的な UI は下流仕様。                                         |
| BR-003 | Concept Sheet 6.1、8、13；共通要件 CR-001、CR-009、CR-NFR-001、CR-NFR-008；Chrome のページ・拡張機能コンテキスト制約                | BR-AC-001、BR-AC-010。API / schema は下流仕様。                                       |
| BR-004 | Concept Sheet 5、11、13；共通要件 CR-005、CR-009、CR-NFR-008；Chrome のページ・frame コンテキスト制約                               | BR-AC-001、BR-AC-004、BR-AC-010〜BR-AC-012。Origin、permission の具体方式は下流仕様。 |
| BR-005 | Concept Sheet 6.2、11；共通要件 CR-002、CR-005、CR-NFR-007                                                                          | BR-AC-003。表示レイアウトは下流仕様。                                                 |
| BR-006 | Concept Sheet 4、9、13；共通要件 CR-008、CR-011、CR-NFR-001、CR-NFR-002；Chrome の isolated world 制約                              | BR-AC-002、BR-AC-009。実行コンテキストの具体方式は下流仕様。                          |
| BR-007 | Concept Sheet 6.3、11、13；共通要件 CR-003、CR-010、CR-NFR-003、CR-NFR-009、CR-NFR-010、CR-NFR-011；Chrome の lifecycle 制約        | BR-AC-004。状態保存方式は下流仕様。                                                   |
| BR-008 | Concept Sheet 6.3、11；共通要件 CR-NFR-003、CR-NFR-008、CR-NFR-009、CR-NFR-010、CR-NFR-011；Chrome の navigation / tab / frame 制約 | BR-AC-004、BR-AC-012。navigation / frame の具体処理は下流仕様。                       |
| BR-009 | Concept Sheet 9、13；共通要件 CR-008、CR-013、共通要件 §2.3；`symbol-nem-wallet-core` 外部契約                                      | BR-AC-006、BR-AC-009。wallet-core 統合方式は下流設計。                                |
| BR-010 | Concept Sheet 13；Chrome の権限モデルと security guidance                                                                           | BR-AC-008。権限の具体的な一覧は下流仕様。                                             |
| BR-011 | Concept Sheet 11、13；共通要件 CR-NFR-001、CR-NFR-002、CR-NFR-007；Chrome のコード実行・コンテンツ保護制約                          | BR-AC-009。防御方式は下流仕様。                                                       |
| BR-012 | Concept Sheet 11、13；共通要件 CR-008、CR-010、CR-NFR-003、CR-NFR-004、CR-NFR-009；Chrome の update lifecycle                       | BR-AC-006。更新の migration / rollback / versioning は下流仕様。                      |
| BR-013 | Concept Sheet 12、14、15；共通要件 CR-NFR-006                                                                                       | BR-AC-007。gate の運用詳細は release policy へ引き継ぐ。                              |

各 BR の API、schema、表示詳細、Manifest、Storage、内部通信、状態遷移、wallet-core 統合、migration、rollback、versioning、release operation は、要求を満たす後続仕様・設計で定める。
