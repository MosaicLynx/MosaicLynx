# MosaicLynx ブラウザ拡張機能仕様

## 1. 文書の目的

本書は、MosaicLynx の最初の提供形態である Chrome 拡張機能のプロダクト仕様を定義する。

実装方式と責務分担は [Architecture](./architecture.md) に定義する。
Web ページから Extension または Mobile App へトランザクションを渡す MosaicLynx SDK と Relay の仕様は [Web Transaction Handoff Specification](./web-transaction-handoff-spec.md) に定義する。
鍵導出、対応 transaction schema、network constant、署名 byte 列の固定契約は [Chain Compatibility Specification](./chain-compatibility-spec.md) に定義する。

本書内の「MVP」は、最初に一般利用可能な状態として提供する範囲を指す。「将来対応」は設計上考慮するが、MVP の受け入れ条件には含めない。

## 2. プロダクト概要

MosaicLynx は、Symbol / NEM の dApp 接続と署名に特化した Signer（署名機）である。

秘密鍵を安全に保持し、ユーザーが内容を確認・承認した場合に限り、dApp から要求されたメッセージまたはトランザクションへ署名する。送金や資産運用を主体とするウォレットではない。

最初に Chrome Extension（Manifest V3）を提供し、将来は同じ Core を利用したスマートフォンアプリへの展開を想定する。

Web dApp は MosaicLynx SDK の共通 `signTransaction()` を利用する。Extension MVP では対応 Provider と直接通信する。Provider がない対応スマートフォンで E2E 暗号化 Relay を介して Mobile App と通信する経路は Mobile マイルストーンで提供し、Extension MVP の受け入れ条件へ含めない。Mobile 提供後も dApp は transport の違いを意識しない。

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

| 用語                 | 意味                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| チェーン             | `Symbol` または `NEM`                                                                                                           |
| ネットワーク         | `Mainnet` または `Testnet`                                                                                                      |
| 接続スコープ         | チェーンとネットワークの組み合わせ。例: `Symbol Testnet`                                                                        |
| プロファイル         | Mainnet または Testnet の一方に属し、Symbol / NEM 双方のアカウントを保持するまとまり                                            |
| アカウント           | Symbol / NEM で共用する一つの鍵と表示名、およびチェーンごとに導出したアドレス・公開鍵の組み合わせ                               |
| アクティブアカウント | 現在の署名候補として選択されているアカウント                                                                                    |
| Origin               | dApp の接続許可を識別する `scheme://host[:port]`                                                                                |
| Profile Vault        | 一つのプロファイルの暗号化した秘密情報と、そのロック状態を管理する領域                                                          |
| ロック               | 秘密情報を復号・利用できず、署名できない状態                                                                                    |
| 構造化メッセージ署名 | Origin、チェーン、ネットワーク、用途、nonce、有効期限とpayloadをcanonical encodingして署名する方式                              |
| オフライン署名       | Signerがノードや外部metadata serviceへ通信せず、ローカルで解析・署名を完結すること。コールドウォレットまたはair-gapを意味しない |

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
- トランザクション署名
- 署名要求ごとの確認画面
- Profile の暗号化 backup export / import
- 日本語 / 英語
- ライト / ダークテーマ

### 5.2 将来対応

- React Native / Expo によるスマートフォンアプリ
- MosaicLynx SDK と E2E 暗号化 Relay による同一スマートフォン上のトランザクション受け渡し
- 生体認証、パスキーによるアンロック
- 対応言語の追加
- バックアップ方式の拡張
- 詳細監査記録、組織 policy、外部 WORM / audit anchor

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

トランザクションの検証、解析、署名は固定版symbol-sdkとローカルデータだけで完結させ、ノードへ接続しない。

本書では、`@nemnesia/symbol-sdk`を**symbol-sdk**、Web dApp向け`@mosaiclynx/sdk`を**MosaicLynx SDK**と表記する。単独の「SDK」という表記は使用しない。Mobile Relayはtransactionを解析せず、E2E暗号文だけを5分以内の短時間保管する。

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

パスワード試行はProfile単位のmutexで直列化する。連続5回失敗後は`min(60, 2^(failures-5))`秒の遅延をKDF実行前に課し、残り時間だけをUIへ表示する。失敗回数と`nextAttemptAt`は`chrome.storage.session`へ保存し、全trusted documentとService Workerの再起動間で共有する。正しいpasswordでresetし、失敗回数を理由に暗号化データを削除したり、復元不能な恒久ロックを行ったりしない。この遅延はStorageを取得した攻撃者のoffline推測を防がないため、Argon2id最低値を弱めない。

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

### 9.1 暗号化 backup と復旧

