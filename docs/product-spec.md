# MosaicLynx ブラウザ拡張機能仕様

## 1. 文書の目的

本書は、MosaicLynx の最初の提供形態である Chrome 拡張機能のプロダクト仕様を定義する。

実装方式と責務分担は [Architecture](./architecture.md) に定義する。
Web ページから Extension または Mobile App へトランザクションを渡す SDK と Relay の仕様は [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md) に定義する。

本書内の「MVP」は、最初に一般利用可能な状態として提供する範囲を指す。「将来対応」は設計上考慮するが、MVP の受け入れ条件には含めない。

## 2. プロダクト概要

MosaicLynx は、Symbol / NEM の dApp 接続と署名に特化した Signer（署名機）である。

秘密鍵を安全に保持し、ユーザーが内容を確認・承認した場合に限り、dApp から要求されたメッセージまたはトランザクションへ署名する。送金や資産運用を主体とするウォレットではない。

最初に Chrome Extension（Manifest V3）を提供し、将来は同じ Core を利用したスマートフォンアプリへの展開を想定する。

Web dApp は MosaicLynx SDK の共通 `signTransaction()` を利用する。SDK は対応 Provider がある環境では Extension と直接通信し、Provider がない対応スマートフォンでは E2E 暗号化 Relay を介して Mobile App と通信する。dApp はこの transport の違いを意識しない。

## 3. 設計原則

- 秘密情報を dApp や Web ページへ公開しない。
- 署名は要求ごとにユーザーの明示的な承認を必要とする。
- 署名による全状態変更と資産移動を解析・表示できない要求は拒否し、警告付きのブラインド署名を許可しない。
- 通常のメッセージ署名は Origin、チェーン、ネットワーク、用途、nonce、有効期限を署名対象に含む構造化形式とする。
- Mainnet と Testnet を視覚的・論理的に分離し、誤署名を防ぐ。
- dApp に公開するアカウント情報は、Origin、プロファイル、接続スコープ、ユーザーが選択したアカウントの接続許可に限定する。
- UI は接続、プロファイル、アカウント、署名確認に集中させる。
- Chrome 固有処理を Core から分離し、将来のモバイル展開を妨げない。

## 4. 用語

| 用語 | 意味 |
| --- | --- |
| チェーン | `Symbol` または `NEM` |
| ネットワーク | `Mainnet` または `Testnet` |
| 接続スコープ | チェーンとネットワークの組み合わせ。例: `Symbol Testnet` |
| プロファイル | Mainnet または Testnet の一方に属し、Symbol / NEM 双方のアカウントを保持するまとまり |
| アカウント | Symbol / NEM で共用する一つの鍵と表示名、およびチェーンごとに導出したアドレス・公開鍵の組み合わせ |
| アクティブアカウント | 現在の署名候補として選択されているアカウント |
| Origin | dApp の接続許可を識別する `scheme://host[:port]` |
| Profile Vault | 一つのプロファイルの暗号化した秘密情報と、そのロック状態を管理する領域 |
| ロック | 秘密情報を復号・利用できず、署名できない状態 |
| 構造化メッセージ署名 | Origin、チェーン、ネットワーク、用途、nonce、有効期限とpayloadをcanonical encodingして署名する方式 |
| Legacyメッセージ署名 | SSS互換のために従来のmessage bytesへ署名する方式。通常Providerからは利用できない |
| オフライン署名 | Signerがノードや外部metadata serviceへ通信せず、ローカルで解析・署名を完結すること。コールドウォレットまたはair-gapを意味しない |

プロファイルはネットワーク単位で分離する。一つの Mainnet プロファイルまたは Testnet プロファイルの中に、Symbol と NEM のアカウントを保持する。異なるネットワークのアカウントを同じプロファイルへ保存してはならない。

## 5. 対応範囲

### 5.1 MVP

- Symbol Mainnet / Testnet
- NEM Mainnet / Testnet
- プロファイルの作成、選択、名称変更、削除
- アカウントの作成、インポート、選択、名称変更、削除
- パスワードによるロック / アンロック
- `window.mosaicLynx` Provider の公開
- Origin ごとの dApp 接続許可、切断、許可一覧の確認・削除
- 構造化メッセージ署名
- SSS 互換 Adapter 内に隔離した Legacy メッセージ署名
- トランザクション署名
- 署名要求ごとの確認画面
- SSS 互換 Adapter
- 日本語 / 英語
- ライト / ダークテーマ

### 5.2 将来対応

