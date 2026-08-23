# MosaicLynx ブラウザ拡張機能要件（たたき台）

## 1. 文書の目的と適用範囲

本書は、[MosaicLynx 共通要件](./requirements.md) に加えて、ブラウザ拡張機能という実行環境でのみ生じる要求を整理する。

署名対象の確認、明示的な承認・拒否、blind signing の禁止、秘密情報保護、Symbol / NEM と Mainnet / Testnet の区別などは共通要件であり、本書では重複して再定義しない。

ブラウザ拡張機能は MosaicLynx v1 の最初の milestone である。現時点では Chrome 拡張機能を主要な提供形態として扱うが、対応ブラウザの最終的な範囲は本書の OPEN である。

## 2. ブラウザ固有の責任境界

### 2.1 信頼境界

- Web ページの JavaScript、ページ内の dApp、content script、拡張機能のバックグラウンド実行領域、拡張機能自身の承認画面を、同じ信頼レベルとして扱ってはならない。
- Web ページと dApp は、署名要求を発行する外部入力の領域として扱う。
- 秘密鍵、Mnemonic、Profile password、復号済み Wallet Store、署名用の秘密情報を Web ページまたは content script へ渡してはならない。
- 署名と秘密情報の利用は、拡張機能が管理する信頼境界内で行わなければならない。具体的な実行コンテキストと Binding は設計で決定する。

### 2.2 Web Origin

- 署名要求の要求元を、ページが自己申告する文字列だけで信頼してはならない。
- 拡張機能は、ブラウザが提供するタブ、フレーム、URL 等のコンテキストを検証し、要求元 Origin と権限判断の対応を確定しなければならない。
- Origin、チェーン、ネットワーク、Account、要求内容のいずれかが承認時と署名時で変化した場合、署名してはならない。
- サイト名、favicon、ページタイトルなど未検証の表示情報だけで、要求元を信頼できるものとして表示してはならない。

## 3. ブラウザ拡張機能要求

### BR-001 対応ブラウザと提供形態

**MUST** 最初の提供形態として、ブラウザ拡張機能から一般ユーザー向けの安全な署名判断を提供しなければならない。

現行のプロダクト仕様は Chrome 拡張機能を前提としている。Chrome 以外の対応ブラウザを v1 のどの範囲で含めるかは `BR-OPEN-001` で決定する。

根拠: 共通要件 CR-011、コンセプト 1、6.5、12。参考: `docs/specifications/product-spec.md` 1、2。

### BR-002 拡張機能管理下の確認領域

**MUST** 署名対象の確認、承認、拒否、失敗結果を、Web ページが置き換えたり改変したりできない拡張機能管理下の確認領域で扱わなければならない。

Web ページ内の modal やページ提供の確認文言だけを、MosaicLynx の承認証拠として扱ってはならない。popup、side panel、extension page 等のどの UI surface を使用するかは `BR-OPEN-003` と後続設計で決定する。

根拠: 共通要件 CR-002、CR-003、CR-004、CR-NFR-007。参考: `docs/architecture/architecture.md` 9、10。

### BR-003 Web ページからの署名要求受付

**MUST** 外部 Web ページからの署名要求を受け付ける場合、要求のメソッド、対象、送信元コンテキスト、許可状態を検証してから Signer の確認領域へ渡さなければならない。

具体的な Provider API、RPC、request schema、error code は `docs/specifications/web-transaction-handoff-spec.md` または後続仕様で定義し、本書では固定しない。

### BR-004 Origin と接続許可の対応

**MUST** 接続許可または署名許可は、検証済みの Web Origin、対象 Profile、Chain、Network、利用者が許可した Account と対応付けなければならない。

利用者が許可していない Origin、Account、Chain、Network からの署名要求を、暗黙の接続や暗黙の Account 切り替えによって許可してはならない。

根拠: 共通要件 CR-005、CR-009。参考: `docs/specifications/product-spec.md` 11。

### BR-005 拡張機能の署名確認 UI

**MUST** 拡張機能の署名確認 UI は、少なくとも次を利用者が区別して確認できるようにしなければならない。

- 要求元の Origin。
- 署名対象。
- 対象 Chain と Network。
- 署名に用いる Account。
- Signer が確認できる範囲の影響。
- 承認、拒否、安全側終了の状態。

具体的な UI レイアウト、文言、表示階層、transaction type ごとの項目は後続仕様で決定する。