- Profile 管理から、Vault、公開索引、Account source、derivation path、`nextAccountIndex`、Permission を一つの暗号化 backup envelope として export できる。平文のニーモニックまたは秘密鍵を file へ出力しない。
- backup は現在の Profile password から導出した backup key で AES-256-GCM 暗号化し、MosaicLynx backup format、Profile ID、network、schema / crypto version、作成時刻を AAD に含める。Vault 暗号文の単純コピーではなく、export ごとに一意な salt と nonce を使う。
- import は schema、KDF 最低値、AEAD、Profile network、全 Account identity、derivation path、重複 ID を検証し、既存 Profile を上書きせず新しい Profile ID へ copy-on-write で復元する。
- 復元後、全 `mnemonicDerived` Account をニーモニックから再導出し、全 `importedPrivateKey` Account を復号して、保存済み Symbol / NEM public key と address が一致しなければ commit しない。
- backup 作成だけを復旧成功とみなさない。ユーザーは Testnet または別の空環境で restore verification を実行でき、非秘密 metadata として `lastBackupAt`、`lastRestoreVerifiedAt`、backup に含まれる Account 数を保持する。
- 削除確認には backup 状態、最終 restore verification、imported private key Account 数、Permission 数を表示する。Mainnet Profile で backup 未確認の場合は Profile 削除を拒否する。
- password 忘失時の迂回復号、秘密の再発行、管理者 reset は提供しない。ニーモニックまたは暗号化 backup とその password のいずれもない場合は復旧不能であることを初回作成時と設定画面に表示する。

## 10. アカウント管理

### 10.1 一覧と操作

- プロファイルに属する共用アカウントを一覧表示する。
- プロファイルのニーモニックから次の未使用 account index を派生してアカウントを追加できる。
- 秘密鍵をインポートしてアカウントを追加できる。
- アカウント名を変更できる。
- デフォルトアカウントを選択できる。デフォルト選択は Symbol / NEM で共通とする。
- アカウントを削除できる。
- プロファイルには常に一つ以上の共用アカウントを必要とし、最後のアカウントは削除できない。

### 10.2 鍵の由来

一つのアカウントは一つの秘密鍵を持ち、その同じ秘密鍵から Symbol / NEM それぞれのアドレスと公開鍵を導出する。アカウントには、復元方式を判断できるように鍵の由来を保持する。

- `mnemonicDerived`: プロファイルのニーモニック、account index、固定派生パスから復元したアカウント
- `importedPrivateKey`: プロファイルとは独立した秘密鍵をインポートしたアカウント

Profile は `nextAccountIndex` を保持する。ニーモニック由来 Account の追加では現在値を使用して保存成功後にだけ単調増加させ、削除済み index を再利用しない。`accountIndex` は `0..2^31-1` とし、上限到達、重複 path、copy-on-write commit の失敗時は追加しない。

imported private key由来のアカウントは、ニーモニックだけでは復元できないことを追加時とバックアップ確認時に明示する。Mainnet 署名へ使用する前に、Profile の暗号化 backup を export 済みであるか、元の秘密鍵を別媒体に保管済みであることを再確認する。

ニーモニック生成はchain / networkに依存しない共通処理とする。固定した`@nemnesia/symbol-sdk`で`new Bip32(SymbolFacade.BIP32_CURVE_NAME, "english").random()`を呼び、既定の`seedLength = 32`からBIP39 English 24 wordsを生成する。生成後は24語、辞書、checksumを検証し、`bip32.fromMnemonic(mnemonic, "")`が成功することを確認する。BIP39 passphraseは空文字に固定し、Profile passwordをBIP39 passphraseとして使用しない。

Account導出はsymbol-sdkへ委譲し、MosaicLynxが派生pathを文字列または数値配列として複製しない。Profile networkで生成した`SymbolFacade`の`facade.bip32Path(accountIndex)`をそのまま`root.derivePath()`へ渡す。得た同じprivate keyを`SymbolFacade.createAccount()`と`NemFacade.createAccount()`へ渡し、public keyとaddressも返されたsymbol-sdk Accountから取得する。MosaicLynx独自の鍵計算、公開鍵導出、address checksum実装を持たない。NEMの`NemFacade.bip32Path()`は使用しない。詳細と固定vectorはChain Compatibility Specificationに従う。