- React Native / Expo によるスマートフォンアプリ
- MosaicLynx SDK と E2E 暗号化 Relay による同一スマートフォン上のトランザクション受け渡し
- 生体認証、パスキーによるアンロック
- 対応言語の追加
- バックアップ方式の拡張

### 5.3 対象外

- トランザクション履歴
- モザイク / トークン管理
- ネームスペース管理
- マルチシグ構成の作成・管理
- ハーベスティング
- 送信済みトランザクションの継続的な状態監視
- dApp に対する永続的な署名許可
- XYM / XEM の残高表示と残高管理
- ノードの自動選択、手動設定、ノードリスト管理
- 署名のためのノード通信

トランザクションの検証、解析、署名は SDK とローカルデータだけで完結させ、ノードへ接続しない。

ここでいう chain SDK は transaction の serialization / parsing library を指す。Web dApp 向けの製品名「MosaicLynx SDK」とは区別する。Mobile Relay は transaction を解析せず、E2E 暗号文だけを5分以内の短時間保管する。

既存の aggregate / multisig transaction の内容確認と cosignature は、対応 type / version として完全解析できる場合に限り署名対象にできる。multisig 構成変更 transaction は高リスク操作として、対応表へ明示的に追加されるまで拒否する。「マルチシグ構成の管理」が対象外であることを、任意の multisig payload を署名できる意味に解釈してはならない。

## 6. 初回起動とアンロック

### 6.1 初回起動

保存済みプロファイルがない場合、ウェルカム画面を表示し、次のいずれかへ進める。

- 新しいプロファイルを作成
- 既存のニーモニックからインポート

秘密鍵によるアカウントインポートは、プロファイル作成後のアカウント管理画面から行う。

### 6.2 通常起動

保存済みプロファイルがある場合、アンロック画面を表示する。

- 選択中のプロファイル名とネットワークを表示する。
- パスワードを入力してアンロックする。
- パスワードのヒントを表示できる。
- 別のプロファイルを選択できる。
- プロファイル作成画面へ移動できる。
- パスワードが不正な場合は、秘密情報の有無を推測できる詳細なエラーを表示しない。

パスワードとロック状態はプロファイルごとに管理する。あるプロファイルのアンロックによって、別のプロファイルがアンロックされてはならない。

## 7. プロファイル作成

### 7.1 作成方式の選択

- 新規作成
- ニーモニックからインポート

### 7.2 共通設定

次を入力する。

- プロファイル名
- ネットワーク
- パスワード
- パスワード確認
- パスワードのヒント（任意）

入力条件は次のとおりとする。

- プロファイル名は空白のみを許可しない。
- パスワードは12文字以上とし、英大文字、英小文字、数字、記号などの文字種は強制しない。
- パスワードと確認用パスワードは一致する必要がある。
- パスワードのヒントは任意とする。ヒントはロック中にも表示される非秘密情報として扱い、パスワードそのものを入力しないよう警告する。
- Mainnet / Testnet は色と文言の両方で識別できるようにする。
- Mainnet を選択した場合は、実資産を扱う可能性があることを明示する。

パスワード試行失敗時の遅延はセキュリティ設計で定義する。失敗回数を理由に暗号化データを削除したり、復元不能な恒久ロックを行ったりしない。

### 7.3 新規作成フロー

1. 共通設定を入力する。
2. ニーモニックを生成して表示する。
3. オフラインで安全にバックアップする必要があることを表示し、確認を求める。
4. ニーモニックの全単語を、候補から正しい順番で選択させる。候補はアルファベット順に表示する。
5. 正しく確認できた場合にのみ、プロファイルと最初の共用アカウントを保存する。
6. 完了画面からアンロック画面へ移動する。

ニーモニックは確認フローを離れた後、平文で画面・ログ・一時ストレージへ残さない。

- 画面共有、録画、スクリーンショット、Clipboard、クラウドメモ、チャットへの保存を禁止する警告を表示する。
- バックアップ確認は記憶を促すものではなく、ユーザーが作成したオフライン記録から回答するよう案内する。
- 作成完了時に、作成日時、復旧対象プロファイル、個別秘密鍵由来 Account は別途バックアップが必要であることを示す非秘密の backup checklist を出力できる。
- 組織利用では、生成環境、立会者、封印媒体、保管場所、アクセス記録、定期復旧試験、廃棄手順を定めた seed ceremony が別途必要であり、MVP の画面確認だけでカストディ要件を満たすとは表示しない。

### 7.4 ニーモニックからのインポート