根拠: 共通要件 CR-002、CR-003、CR-004、CR-NFR-007。参考: `docs/specifications/product-spec.md` 12、17.2。

### BR-006 Page context と Extension context の分離

**MUST** Web ページの実行コンテキストから、拡張機能が管理する秘密情報、署名権限、承認状態、Wallet Store を直接操作できないようにしなければならない。

content script や page context は、署名を実行する責任主体として扱ってはならない。コンテキスト間の通信方式、メッセージ形式、内部ルーティングは設計で決定する。

根拠: 共通要件 CR-008、CR-NFR-001、CR-NFR-002。参考: `_snwc/README.md`、`_snwc/docs/decisions/binding-implementation.md`、`docs/architecture/architecture.md` 3、9。

### BR-007 Service Worker 等のライフサイクル

**MUST** ブラウザ拡張機能のバックグラウンド実行領域が停止・再起動・破棄されても、承認済みの要求から署名を自動再開してはならない。

再開または再表示する場合も、Origin、Account、Profile、Chain、Network、署名対象、利用者の承認状態を再確認し、不一致や確認不能があれば署名せず終了しなければならない。

具体的な pending request の保存、期限、再表示、状態遷移は後続仕様で決定する。

根拠: 共通要件 CR-003、CR-004、CR-NFR-003。参考: `docs/specifications/product-spec.md` 12、`docs/architecture/architecture.md` 3、11。

### BR-008 ページ遷移・タブ・フレームの変化

**MUST** 承認待ちの間に、要求元ページの navigation、tab、frame、Origin、Account、Profile、Chain、Network、署名対象が変化した場合、元の承認を別の要求へ適用してはならない。

top-level frame 以外、sandbox、opaque origin、特殊 scheme 等をどの範囲で受け付けるかは `BR-OPEN-002` で決定する。

### BR-009 Extension Storage と wallet-core の境界

**MUST** 拡張機能の Profile、Account、Wallet Store を保存する場合、Web ページや content script が管理する Storage を秘密情報の正本としてはならない。

`symbol-nem-wallet-core` の Wallet Store は opaque data として扱い、拡張機能側で内容を解釈・編集・再暗号化してはならない。状態変更の保存、atomic な置換、破損・不整合時の扱いは wallet-core の契約と後続設計に従う。

根拠: 共通要件 CR-008、CR-NFR-004。参考: `_snwc/README.md`、`_snwc/docs/specifications/wallet-store-format-v1.md`、`docs/architecture/architecture.md` 8。

### BR-010 権限最小化

**MUST** ブラウザ拡張機能は、Web ページへのアクセス、Host permission、拡張機能内権限、外部通信権限を、署名要求の受付と確認に必要な範囲へ限定しなければならない。

具体的な permission の一覧と理由は、対応ブラウザ・Provider 方式とともに `BR-OPEN-001`、`BR-OPEN-002` で整理する。

### BR-011 CSP、XSS、リモートコード対策

**MUST** 拡張機能の確認領域で、Web ページからの未検証入力によって表示内容、承認操作、署名権限、秘密情報が改変されないようにしなければならない。

リモートから取得した実行コードを信頼して署名処理へ組み込んではならない。Manifest、CSP、script injection、表示のエスケープ、依存パッケージの扱いは、ブラウザ仕様と後続設計で具体化する。

### BR-012 拡張機能の更新互換性

**MUST** 拡張機能の更新によって、既存 Profile、Account、接続許可、Wallet Store を利用者の明示的な確認なしに別の対象へ置換したり、署名可能状態を安全確認なしに変更したりしてはならない。

Wallet Store の migration、旧版との互換性、更新失敗時の rollback、Provider 契約の互換性は、wallet-core の仕様、既存 Provider 仕様、release 設計と整合させる。

### BR-013 拡張ストア配布と Mainnet gate

**MUST** 拡張ストア等で配布する build は、対象環境の release evidence と Mainnet gate の結果に従って署名能力を制御しなければならない。gate 未達成の build を Mainnet 署名可能として配布してはならない。

共通の Mainnet 要求は `CR-NFR-006` と `OPEN-005` に従い、拡張ストア固有の審査・公開・更新条件は後続リリース設計で決定する。

## 4. ブラウザ拡張機能の対象外