Symbol と NEM で同じ秘密鍵を使用することは意図した互換性要件である。NEM Identity はSymbol SDKで派生した秘密鍵をNEM facadeへ入力して導出し、NEM公式walletのニーモニック互換は要件としない。一方のチェーン実装または秘密鍵が侵害された場合は同じProfile / account indexの両チェーンAccountが影響を受けるため、新規作成、インポート、バックアップ確認画面にこの共通リスクを表示する。Mainnet / Testnetごとのpath選択も`SymbolFacade.bip32Path()`へ委譲する。ただしProfile分離は引き続き権限と誤操作を防ぐ境界として扱い、一方のProfileの復号状態を他方へ共有しない。

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
- `accountId` が指定された場合は、その Account が接続許可に含まれることを検証する。署名 Account の決定に Profile の可変な default Account を使用しない。
- transaction の `accountId` が省略された場合は、canonical 検証済み payload の signer public key と一致する許可済み Account を一意に解決する。一致なし、複数一致、または指定 `accountId` と signer の不一致は署名前に拒否する。
- 構造化 message の `accountId` が省略され、許可済み Account が一つならその Account へ固定する。複数なら確認画面を未選択で表示し、ユーザーが一つを明示選択するまで署名できない。

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

dApp が申告した Origin と Background が確定した Origin が異なる場合は拒否する。期限切れ、不正な日時、再利用 nonce、空または規則外の `purpose` は拒否する。署名 Account が一意な request は受付時に、複数候補から選択する request はユーザーが Account を確定した時点に、nonce hashを原子的に`reserved`とし、署名開始時に`used`へ遷移させる。選択確定後は同じ承認要求内で Account を変更できない。同じ Origin + Account + nonce の並行要求を拒否し、予約後の拒否・失敗・画面終了でもexpiresAtまでは再利用させない。replay cacheにはpayloadを含まないhash、Origin、Profile、Account、state、expiresAtだけを短寿命で永続化し、Service Worker再起動後も期限内の再利用を拒否する。signing bytesとSHA-256 digestを承認前と署名直前に再生成して一致を確認し、chainごとの既知ベクトルで固定する。

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

### 12.3 トランザクション署名確認

payload をチェーン別 Adapter で完全に解析する。対応 transaction type / version の全フィールド、aggregate / multisig に含まれる全 inner transaction、signer、chain 固有署名コンテキストを検証し、canonical に再シリアライズした byte 列が元 payload と完全一致する場合だけ確認画面へ進む。

Chain Adapterは固定版symbol-sdkを次の標準経路として使用する。

- Symbol: `SymbolTransactionFactory.deserialize()`、transactionの`serialize()`、`SymbolFacade.createAccount()`、Symbol Accountの`signTransaction()` / `cosignTransaction()`、`SymbolFacade.verifyTransaction()`、`SymbolFacade.hashTransaction()`
- NEM: `TransactionFactory.deserialize()`、transactionの`serialize()`、`NemFacade.createAccount()`、NEM Accountの`signTransaction()`、`NemFacade.verifyTransaction()`、`NemFacade.hashTransaction()`

MosaicLynx独自のcatbuffer parser、serializer、公開鍵／address導出、署名対象byteのslice、署名、transaction hash実装を本番経路に持たない。MosaicLynxが追加実装するのはallowlist判定、全fieldの意味検証、上限、canonical byte比較、資産増減要約、Permission / revision検証に限定する。symbol-sdkに機能が存在しない場合は独自実装で補わず、そのtransactionまたは機能を未対応として拒否する。

MVPの署名allowlistは次に限定する。symbol-sdk更新で新しいtype / versionが追加されても自動的に許可しない。

| チェーン | outer transaction              | version                              | 許可する inner / 追加条件                                                       |
| -------- | ------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------- |
| Symbol   | TransferTransaction            | 1                                    | innerなし                                                                       |
| Symbol   | AggregateCompleteTransaction   | 2                                    | EmbeddedTransferTransaction version 1のみ、最大100件                            |
| Symbol   | AggregateBondedTransaction     | 2                                    | EmbeddedTransferTransaction version 1のみ、最大100件                            |
| Symbol   | Aggregate cosignature          | 固定版symbol-sdkのcosignature schema | 完全な親Aggregate payloadを同時に受け取り、上記条件で再解析できる場合のみ       |
| NEM      | TransferTransaction            | 1 / 2                                | innerなし                                                                       |
| NEM      | MultisigTransaction            | 1                                    | innerはTransferTransaction version 1 / 2を1件だけ許可し、multisigの入れ子を禁止 |
| NEM      | MultisigCosignatureTransaction | 1                                    | 完全な参照先MultisigTransactionを同時に受け取り、上記条件で再解析できる場合のみ |

transaction payload は256 KiB以下、aggregateのネスト深度はouterとembeddedの2階層までとする。cosignatureはhashやpartial dataだけでは署名せず、署名対象となる親transaction全体、署名者の役割、全資産増減を確認できなければ拒否する。固定版symbol-sdkのschema名、numeric type、version、署名対象byte範囲、network / generation hash等のchain固有contextは Chain Compatibility Specification と固定vectorに従う。

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