1. 共通設定を入力する。
2. ニーモニックを入力する。
3. 単語数、辞書、チェックサムを検証する。
4. 派生する最初のアカウントと、Symbol / NEM それぞれのアドレスを確認表示する。
5. プロファイルと最初の共用アカウントを保存する。
6. 完了画面からアンロック画面へ移動する。

無効なニーモニックは保存しない。入力値は処理完了後にメモリから可能な範囲で破棄する。

## 8. ホーム画面

ログイン後の起点画面の名称は「ホーム」とする。

MVP では次を表示・操作できる。

- ロック状態
- 選択中のチェーンとネットワーク
- プロファイルの選択
- アカウントの選択
- アカウント名、および選択中チェーンのアドレスと公開鍵
- 接続中の dApp と接続解除への導線
- プロファイル管理、アカウント管理、設定への導線
- 手動ロック

Testnet 選択中は、常に見える位置へ Testnet 表示を出す。Mainnet / Testnet の切り替えは、誤操作を避ける確認を伴う。

XYM / XEM の残高は表示しない。

## 9. プロファイル管理

- プロファイルの一覧を Mainnet / Testnet とともに表示する。
- プロファイル名を変更できる。
- パスワードを変更できる。
- 新しいプロファイルを追加できる。
- 現在使用中ではないプロファイルを削除できる。
- 使用中のプロファイルは削除できない。
- 削除前に、対象名、ネットワーク、失われる Symbol / NEM のアカウント数を表示して再確認する。
- 削除した秘密情報と接続許可は復元できないことを明示する。

## 10. アカウント管理

### 10.1 一覧と操作

- プロファイルに属する共用アカウントを一覧表示する。
- 新規鍵を生成してアカウントを追加できる。
- 秘密鍵をインポートしてアカウントを追加できる。
- アカウント名を変更できる。
- デフォルトアカウントを選択できる。デフォルト選択は Symbol / NEM で共通とする。
- アカウントを削除できる。
- プロファイルには常に一つ以上の共用アカウントを必要とし、最後のアカウントは削除できない。

### 10.2 鍵の由来

一つのアカウントは一つの秘密鍵を持ち、その同じ秘密鍵から Symbol / NEM それぞれのアドレスと公開鍵を導出する。アカウントには、復元方式を判断できるように鍵の由来を保持する。

- `mnemonic`: プロファイルのニーモニックと派生パスから復元したアカウント
- `privateKey`: プロファイルとは独立した秘密鍵をインポートしたアカウント

秘密鍵由来のアカウントは、ニーモニックだけでは復元できないことを追加時とバックアップ確認時に明示する。

ニーモニックは BIP39 の英語 24 語とする。鍵は Symbol Desktop Wallet と互換性のある派生パスで導出し、その同じ鍵を NEM にも使用する。NEM ウォレットとのニーモニック互換性は要件としない。Symbol Desktop Wallet の派生パスとアカウント番号の対応表を実装前に固定し、既知ベクトルで検証する。

Symbol と NEM で同じ秘密鍵を使用することは意図した互換性要件である。NEM Identity は Symbol 互換パスで派生した秘密鍵を NEM SDK へ入力して導出し、NEM 公式ウォレットのニーモニック互換は要件としない。一方のチェーン実装または秘密鍵が侵害された場合は両チェーンの Account が影響を受けるため、新規作成、インポート、バックアップ確認画面にこの共通リスクを表示する。Mainnet / Testnet の Profile 分離は権限と誤操作を防ぐ論理分離であり、同じニーモニックを両方へインポートした場合の秘密鍵分離を保証しない。

## 11. dApp 接続と権限

### 11.1 接続要求

- 接続許可は Origin、プロファイル、接続スコープ、ユーザーが選択したアカウントの組み合わせで管理する。
- 未許可の Origin から `connect()` が呼ばれた場合、接続確認画面を表示する。
- 確認画面には未検証のサイト名、canonical Origin、ASCII / Punycode Origin、要求されたチェーン、ネットワーク、公開候補アカウントを表示する。
- ユーザーは公開するアカウントを一つ以上明示的に選択する。既定ですべてを選択しない。
- ユーザーが承認した場合のみ、選択したアカウントのアドレス、公開鍵、表示名を dApp へ返す。
- 拒否した場合は、Provider の `USER_REJECTED` エラーを返す。
- 同じ Origin、プロファイル、接続スコープへの接続は、同じアカウント許可が残っている間は再確認しない。公開アカウントを増やす場合は再承認を必要とする。
- dApp へは許可された共用アカウントのうち、接続時に要求されたチェーンのアドレスと公開鍵だけを返す。
- ロック中の新規接続と許可変更は行わず、アンロックと承認を必要とする。既存許可に対する `getAccounts()` は許可済み公開情報だけを返してよい。
- MVP はトップレベル frame からの要求だけを受け付け、iframe からの接続要求は拒否する。

