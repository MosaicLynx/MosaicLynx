# MosaicLynx ブラウザ拡張機能要件定義書

## 1. 目的と位置付け

本書は、[MosaicLynx 共通要件](./requirements.md) に追加される Browser Extension 固有の要求を定める。共通要件で定めた署名対象の確認、明示的な承認・拒否、blind signing の禁止、秘密情報保護、Chain / Network の区別などは、必要な範囲を除き本書で重複して定義しない。

本書の要求は、Concept Sheet、共通要件、共通要件に明記された責任境界、ブラウザプラットフォームの外部制約および `symbol-nem-wallet-core` の公開責任境界から導出する。上流根拠を確認できず前回依頼で維持された要求は、Traceability の provenance / 状態で別に示す。仕様書、設計書、ADR、README、現行実装は要求の根拠としない。

API、データ形式、画面レイアウト、Manifest、Storage key、内部通信、具体的な暗号・状態遷移・migration・rollback の方式は、後続の仕様・設計で定める。

## 2. ブラウザ拡張機能要求

### BR-001 対応ブラウザと提供形態

**MUST** 最初の提供形態として、Chrome ブラウザ拡張機能から一般ユーザー向けの安全な署名判断を提供しなければならない。

追加の対応ブラウザを同じ Browser Extension milestone に含めるかは `BR-OPEN-001` で決定する。

### BR-002 拡張機能管理下の確認領域

**MUST** 署名対象の確認、承認、拒否および失敗結果を、Web ページが置き換えたり改変したりできない拡張機能管理下の確認領域で扱わなければならない。

Web ページが提供する表示や確認文言だけを、MosaicLynx の承認証拠として扱ってはならない。

### BR-003 Web ページからの署名要求受付

**MUST** 外部 Web ページからの署名要求を受け付ける場合、要求内容、要求元のブラウザコンテキストおよび現在の許可状態を検証してから、拡張機能の確認領域へ渡さなければならない。

### BR-004 Origin と接続許可の対応

**MUST** 接続許可または署名許可を、検証済みの Web Origin、対象 Profile、Account、Chain、Network と対応付けなければならない。

Web ページが自己申告する文字列だけを、Origin の検証結果として扱ってはならない。

利用者が許可していない Origin、Account、Chain または Network からの要求を、暗黙の接続や Account 切り替えによって許可してはならない。

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

### BR-014 Profile backup export / import

**MUST** Browser Extension の個別 milestone / release は、利用者が Profile の backup を export / import できる能力を提供しなければならない。

本要求は、秘密情報の保護および `symbol-nem-wallet-core` の責任境界に従わなければならない。backup format、保存方法、暗号方式、復元手順その他の具体方式は後続仕様で定める。

## 3. ブラウザ拡張機能の対象外

- dApp に代わる announce、node selection または継続的な network state 管理。
- Manifest、API、schema、RPC、Storage、CSP、内部通信などの具体設計を本要件書で確定すること。

## 4. 受け入れ条件

| ID        | 受け入れ可能な状態                                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-AC-001 | Web ページからの要求が、検証されたブラウザコンテキスト、Origin および許可状態に対応付けられてから確認領域へ到達する。                               |
| BR-AC-002 | Web ページ、page context または content script から秘密情報、署名権限、承認状態および Wallet Store を直接取得・操作できない。                       |
| BR-AC-003 | 利用者が拡張機能管理下の確認領域で Origin、署名対象、Chain、Network、Account および確認可能な影響を確認し、要求ごとに承認または拒否できる。         |
| BR-AC-004 | ページ遷移、tab / frame の変更または拡張機能実行コンテキストの停止・再生成によって要求との対応が失われた場合、署名が自動継続されない。              |
| BR-AC-005 | 未許可 Origin、対象の不一致、検証失敗、確認不能または未対応の要求が署名されず、安全側に終了する。                                                   |
| BR-AC-006 | 拡張機能の更新または wallet-core の失敗時に、既存の秘密情報、Profile、許可状態および署名責任境界が無断で変更されない。                              |
| BR-AC-007 | Mainnet gate 未達成または判定不能の build が、Mainnet 署名可能な状態で公開されない。                                                                |
| BR-AC-008 | Profile の backup export / import が利用でき、失敗時に既存の Profile、Wallet Store および署名可能状態が意図せず変更されず、秘密情報も公開されない。 |

## 5. Traceability

要求の根拠は上流から BR-* へ向けて整理する。下流資料は、BR-* を具体化・検証するための引継ぎ先であり、要求の根拠ではない。

ブラウザプラットフォームの外部制約として、[Chrome content scripts / isolated worlds](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)、[Extension service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)、[Chrome extension security](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure)、[permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)、[extension update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle) および [remote code guidance](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/) を参照する。これらは Browser Extension の実行コンテキスト、ライフサイクルおよび権限境界を支持するが、MosaicLynx 固有の製品判断を代替しない。