Symbol の unresolved address または unresolved mosaic ID が namespace alias を表す場合、MVP は実際の解決先をローカルで確定できないため署名を拒否する。通常の raw mosaic IDについて、mosaic name / divisibility をローカルで確定できない場合は、推測した名称や換算額を表示せず raw ID と atomic amount を「名称・桁数は外部未検証」として表示してよい。残高、account / mosaic restriction、alias の現在状態、期限内に承認されること、重複 announce、既存 cosignature 等のオンチェーン状態は検証保証に含めず、画面へ「チェーン状態は未照合」と固定表示する。これは transaction byte 列の未解析を許容するものではない。解析結果だけを信用せず、署名直前に元 payload、canonical encoding、要求チェーン、Profile network、Account、Permission、signerを再検証する。

## 13. ロック

- 起動直後は全プロファイルをロック状態とする。
- ユーザーは現在のプロファイルを任意の時点で手動ロックできる。
- 復号鍵と秘密鍵 handle は Background Service Worker に保持しない。アンロック session は、ユーザーが視認できる trusted extension document（ホームまたは承認 window）のメモリだけに属する。
- trusted extension document が存在し続ける場合に限り、初期設定では最後のユーザー操作から15分で自動ロックする。全 trusted document の close / crash、ブラウザ終了、端末のsleep復帰、extension reload / updateで直ちにロックする。
- Service Worker の通常の停止・再起動だけでは、既存 trusted document 内の session を自動移送または再生成しない。Worker復帰後は document と一回限りのchallenge-responseで同一extension instance、Profile、Vault revisionを再照合する。trusted documentが存在しない場合は必ずlockedとして扱う。
- 署名要求で locked の場合は専用承認 window 内で password を入力させ、その window 内で解析、再検証、署名を完了する。復号鍵またはraw secretをService Workerへ返さない。承認 window が閉じた場合は要求を拒否し、sessionとsecret handleを破棄する。
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
├── id, name, network, revision, nextAccountIndex
├── lastBackupAt?, lastRestoreVerifiedAt?
├── ProfileVault
│   ├── vaultVersion
│   ├── revision
│   ├── kdf / cipher metadata
│   └── encryptedMnemonic / encryptedPrivateKeys
└── Accounts[]
    ├── id, name, revision
    ├── identities.symbol: address, publicKey
    ├── identities.nem: address, publicKey
    ├── source: mnemonicDerived | importedPrivateKey
    ├── accountIndex?
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

## 16. Provider

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

`signMessage()` の実際の署名対象には、API 引数に加えて固定 domain と Background が確定した Origin を含める。dApp が raw message bytes を直接署名させる API は公開しない。構造化メッセージ仕様は Provider API v2 として固定する。

返却値には署名だけでなく、実際に署名した完全な構造化メッセージ、signer public key、signing digest を含める。検証側 dApp は Origin、chain、network、purpose、expiresAt を照合し、nonceを一度だけ受理しなければならない。Wallet側のreplay cacheは、取得済み署名を検証先へ再送する攻撃を単独では防げないことを開発者文書へ明記する。

MVP の `apiVersion` は `2.0.0` とする。v1 の raw message API は互換提供しない。

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

#### 17.1.1 保証レベルと脅威モデル

| 脅威                            | Software Vault MVP                                                     | 検知・表示                           | 対象外 / 上位 Signer                                               |
| ------------------------------- | ---------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Web page / dApp の悪意          | Origin binding、Permission、完全解析、明示承認で防御                   | 未検証 metadata とchain状態を表示    | Web page自身が作成前payloadを偽ることは、最終payload確認でのみ軽減 |
| Content Script / Provider改ざん | Backgroundとtrusted signing documentでschema・digest・revisionを再検証 | context changeとして拒否             | Chrome本体またはextension process侵害                              |
| 保存領域窃取                    | Argon2id + AES-GCMで防御                                               | AEAD失敗、downgradeを拒否            | 弱いpasswordのoffline推測                                          |
| アンロック中のmemory侵害        | secret lifetime最小化、Service Workerへraw secretを渡さない            | Software Vault表示                   | OS malware、debugger、browser exploitは防御しない                  |
| 配布artifact / Store侵害        | lockfile、provenance、複数人release承認                                | version、parser version表示          | 正規署名済み悪性updateはincident response対象                      |
| Relay侵害                       | E2E AEAD、capability分離                                               | AEAD / digest不一致を拒否            | Mobile端末または正規App侵害                                        |
| Mobile Origin phishing          | Mainnetは登録dApp鍵のOrigin proofを必須化                              | Testnetでproofなしは未検証と固定表示 | 登録鍵はサイト運営主体の正当性や安全性までは保証しない             |