### 11.2 許可の管理

- ユーザーは接続中 dApp の一覧を確認できる。
- ユーザーまたは dApp は接続を解除できる。
- プロファイルを削除した場合、そのプロファイルに対する接続許可を削除する。
- アカウントを追加しても既存接続許可へ自動追加しない。削除した場合は各許可の対象から除去し、対象が空になれば接続を解除して `disconnect`、一部だけ変われば `accountsChanged` を通知する。
- Origin は scheme、host、port を含む canonical 形式と ASCII / Punycode 形式を表示し、パス、favicon、ページタイトル、サイト指定の表示名だけで判断させない。
- 権限の有無にかかわらず、秘密鍵とニーモニックは公開しない。

### 11.3 チェーンとネットワーク

dApp は接続時および署名要求時に対象チェーンとネットワークを指定する。MosaicLynx は dApp の要求によってアクティブプロファイル、チェーン、ネットワークを切り替えない。

- 指定ネットワークと接続済みプロファイルのネットワークが異なる場合はエラーにする。
- トランザクション payload から判定したチェーンまたはネットワークが要求値と異なる場合はエラーにする。
- 対象チェーンに属さないアカウントでは署名しない。
- 署名 Account が接続許可の `accountIds` に含まれない場合は署名しない。

## 12. 署名

### 12.1 共通要件

- 署名要求は接続済み Origin からのみ受け付ける。
- 対象プロファイルがロック中の場合は署名せず、拡張機能のアンロック画面を表示する。Web ページへパスワードを入力させない。
- 署名ごとに独立した確認画面を表示する。
- ユーザーが承認するまで署名しない。
- 拒否、画面を閉じる、要求の期限切れはいずれも署名せずエラーを返す。
- 承認要求の有効期限は作成から5分を上限とする。構造化メッセージは自身の `expiresAt` と承認期限の早い方を使用し、延長には新しい requestId、digest、nonce と再承認を必要とする。
- 承認待ちの間に Origin、tab、top-level document、プロファイル、アカウント、接続スコープ、payload が変化した場合は要求を無効にする。navigation と tab close も無効化条件とする。
- Profile、Account、Permission、Vault の revision を要求作成時、承認時、署名直前に照合し、一つでも変化した場合は要求を無効にする。
- 同一 Profile の署名、lock、Account / Permission 更新は直列化する。Service Worker 再起動後に承認済み要求から署名を自動再開しない。
- 署名後のブロードキャストは dApp の責務とし、MosaicLynx は署名結果のみ返す。

### 12.2 構造化メッセージ署名確認

通常 Provider は、次のフィールドを含む構造化メッセージだけを受け付ける。

- 固定 domain: `mosaiclynx.message.v1`
- Background が確定した Origin
- チェーンとネットワーク
- 署名用途を表す `purpose`
- Origin + Account 単位で一意な `nonce`
- `issuedAt` と `expiresAt`
- `utf8` または `hex` を明示した payload

signing bytes は ASCII prefix `MOSAICLYNX\0MESSAGE\0V1\0` と、構造化 object を RFC 8785 JCS で canonicalize した UTF-8 byte 列の連結とする。`purpose` は `[a-z0-9][a-z0-9._:-]{0,63}`、nonce は CSPRNG で生成した16〜32 byteのpaddingなしbase64url、日時はUTCのRFC 3339・秒精度・fractionなしとする。`issuedAt` は現在時刻の前後5分以内、`expiresAt` は `issuedAt` より後かつ10分以内とする。UTF-8 payload は NFC 済みの有効な Unicode とし、NFC でない入力は変換せず拒否する。hex payload は偶数長lowercaseとし、decoded payload は16 KiB以下とする。

dApp が申告した Origin と Background が確定した Origin が異なる場合は拒否する。期限切れ、不正な日時、再利用 nonce、空または規則外の `purpose` は拒否する。request受付時にnonce hashを原子的に`reserved`とし、署名開始時に`used`へ遷移させる。同じnonceの並行要求を拒否し、拒否・失敗後もexpiresAtまでは再利用させない。replay cacheにはpayloadを含まないhash、Origin、Profile、Account、state、expiresAtだけを短寿命で永続化し、Service Worker再起動後も期限内の再利用を拒否する。signing bytesとSHA-256 digestを承認前と署名直前に再生成して一致を確認し、chainごとの既知ベクトルで固定する。