| 要求   | 上流根拠                                                                                                                            | provenance / 状態                                                                                                                                                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-001 | Concept Sheet 1、6.5、12；共通要件 §3、CR-011                                                                                       | 上流根拠あり。Browser Extension が最初の milestone であり、Chrome を最初の提供形態とすることも Concept Sheet §12 に明記されている。                                                                                                                        |
| BR-002 | Concept Sheet 6.2、6.3、11；共通要件 CR-002、CR-003、CR-004、CR-NFR-007；Chrome の実行コンテキスト制約                              | 上流根拠あり。Signer の確認・承認責任と Web ページから分離された確認領域の必要性から導出する。具体的な UI surface は未固定。                                                                                                                               |
| BR-003 | Concept Sheet 6.1、8、13；共通要件 CR-001、CR-NFR-001、CR-NFR-008；Chrome のページ・拡張機能コンテキスト制約                        | 上流根拠あり。要求検証は共通要件、ブラウザコンテキストの取得・境界は外部制約に基づく。具体的な API / schema は下流。                                                                                                                                       |
| BR-004 | Concept Sheet 5、11、13；共通要件 CR-005、CR-009、CR-NFR-008；Chrome のページ・frame コンテキスト制約                               | 上流根拠あり。許可範囲との対応は共通要件、Web Origin の検証に利用するブラウザコンテキストは外部制約に基づく。                                                                                                                                              |
| BR-005 | Concept Sheet 6.2、11；共通要件 CR-002、CR-005、CR-NFR-007                                                                          | 上流根拠あり。確認対象の情報は共通要件から導出し、確認領域は BR-002 の責任境界に従う。表示レイアウトは下流。                                                                                                                                               |
| BR-006 | Concept Sheet 4、9、13；共通要件 CR-008、CR-011、CR-NFR-001、CR-NFR-002；Chrome の isolated world 制約                              | 上流根拠あり。秘密情報の分離は共通要件、Web ページと拡張機能コンテキストの分離は外部制約および責任境界に基づく。                                                                                                                                           |
| BR-007 | Concept Sheet 6.3、11、13；共通要件 CR-003、CR-010、CR-NFR-003、CR-NFR-009、CR-NFR-010、CR-NFR-011；Chrome の lifecycle 制約        | 上流根拠あり。承認の再利用防止は共通要件、実行コンテキストの停止・再生成は外部制約に基づく。具体的な状態保存方式は下流。                                                                                                                                   |
| BR-008 | Concept Sheet 6.3、11；共通要件 CR-NFR-003、CR-NFR-008、CR-NFR-009、CR-NFR-010、CR-NFR-011；Chrome の navigation / tab / frame 制約 | 上流根拠あり。要求と承認の対応維持は共通要件、ブラウザコンテキストの変化は外部制約に基づく。受付範囲は `BR-OPEN-002`。                                                                                                                                     |
| BR-009 | Concept Sheet 9、13；共通要件 CR-008、CR-013、共通要件 §2.3；`symbol-nem-wallet-core` 外部契約                                      | 上流根拠・外部契約あり。共通要件 §2.3 は wallet-core の採用と責任範囲を明示する。Profile backup の必須性は本行の根拠に含めない。                                                                                                                           |
| BR-010 | Concept Sheet 13；Chrome の権限モデルと security guidance                                                                           | 外部資料による security guidance あり。最小権限の原則は確認できるが、現在の MUST 強度を Chrome が強制するとは主張しない。前回依頼で維持指定された既存要求であり、個別 permission の必須性・一覧と要求強度は正式判断が必要。                                |
| BR-011 | Concept Sheet 11、13；共通要件 CR-NFR-001、CR-NFR-002、CR-NFR-007；Chrome のコード実行・コンテンツ保護制約                          | 上流根拠・外部制約あり。未検証入力を信頼しない共通原則と Chrome の XSS / remote code 対策に基づく。具体的な CSP 等は下流。                                                                                                                                 |
| BR-012 | Concept Sheet 11、13；共通要件 CR-010、CR-NFR-003、CR-NFR-004、CR-NFR-009；Chrome の update lifecycle                               | 上流原則はあり。安全側終了・対象一致は上流要件、更新 lifecycle は外部制約から確認できるが、更新時の既存状態置換禁止・互換性確認までは直接導出できない。前回依頼で維持指定された既存要求であり、正式採用の判断が必要。                                      |
| BR-013 | Concept Sheet 12、14、15；共通要件 CR-NFR-006                                                                                       | 上流根拠あり。Mainnet gate と gate 未達成時の無効化は Concept Sheet と共通要件に明記されている。                                                                                                                                                           |
| BR-014 | Concept Sheet 13；共通要件 CR-013、CR-014；`symbol-nem-wallet-core` 外部契約                                                        | 秘密情報保護・責任境界・個別 platform での backup 許容は上流根拠あり。ただし Browser Extension milestone / release で backup export / import を必須提供する部分は上流根拠未確認で、前回依頼で維持指定された既存要求。正式採用・OPEN 化・削除の判断が必要。 |

下流: 各 BR の API、schema、表示詳細、Manifest、Storage、内部通信、状態遷移、wallet-core 統合、backup format、migration、rollback、release operation は、要求を満たす後続仕様・設計で定める。

## 6. 未決事項

### BR-OPEN-001：追加の対応ブラウザ範囲

未決事項: Chrome 以外のブラウザを、どの範囲・時期で Browser Extension の提供対象に含めるか。

決定理由・期限: 初回 Browser Extension milestone の外部受け入れ範囲を確定するまでに決定する。

### BR-OPEN-002：Web Origin と frame の受付範囲

未決事項: 署名要求を受け付ける Web Origin と frame の範囲。

決定理由・期限: 初回 Browser Extension milestone の外部受け入れ範囲を確定するまでに決定する。具体的な検証方式や権限設定は後続仕様・設計で定める。