MVP の保証名は `Software Vault` とする。`OS-backed`、`Hardware`、`MPC` を実装するまで同等表示を行わない。保証レベルの説明は設定画面に集約し、署名確認画面では重複表示しない。

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

#### 17.2.1 署名確認 interaction

確認画面は次の三層を順番固定で表示する。

1. **判断要約:** 検証済みOrigin、chain / network、Account、署名者の役割、assetごとの正味増減、全宛先、最大手数料、deadline、chain状態未照合表示
2. **全明細:** transaction順を維持した全inner transaction。100件までvirtualizeしてよいが、省略、paginationによる未読扱い、dApp指定の並べ替えを行わない。宛先・asset別の集約、重複宛先、自己送金、0 amountを強調する。
3. **技術詳細:** 全raw field、payload byte length、payload digest、canonical digest、parser / symbol-sdk version、UTF-8 / hex。通常は折り畳めるがDOMから除去しない。

- 承認ボタンは常に最終層の後へ通常フローで置き、本文と重なる固定表示にしない。初期focus、Enter、Spaceの既定action、画面open直後の座標に配置しない。拒否は常時操作可能にする。
- Mainnetでは画面表示から800ms以上経過し、要約の描画完了と全検証完了を確認するまで承認をdisabledにする。aggregate / multisigは要約を一度表示領域へ入れるまで有効化しない。時間経過だけで承認しない。
- Origin、address、public key、raw IDは先頭末尾だけで判断させず、全文表示、copyではない文字単位選択、同一画面内比較を提供する。Clipboardへ送る操作は別確認を必要とする。
- unresolved aliasを含む要求は警告付き続行ではなく拒否画面にする。名称・divisibilityだけが未検証のraw mosaic IDはatomic amountを主表示し、換算値を表示しない。
- 制御文字、Bidi、zero-widthを置換記号とcode pointで可視化する。安全な表示表現を生成できないmessageは拒否する。
- Mobileの未検証Originには「このサイトはMosaicLynxが確認していません。サイト名ではなく送信内容を確認してください」を承認ボタン直上にも表示する。
- WCAG 2.2 AA、400% zoom、keyboard-only、screen reader、forced-colors、reduced-motion、日本語 / 英語で同一情報をE2E受け入れ条件とする。

#### 17.2.2 規範ワイヤーフレームと確定文言

署名画面は次の情報順序を変更しない。visual designは変更できるが、括弧内のfixture binding、見出し、警告、button label、承認disabled条件を省略しない。

```text
┌ MosaicLynx  SYMBOL MAINNET                        [拒否 / Reject]
│ app.example (app.example)  登録Origin / Registered origin
│ Account A  N...全文...  initiator / asset sender
├ 判断要約 / Decision summary
│ 送付 / Send:  -1,000,000 atomic [0x85BB...C1]
│ 宛先 / To:    N...全文...
│ 最大手数料 / Maximum fee: -50,000 atomic XYM
│ 期限 / Deadline: ISO時刻 + raw
│ ! チェーン状態は未照合 / Chain state not checked
├ 全明細 / All details                         [1 / 1]
│ Transfer V1: signer, recipient, mosaic ID, amount, message
├ 技術詳細 / Technical details [折り畳み]
│ 全raw field、payload/canonical digest、parser/fixture contract version
└ [署名を拒否 / Reject]              [内容を確認して署名 / Confirm and sign]
```

```text
┌ MosaicLynx  SYMBOL MAINNET
│ Aggregate Complete V2 — cosigner候補 / cosigner candidate
├ 正味効果 / Net effects          100 inner transactions
│ Account A: -asset X, +asset Y   最大手数料はinitiator負担
│ 12宛先、3自己送金、2 zero amount、raw ID 4件
├ 全明細 / All details [virtual list、wire順固定]
│ 001 … 050 … 100  （未表示件数を「確認済み」にしない）
├ 成立時の親Transaction効果 / Parent effects if completed
│ ! cosigner権限・既存署名・chain状態は未照合
└ [署名を拒否]              [全100件を表示後: 連署する / Cosign]
```

確定security copyは次とする。翻訳keyの値はsecurity reviewなしに変更しない。