最低限、次を表示する。

- 要求元 Origin
- チェーンとネットワーク
- 署名アカウント名とアドレス
- purpose、nonce、有効期限
- payload 本文、encoding、および安全に表示可能な表現
- 実際の signing bytes の digest
- 暗号化メッセージの場合は受信者公開鍵
- 人間が読めないデータへの署名である場合の警告

制御文字、双方向文字、ゼロ幅文字を可視化し、UTF-8 表示と hex 表示を切り替えられるようにする。表示できない、またはサイズ上限を超える payload は署名しない。

### 12.3 SSS Legacy メッセージ署名

従来形式のメッセージ署名は SSS Adapter からのみ利用でき、`window.mosaicLynx` Provider には公開しない。Legacy request は Origin、tab、top-level frame、Account、chain、networkへbindingし、短い TTL と single-use ID を持たせる。通常の構造化署名と異なる専用画面で、domain separation、nonce、有効期限が署名対象に含まれず、署名が別用途へ再利用される可能性を固定表示する。

Legacy であっても raw signing bytes、encoding、digest を表示できない要求は拒否する。SSS staged message は別 Origin、tab、frame、Account の要求へ引き継がず、完了、拒否、timeout、navigation、disconnect 時に破棄する。

### 12.4 トランザクション署名確認

payload をチェーン別 Adapter で完全に解析する。対応 transaction type / version の全フィールド、aggregate / multisig に含まれる全 inner transaction、signer、chain 固有署名コンテキストを検証し、canonical に再シリアライズした byte 列が元 payload と完全一致する場合だけ確認画面へ進む。

MVP の署名 allowlist は次に限定する。SDK更新で新しい type / version が追加されても自動的に許可しない。

| チェーン | outer transaction | version | 許可する inner / 追加条件 |
| --- | --- | --- | --- |
| Symbol | TransferTransaction | 1 | innerなし |
| Symbol | AggregateCompleteTransaction | 2 | EmbeddedTransferTransaction version 1のみ、最大100件 |
| Symbol | AggregateBondedTransaction | 2 | EmbeddedTransferTransaction version 1のみ、最大100件 |
| Symbol | Aggregate cosignature | 対応SDKの固定schema | 完全な親Aggregate payloadを同時に受け取り、上記条件で再解析できる場合のみ |
| NEM | TransferTransaction | 1 / 2 | innerなし |
| NEM | MultisigTransaction | 1 | innerはTransferTransaction version 1 / 2を1件だけ許可し、multisigの入れ子を禁止 |
| NEM | MultisigCosignatureTransaction | 1 | 完全な参照先MultisigTransactionを同時に受け取り、上記条件で再解析できる場合のみ |

transaction payload は256 KiB以下、aggregateのネスト深度はouterとembeddedの2階層までとする。cosignatureはhashやpartial dataだけでは署名せず、署名対象となる親transaction全体、署名者の役割、全資産増減を確認できなければ拒否する。対応SDKのschema名、numeric type、version、署名対象byte範囲、network / generation hash等のchain固有contextを固定vectorとともに互換表へ記録する。

上表にない key link / unlink、account restriction、mosaic definition / supply、namespace registration、address / mosaic alias、secret lock / proof、account metadata、multisig構成変更その他のtransactionはMVPでは拒否する。将来追加する場合は、type / version、全フィールド表示、正味効果、専用警告、canonical test、fuzz testを揃えた仕様変更とProvider互換表更新を必要とする。

- 要求元 Origin
- チェーンとネットワーク
- トランザクション種別
- 署名アカウント名とアドレス
- 宛先
- 金額と通貨 / モザイク識別子
- 最大手数料
- メッセージ
- 期限
- 連署、アグリゲート等の重要な属性
- 全 inner transaction を集約した資産増減、全宛先、権限変更
- 署名者が initiator / cosigner / multisig participant のいずれであるか
- raw field、payload digest、外部未検証の metadata

未知 transaction type / version、未解析フィールド、余剰 byte、非 canonical encoding、整数 overflow、過剰なネストまたは要素数、signer 不一致がある場合は署名を拒否する。警告付きで続行する操作は設けない。将来 key link / unlink、account restriction、mosaic supply、namespace、multisig 構成変更等を追加する場合は高リスク種別として専用の効果説明を必須とし、対応表と専用表示がない種別は拒否する。

namespace alias、mosaic name / divisibility 等をローカルで確定できない場合は、推測した名称や換算額を表示せず、raw ID と atomic amount を「外部未検証」として表示する。これは transaction 自体の未解析を許容するものではない。解析結果だけを信用せず、署名直前に元 payload、canonical encoding、要求チェーン、Profile network、Account、Permission、signerを再検証する。