- Web ページ内の dApp に秘密鍵、Mnemonic、Profile password を渡すこと。
- Web ページ側の表示だけを信頼して署名すること。
- Origin をページの自己申告だけで認証すること。
- ブラウザ拡張機能が dApp に代わって announce、ノード選択、継続的なネットワーク状態管理を行うこと。
- ブラウザ拡張機能固有の都合だけを理由に blind signing、自動署名、永続的許可を導入すること。
- Manifest の具体的 JSON、Provider API の具体的な型、内部 RPC、Storage key、CSP の具体的な記述を本書で確定すること。

## 5. ブラウザ拡張機能の受け入れ条件

| ID        | 受け入れ可能な状態                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| BR-AC-001 | Web ページからの要求が、検証されたブラウザコンテキストと接続許可に対応付けられてから確認 UI に到達する。           |
| BR-AC-002 | Web ページまたは content script から秘密情報、署名権限、Wallet Store を直接取得できない。                          |
| BR-AC-003 | 利用者が拡張機能管理下の確認 UI で Origin、署名対象、Chain、Network、Account、影響を確認し、承認または拒否できる。 |
| BR-AC-004 | ページ遷移、tab/frame、拡張機能実行領域の再起動などにより要求の対応が失われた場合、署名が自動継続されない。        |
| BR-AC-005 | 未許可 Origin、対象不一致、検証失敗、未対応要求が署名されず、安全側に終了する。                                    |
| BR-AC-006 | 拡張機能の更新、保存エラー、wallet-core の失敗時に、既存の秘密情報・Profile・署名責任境界が無断で変更されない。    |
| BR-AC-007 | Mainnet gate 未達成の build が Mainnet 署名可能な状態で配布されない。                                              |

## 6. ブラウザ固有の未決事項

### BR-OPEN-001：対応ブラウザと配布チャネル

- 論点: Chrome を最初の対応対象とすることは既存資料にあるが、MosaicLynx v1 のブラウザ対応範囲、バージョン、拡張ストア等の配布チャネルをどこまで含めるか。
- なぜ要件定義段階で決める必要があるか: Permission、CSP、Extension API、公開・更新・Mainnet gate の適用範囲が変わるため。
- 主な選択肢: Chrome のみ、Chromium 系を含む、その他ブラウザを個別追加する。
- 後続設計まで保留可能か: 最初の Extension milestone の受け入れ対象を確定する前まで保留可能。方式の設計はその後でよい。

### BR-OPEN-002：Origin、frame、permission の受け入れ範囲

- 論点: top-level frame、iframe、特殊 scheme、sandbox、複数 Origin の扱いと、必要な Web / Host permission の範囲。
- なぜ要件定義段階で決める必要があるか: Web ページからの要求受付と、悪意あるページによる署名誘導対策の受け入れ範囲が変わるため。
- 主な選択肢: top-level frame のみ、検証済み iframe を含む、特殊 Origin を個別対応する。
- 後続設計まで保留可能か: 最初の Browser milestone の外部要求・受け入れ条件を確定する前まで保留可能。

### BR-OPEN-003：承認 UI surface

- 論点: popup、side panel、extension page 等のどの拡張機能管理下の領域を署名確認の正本とするか。
- なぜ要件定義段階で決める必要があるか: Web ページと拡張機能の信頼境界、利用者が正規 UI を識別する方法、ブラウザライフサイクルの要求が変わるため。
- 主な選択肢: 単一の拡張機能ページ、複数の拡張機能 UI surface、ブラウザ機能を組み合わせる。
- 後続設計まで保留可能か: 要件として「拡張機能管理下で確認する」ことを確定したまま、詳細 surface は設計まで保留可能。

### BR-OPEN-004：Extension 更新と Wallet Store migration

- 論点: 拡張機能更新時に Profile、Account、接続許可、wallet-core の opaque Store をどの互換性・migration 条件で維持するか。
- なぜ要件定義段階で決める必要があるか: 既存利用者の署名可否、秘密情報の復旧可能性、Mainnet build の更新安全性に影響するため。
- 主な選択肢: wallet-core の Store version へ完全委譲、Extension 側の migration を許可、互換性のない更新を別 release とする。
- 後続設計まで保留可能か: 初回 release の保存形式と更新方針を確定する前まで保留可能。ただし、Extension が Store 内部を解釈・編集しない境界は維持する。

## 7. 参照資料

- `docs/requirements/requirements.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/architecture/architecture.md`
- `_snwc/README.md`
- `_snwc/docs/specifications/specification.md`
- `_snwc/docs/decisions/binding-implementation.md`