| key                 | 日本語                                                                                 | English                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `approval.reject`   | 署名を拒否                                                                             | Reject                                                                                                      |
| `approval.confirm`  | 内容を確認して署名                                                                     | Confirm and sign                                                                                            |
| `approval.cosign`   | 全明細を確認して連署                                                                   | Review all details and cosign                                                                               |
| `network.mainnet`   | MAINNET・実資産の可能性                                                                | MAINNET · Real assets may be involved                                                                       |
| `state.unverified`  | チェーン状態は未照合です。残高、権限、既存署名、期限到達は確認していません。           | Chain state is not checked. Balances, permissions, existing signatures, and deadline status are unverified. |
| `origin.registered` | 登録Originで検証済み                                                                   | Verified by the registered origin key                                                                       |
| `origin.unverified` | このサイトはMosaicLynxが確認していません。サイト名ではなく送信内容を確認してください。 | MosaicLynx has not verified this site. Verify the transaction details, not the site name.                   |
| `raw_asset.warning` | 名称・桁数は外部未検証です。raw IDとatomic amountで確認してください。                  | Name and divisibility are externally unverified. Verify the raw ID and atomic amount.                       |
| `alias.rejected`    | 解決先をローカルで確認できないaliasを含むため署名できません。                          | Cannot sign because an alias cannot be resolved locally.                                                    |

#### 17.2.3 ユーザビリティ検証

formative test後、release candidateと規範fixtureでsummative testを行う。参加者は日本語・英語、desktop Extension・Mobileの4 cohortに各60名以上、うち半数以上を暗号資産署名経験が月1回以下の利用者とする。同一人物を複数cohortへ重複計上しない。シナリオ順はLatin squareで均衡化し、正解を示す誘導文を使わない。

| scenario / fixture                                                | 必須task                                                                   | critical misapproval                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| 100件Aggregate `SYM-AGG-COMPLETE-V2-TESTNET-100`と改ざん版`…-950` | 正味増減、fee payer、特定宛先、自己送金、zero amountを答え、改ざん版を拒否 | transactionsHash不一致または隠れた101件目を承認 |
| IDN `UX-IDN-HOMOGRAPH-001`                                        | UnicodeとPunycode Originを比較し、homographを拒否                          | canonical ASCII Origin不一致を承認              |
| raw ID `UX-RAW-MOSAIC-001`                                        | raw mosaic IDとatomic amountを正しく照合し、架空名称を信用しない           | raw ID/amount不一致またはalias rejectを承認     |

`critical misapproval rate = critical decoyを承認した人数 / critical decoy提示人数`、`task completion rate = 制限時間内に署名/拒否の正しい最終判断と必須確認質問80%以上を達成した人数 / task開始人数`とする。離脱は未完了に含める。各cohort・各scenarioでcritical misapproval 0件、片側95% Clopper–Pearson上限5%以下（従って最低60件で0件）、task completion 95%以上、誤拒否5%以下を全て満たす。100件Aggregateは180秒、他は90秒を制限時間とし、中央値に加えてp90を報告する。基準未達は文言やlayoutを変更して独立参加者で再試験し、平均値によるcohort間相殺を禁止する。

成果物は`docs/evidence/ux/<release>/`へ匿名化protocol、consent、participant criteria、fixture ID、画面録画のredacted参照、raw event CSV、集計script、結果、issueと改善差分として保存する。秘密、実Account、production payloadを使用しない。

### 17.3 対応環境

- MVP は Chrome の現行安定版を対象とする。
- Manifest V3 を使用する。
- 他の Chromium 系ブラウザへの対応可否は別途検証する。

### 17.4 供給網とアップデート

- dependency lockfile と package integrity を固定し、リリースごとに SBOM、既知脆弱性 scan、artifact digest、build provenance を保存する。
- 暗号、symbol-sdk、serialization、Chain Adapter の依存更新時は固定 vector、差分 test、fuzz test、全対応 transaction type の回帰 test を必須とする。
- 本番 build は remote code、`eval`、動的 script、未固定 CDN asset を含めない。
- Chrome Web Store の公開権限は phishing-resistant MFA と複数人承認で保護する。脆弱 version の公開停止、ユーザー告知、秘密情報移行を含む incident response plan を用意する。
- schema / Vault migration の中断、容量不足、破損、旧 version 起動を試験し、復旧不能な自動更新を行わない。

### 17.5 監査・カストディ

MVP は単独ユーザーによるローカル承認型であり、それだけで企業カストディの職務分離を満たすと表示しない。将来の組織利用に備え、Policy / Signer 境界から次へ拡張可能にする。

- 宛先 allowlist、金額上限、transaction type 禁止、時間帯、二者承認、緊急停止
- Hardware Signer、Secure Element、MPC の非同期署名と cancel / timeout
- request digest、解析結果 digest、Origin、公開 Account ID、判断、時刻、app / parser version、policy result の監査記録