## 13. ロック

- 起動直後は全プロファイルをロック状態とする。
- ユーザーは現在のプロファイルを任意の時点で手動ロックできる。
- 初期設定では無操作時間が15分経過したプロファイルを自動ロックする。
- ブラウザ終了時、端末のスリープからの復帰時、Service Worker の再起動時に全プロファイルをロックする。
- ロック中も公開情報と接続許可は保存できるが、対象プロファイルの秘密情報の復号と署名は行えない。
- ロックしても Origin の接続許可は削除しない。
- アンロックの成功・失敗を Web ページへ過剰に通知しない。

## 14. 設定

### 14.1 MVP

- 言語: 日本語 / 英語
- テーマ: ライト / ダーク / システム設定に追従
- 自動ロックまでの無操作時間
- 接続済み dApp の確認と削除

初期言語はブラウザの言語に合わせ、未対応の場合は日本語とする。ユーザーが選択した言語を以後優先する。

### 14.2 将来対応

- 生体認証
- パスキー

## 15. 保存データの論理モデル

具体的な暗号化形式と Storage の分割はアーキテクチャ設計で定義する。

```text
Profiles[]
├── id, name, network, revision
├── ProfileVault
│   ├── vaultVersion
│   ├── revision
│   ├── kdf / cipher metadata
│   └── encryptedMnemonic / encryptedPrivateKeys
└── Accounts[]
    ├── id, name, revision
    ├── identities.symbol: address, publicKey
    ├── identities.nem: address, publicKey
    ├── source: mnemonic | privateKey
    ├── derivationPath?
    └── encryptedSecretRef

PublicSettings
├── language, theme, autoLockDuration
├── activeProfileId
├── activeChain
├── activeAccountId
└── schemaVersion

Permissions[]
├── origin
├── profileId
├── scope: chain, network
├── accountIds[]
├── revision
└── createdAt, updatedAt

UsedMessageNonces[]
├── nonceHash, origin, profileId, accountId
└── state: reserved | used, expiresAt
```

要件は次のとおりとする。

- 保存形式に `schemaVersion` を持たせ、マイグレーション可能にする。
- 秘密鍵とニーモニックを暗号化せず保存しない。
- 鍵の由来と、ニーモニック由来の場合は派生パスを保持する。
- 公開設定、接続許可、プロファイルごとの暗号化 Vault を論理的に分離する。
- ログ、エラー、クラッシュレポートへ秘密情報や署名 payload を出力しない。
- `chrome.storage.local` と `chrome.storage.session` は trusted extension context だけからアクセス可能にし、Content Script へ直接公開しない。
- MVP の Vault は Argon2id（memory 64 MiB、iterations 3、parallelism 1、output 32 byte）、Profile ごとの 128 bit salt、AES-256-GCM、暗号化ごとの一意な 96 bit nonce、Profile / format / schema / crypto metadata を含む AAD を最低要件とする。対象端末の計測により KDF を強化してよいが、実行時または低性能端末で最低値より弱めない。bundled WebAssemblyを使う場合はartifactを固定し、remote WASM、JavaScriptの`eval`、動的moduleを許可しない。
- password rotation と schema / crypto migration は copy-on-write で実行し、完全性検証後に切り替える。失敗、中断、容量不足時は旧 Vault を保持し、暗号形式の downgrade を拒否する。

## 16. Provider と SSS 互換

### 16.1 MosaicLynx Provider

Web ページへ `window.mosaicLynx` を公開する。公開 API は Promise のみとし、コールバック形式は提供しない。

```ts
type Chain = "symbol" | "nem";
type Network = "mainnet" | "testnet";

interface SignedMessage {
  signature: string;
  signerPublicKey: string;
  signingDigest: string;
  message: {
    domain: "mosaiclynx.message.v1";
    origin: string;
    chain: Chain;
    network: Network;
    purpose: string;
    nonce: string;
    issuedAt: string;
    expiresAt: string;
    payload: { encoding: "utf8" | "hex"; value: string };
  };
}

version: string
apiVersion: string
connect(params: { chain: Chain; network: Network }): Promise<Account[]>
disconnect(): Promise<void>
getAccounts(): Promise<Account[]>
getActiveAccount(): Promise<Account | undefined>
signMessage(params: {
  chain: Chain;
  network: Network;
  purpose: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  payload: {
    encoding: "utf8" | "hex";
    value: string;
  };
  recipientPublicKey?: string;
  accountId?: string;
}): Promise<SignedMessage>
signTransaction(params: {
  chain: Chain;
  network: Network;
  payload: string;
  accountId?: string;
}): Promise<SignedTransaction>
on(event, listener): void
removeListener(event, listener): void
```