詳細監査記録はOrganizationマイルストーンで実装し、Extension MVPは永続audit trailを提供しない。Organization版の記録には秘密鍵、ニーモニック、password、full message、full transaction payloadを含めず、管理鍵による署名、連番、前record hash、trusted timeを持たせ、外部WORMまたは独立audit serviceへ定期anchorする。保存期間、legal hold、削除承認、暗号化export、閲覧権限をpolicyで定義する。

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
- 構造化メッセージの domain、検証済み Origin、chain、network、purpose、nonce、有効期限が実際の signing bytes に含まれ、再利用 nonce と期限切れ要求を拒否できる。
- 対応 transaction type / version の全フィールドと全 inner transaction を解析し、canonical 再シリアライズが元 payload と一致する場合だけ署名できる。
- 未知 type / version、未解析フィールド、余剰 byte、非 canonical payload、過剰ネスト、signer 不一致を署名前に拒否できる。
- aggregate / multisig の資産増減、全宛先、最大手数料、権限変更、署名者の役割を確認画面で確認できる。
- Vault の AEAD 改ざん、AAD 差し替え、nonce 再利用、弱い KDF parameter、migration 中断、downgrade を拒否または安全に復旧できる。
- iframe と偽装 Origin からの要求を拒否し、Storage が untrusted context から参照できない。
- `SymbolFacade.bip32Path(accountIndex)` と固定BIP39 vectorからMainnet / Testnetの既知Accountを再現し、削除済みaccount indexを再利用しない。
- chain / networkを入力せず`Bip32.random()`で生成したmnemonicが24語、checksum有効、`fromMnemonic(mnemonic, "")`可能であり、`facade.bip32Path(0)`から得たchild private keyが32-byteかつall-zeroでない。
- 暗号化backupを別の空環境へ復元し、mnemonic-derived / imported-private-key双方の全Identityが一致する。改ざん、弱いKDF、重複ID、wrong network、wrong passwordでは既存Profileを変更しない。
- Symbol unresolved address / mosaic aliasをTransferまたはAggregate内で検出し、Mainnet / Testnetとも署名前に拒否する。
- Service Workerを承認待ち、unlock後、署名直前に停止・再起動してもraw secretをWorkerへ保存せず、trusted signing documentが失われた場合は署名しない。
- 署名確認の三層、承認disabled条件、chain状態未照合、Software Vault保証レベル、WCAG 2.2 AAをUI/E2E testで確認できる。
- Profile 20件、Profile + Origin 5件、document 3件、全体50件のpending上限、FIFO、Profileあたり1 window、cancel / disconnect / navigation / lockの無効化範囲をrace testで確認できる。
- `ApprovalRequestEnvelopeV1`のAEAD、TTL、tombstone、Worker / window crash状態遷移と、Background / trusted documentの独立digest再検証をfault injection testで確認できる。
- 17.2.3の全cohort・全scenarioが誤承認率とtask completionの合格基準を満たす。

## 19. Mainnet release evidence

> 初期の個人開発リリースでは、[ADR 0001](./adr/0001-mainnet-evidence-lite.md) と `docs/evidence-policy.json` を正本とするLite policyを適用する。以下の二名承認、再現build、監査、fuzz、key ceremonyの詳細要件はstrict policyへ移行する際の必須条件であり、Liteではmanifest上で `not-required` と明示する。Mainnetを無条件に有効化してよいことを意味しない。

Mainnet署名機能はExtensionとMobileで個別にgateし、次の証跡が一つでも欠落、期限切れ、hash不一致、未承認の場合はbuild時にMainnet capabilityを無効化する。Testnet合格、Store審査通過、開発者の自己申告を代替証跡にしない。release managerは次の正本をread-only artifact storeへ保存し、署名済み`evidence-manifest.json`から全fileのSHA-256を参照する。

```text
docs/evidence/mainnet/<version>/
├── evidence-manifest.json
├── fixtures/{chain-compatibility-version}/
├── tests/{unit,integration,e2e,differential,fuzz}/
├── build/{source,environment-a,environment-b,comparison,provenance,sbom}/
├── mobile/mobile-capability-report.json
├── ux/{ja-desktop,en-desktop,ja-mobile,en-mobile}/
├── audit/{scope,report,findings,remediation,retest,attestation}/
├── incident/{response-plan,contacts,tabletop-report,communications}/
└── release-keys/{inventory,ceremony,rotation,revocation-drill}/
```

`evidence-manifest.json`はrelease version、git commit、dirty=false、source archive digest、artifact digest、SBOM digest、lockfile digest、symbol-sdk version/integrity、chain compatibility version、fixture contract version、parser version、対象OS/browser、各証跡path/digest、生成時刻、二名以上のsecurity/release承認者をJCSで保持し、offline release keyで署名する。証跡内にproduction秘密、mnemonic、private key、full user payload、個人情報を含めない。

### 19.1 規範fixtureとdifferential / fuzz

- Chain Compatibility Specification 4章と7章の全正常・境界・reject fixtureを実体としてcommitし、各fixtureへ安定ID、期待rawFields、role、gross/net asset effect、fee effect、UI日英snapshot、期待errorを含める。Symbol/NEM × Mainnet/Testnet × 全allowlist schemaに欠番を許さない。
- fixed symbol-sdk経路と、test専用の独立field oracle / signing-byte oracleを全fixtureと10万件以上のseeded生成caseでdifferential比較する。decode結果、re-encode byte、signing byte、signature verify、hash、Inspectionの差異0件を合格とし、seed、generator version、全case hashを保存する。
- parser、canonicalizer、Inspection aggregator、Approval envelope decoder、Relay decoderをcoverage-guided fuzz対象とする。初回Mainnetはchain parserごとに単一campaign連続24時間以上かつ合計100 CPU-hour以上、その後のpatch releaseは保存corpus回帰と各30分smokeを必須とする。crash、hang、OOM、sanitizer finding、unbounded allocation、differential mismatchは0件とし、coverage、exec数、最大RSS、corpus digest、全findingと修正commitを保存する。
- 過去corpus、公開catbuffer corpus、truncation全offset、256 KiB、100/101件、u64 arithmetic、Bidi/IDNを毎release再実行する。flaky testのrerun合格だけを証跡にせず、原因と隔離期限を記録する。

### 19.2 Reproducible build

- tag/commitからnetworkを遮断したclean container / VM 2環境を別担当者がbuildし、toolchain image digest、OS、locale、timezone、CPU architecture、Node/pnpm version、lockfile、build command、`SOURCE_DATE_EPOCH`を保存する。
- timestamp、archive order、permission、source map path、署名領域を正規化し、未署名Extension archive / Mobile bundleのbyte digest一致を必須とする。Store署名など再現不能な外部envelopeは分離し、内部payload digest一致と差分理由を機械可読reportにする。
- SLSA provenance相当の署名済みprovenance、CycloneDXまたはSPDX SBOM、license report、malware/secret scan、critical/high既知脆弱性0件を保存する。例外は影響、期限、owner、二者承認を持つ公開可能なrisk acceptanceが必要で、signing boundaryの例外は認めない。

### 19.3 外部security audit

初回Mainnet、signing/Vault/Approval/chain parser/Relayのmajor変更、前回auditから12か月経過の早い時点で独立第三者auditを完了する。scopeはExtension trust boundary、Mobile wrapping、import/restore、cryptography、Symbol/NEM signing byte、全allowlist Inspection、Origin proof、Relay、supply chain、update/rollbackを含む。監査者へsource、設計、fixture、fuzz corpus、再現build手順を提供する。

Critical / Highは0件、Mediumは修正とretest完了、Lowはownerと期限を持つことをrelease条件とする。summary、scope、方法、除外、finding severity、修正commit、retest attestationを公開可能な形で保存する。NDAを理由にscopeと未解決riskまで非公開にしない。監査後にsecurity-sensitive codeが変わった場合、差分を監査者または独立security reviewerが再確認する。

### 19.4 Incident responseとrelease key rotation

incident planは少なくとも鍵漏えい、悪性/破損update、parser bypass、署名byte不一致、Vault復号、Relay metadata/token漏えい、Origin proof鍵侵害、依存compromiseを扱う。24時間365日の一次連絡先と代行、severity、証拠保全、公開停止、Mainnet kill/build disable、最低安全version更新、Store/ユーザー/dApp/監査者への通知、資産移行、postmortemを定義する。Criticalは認知15分、incident commander任命30分、公開停止判断1時間、利用者への初報4時間以内を目標とし、法令・Store要件が短い場合はそちらを優先する。半年ごとにtabletop、年1回はStore公開停止と鍵失効を含む実地drillを行う。

release keyは日常開発端末に置かず、hardware-backed/offline環境で2-of-3以上の管理者承認を必要とする。inventoryにはkey ID、用途（manifest / Store / App / Origin）、algorithm、custodian、作成日、有効期限、backup、revocation方法を記録する。定期rotationは12か月以内、custodian離任、algorithm/policy変更、紛失・侵害疑い時は即時とする。

rotation手順は、(1) incident/change ticket、(2)新鍵ceremonyとattestation、(3)旧鍵で署名した新旧key binding、(4)二重署名移行release、(5)Store/OS/manifest trust更新、(6)clean環境で検証、(7)旧鍵revocation、(8)offline backup更新、(9)利用者告知、(10)recovery drillと証跡manifest更新の順とする。旧鍵を失ってcross-signできない場合は既定のStore/OS account recoveryと独立公開channelでfingerprintを告知し、Web pageだけの鍵置換を信用しない。release signer、Store publisher、最終approverを同一人物にしない。