公開 API の内部通信は request / response 型 RPC とする。Provider は少なくとも次のイベントを通知する。

- `accountsChanged`
- `disconnect`

イベント名・引数・エラーコードを API バージョンごとに固定し、破壊的変更時は `apiVersion` のメジャーを更新する。

dApp へ `switchProfile()`、`switchChain()`、`lock()`、`unlock(password)` は公開しない。プロファイル選択、チェーン選択、ロック、アンロックは拡張機能 UI だけで行う。

`connect()`、`signMessage()`、`signTransaction()` の引数には対象チェーンとネットワークを含める。Background は接続済みプロファイル、署名アカウント、トランザクション payload との一致を検証し、不一致時は署名せずエラーを返す。

`signMessage()` の実際の署名対象には、API 引数に加えて固定 domain と Background が確定した Origin を含める。dApp が raw message bytes を直接署名させる API は公開しない。構造化メッセージ仕様は Provider API v2 として固定し、Legacy 形式を v2 の隠し option として追加してはならない。

返却値には署名だけでなく、実際に署名した完全な構造化メッセージ、signer public key、signing digest を含める。検証側 dApp は Origin、chain、network、purpose、expiresAt を照合し、nonceを一度だけ受理しなければならない。Wallet側のreplay cacheは、取得済み署名を検証先へ再送する攻撃を単独では防げないことを開発者文書へ明記する。

MVP の `apiVersion` は `2.0.0` とする。v1 の raw message API を MosaicLynx Provider として互換提供せず、必要な従来互換は SSS Adapter の Legacy RPC だけで扱う。

### 16.2 SSS Adapter

- 既存 dApp 向けに `window.SSS` 互換 API を可能な範囲で提供する。
- 新規 dApp には `window.mosaicLynx` を推奨する。
- SSS 固有の状態保持とメソッド変換は Adapter 内に閉じ込める。
- Core と MosaicLynx Provider は SSS を意識しない。
- 完全互換でない API は対応表と制限事項を公開する。
- SSS の従来メッセージ署名は Legacy 専用 RPC へ変換し、通常 Provider の `signMessage()` と同じメソッドへ混在させない。
- staged transaction / message は Origin、tab、top-level frame、Account、chain、network に bindingし、TTL、single-use、navigation / disconnect 時の破棄を保証する。

## 17. 非機能要件

### 17.1 セキュリティ

- Content Security Policy により外部スクリプト、JavaScript の `eval`、動的 module を禁止する。Argon2id の固定済み bundled WebAssembly に必要な `wasm-unsafe-eval` だけを extension page の最小範囲で許可できるが、remote WASM と任意 bytecode の入力経路は設けない。
- Web ページ、Content Script、Service Worker、承認画面の境界で全メッセージを検証する。
- Service Worker は `sender.url` から Origin を算出し、ページから申告された Origin を信用しない。
- MVP は top-level frame だけを許可し、iframe、opaque Origin、`file:`、`data:`、`chrome:` からの要求を拒否する。
- Origin は canonicalize し、承認画面で scheme、port、Unicode表記、ASCII / Punycode 表記を確認できるようにする。favicon、ページタイトル、サイト名は認証情報として扱わない。
- 承認要求には一意 ID、有効期限、一度限りの解決を設ける。
- 同一要求への二重承認、承認画面の再利用、リプレイを防止する。
- 暗号方式と KDF パラメータを保存形式に含め、将来更新可能にする。
- パスワード、秘密鍵、ニーモニックを DOM 属性、Clipboard、ログへ残さない。
- 対応表にない transaction type / version、未解析フィールド、非 canonical payload は Mainnet / Testnet とも署名しない。
- Profile、Account、Permission、Vault の revision と request digest を承認時と署名直前に再検証する。
- Chrome Extension 版は Secure Enclave / Secure Element へ秘密鍵を隔離しないソフトウェア署名機である。アンロック中の OS、ブラウザ、extension process、配布 artifact の侵害までは防げず、コールドウォレット、ハードウェアウォレット、企業カストディ相当と表示しない。
- raw secret を UI state、DOM、通常の domain object、例外、telemetry へ渡さず、署名境界内の上書き可能な byte buffer で可能な限り短時間だけ扱う。JavaScript の GC により完全なメモリ消去を保証できない限界を脅威モデルに記載する。

### 17.2 ユーザビリティとアクセシビリティ

- 主要操作をキーボードのみで完了できる。
- フォーカス位置を視認できる。
- 状態を色だけで表現しない。
- 署名承認と拒否を誤操作しにくい配置にする。
- 長いアドレスと Origin は省略表示だけでなく全文確認できる。
- 承認を初期 focus または Enter key の既定動作にしない。
- aggregate / multisig は全 inner transaction の正味効果を先に表示し、個別明細と raw digest を後から確認できるようにする。
- 制御文字、双方向文字、ゼロ幅文字を可視化し、UTF-8 / hex 表示を切り替えられるようにする。
- 高リスク transaction type は一般的な「署名する」だけでなく、実際の権限変更や鍵操作を承認ボタン付近へ明記する。

### 17.3 対応環境

- MVP は Chrome の現行安定版を対象とする。
- Manifest V3 を使用する。
- 他の Chromium 系ブラウザへの対応可否は別途検証する。

### 17.4 供給網とアップデート

- dependency lockfile と package integrity を固定し、リリースごとに SBOM、既知脆弱性 scan、artifact digest、build provenance を保存する。
- 暗号、SDK、serialization、Chain Adapter の依存更新時は固定 vector、差分 test、fuzz test、全対応 transaction type の回帰 test を必須とする。
- 本番 build は remote code、`eval`、動的 script、未固定 CDN asset を含めない。
- Chrome Web Store の公開権限は phishing-resistant MFA と複数人承認で保護する。脆弱 version の公開停止、ユーザー告知、秘密情報移行を含む incident response plan を用意する。
- schema / Vault migration の中断、容量不足、破損、旧 version 起動を試験し、復旧不能な自動更新を行わない。

### 17.5 監査・カストディ

MVP は単独ユーザーによるローカル承認型であり、それだけで企業カストディの職務分離を満たすと表示しない。将来の組織利用に備え、Policy / Signer 境界から次へ拡張可能にする。

- 宛先 allowlist、金額上限、transaction type 禁止、時間帯、二者承認、緊急停止
- Hardware Signer、Secure Element、MPC の非同期署名と cancel / timeout
- request digest、解析結果 digest、Origin、公開 Account ID、判断、時刻、app / parser version、policy result の監査記録

監査記録には秘密鍵、ニーモニック、password、full message、full transaction payload を含めない。hash chain または署名による改ざん検知、保存期間、削除、暗号化 export を定義する。個人向け既定では詳細監査を opt-in とする。

## 18. MVP 受け入れ条件

- Mainnet / Testnet のプロファイルを作成でき、一つの共用アカウントから Symbol / NEM それぞれのアドレスと公開鍵を取得できる。
- 拡張機能を再起動しても暗号化データと設定を復元できる。
- 正しい認証なしに秘密情報を復号・署名できない。
- 未接続 Origin からアカウント情報を取得・署名できない。
- 接続確認で公開 Account を選択でき、新規 Account が既存 Origin へ自動公開されない。
- 接続確認と各署名確認で canonical / Punycode Origin、チェーン、ネットワーク、対象アカウントを確認できる。
- 拒否または承認画面を閉じた場合、署名されない。
- Mainnet / Testnet 間でプロファイル、アカウント、権限が混在しない。
- ロック時に署名できず、アンロック後のみ署名できる。
- 日本語と英語で主要フローを完了できる。
- Provider の公開 API、イベント、エラーを自動テストで確認できる。
- SSS 互換対象として定義した API を自動テストで確認できる。
- 構造化メッセージの domain、検証済み Origin、chain、network、purpose、nonce、有効期限が実際の signing bytes に含まれ、再利用 nonce と期限切れ要求を拒否できる。
- SSS Legacy メッセージ署名を通常 Provider から呼べず、専用警告、Origin / tab / frame binding、TTL、single-use を自動テストで確認できる。
- 対応 transaction type / version の全フィールドと全 inner transaction を解析し、canonical 再シリアライズが元 payload と一致する場合だけ署名できる。
- 未知 type / version、未解析フィールド、余剰 byte、非 canonical payload、過剰ネスト、signer 不一致を署名前に拒否できる。
- aggregate / multisig の資産増減、全宛先、最大手数料、権限変更、署名者の役割を確認画面で確認できる。
- Vault の AEAD 改ざん、AAD 差し替え、nonce 再利用、弱い KDF parameter、migration 中断、downgrade を拒否または安全に復旧できる。
- iframe と偽装 Origin からの要求を拒否し、Storage が untrusted context から参照できない。
