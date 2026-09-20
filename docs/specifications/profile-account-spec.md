# MosaicLynx プロファイル・アカウント管理仕様

以下の方針で実装してください。

### Profile backup / restore の適用範囲

本仕様に記載する Profile 全体の backup / restore、export / import に関する内容は、将来の個別 platform / release で当該 capability を提供する場合の仕様として扱う。Browser Extension 初回 milestone / release の必須機能、MVP 完了条件、または現時点の実装必須事項には含めない。

## 1. プロファイル作成

プロファイルは必ずニーモニックを基点として作成する。

作成方法は以下の2種類とする。

- 新しいニーモニックを生成して作成
- 既存のニーモニックをインポートして作成

秘密鍵単体からプロファイルを作成することはできない。

プロファイル作成後は、秘密鍵単体のアカウントを追加インポートできる。

---

## 2. プロファイルのネットワーク

ネットワークはプロファイル単位で固定する。

```ts
type Network = 'mainnet' | 'testnet';
```

プロファイル作成時にMainnetまたはTestnetを選択し、作成後は変更できない。

MainnetとTestnetを併用する場合は、別々のプロファイルを作成する。

---

## 3. 使用チェーン

プロファイル作成時に、以下のいずれか一つのチェーンを選択する。

- Symbol
- NEM

```ts
type Chain = 'symbol' | 'nem';

interface WalletProfile {
  chain: Chain;
  defaultAccountId: string;
}
```

`chain` はプロファイル作成後に変更できない。Symbol と NEM の両方を利用する場合は、チェーンごとに別のプロファイルを作成する。異なるチェーンの Account / Key Identity、秘密鍵、デフォルト設定または権限を一つのプロファイルへ保持してはならない。

---

## 4. HDアカウントセット

HDアカウントセットは、Profile の `chain` に対応する一つの Account / Key Identity を管理する単位である。Account は、対象 Chain を明示した chain-specific 導出契約から生成する。Symbol と NEM を利用する場合も、チェーンごとに別の Profile と HD アカウントセットを使用する。

例:

```text
HDアカウント #0
└─ Profile.chain のアカウント
```

```ts
interface HdAccountSet {
  id: string;
  profileId: string;
  name: string;
  accountIndex: number;
  status: 'active' | 'excluded';

  account: ChainAccount;

  createdAt: string;
  excludedAt?: string;
}
```

---

## 5. HDアカウントの最低数

プロファイルには、アクティブなHDアカウントセットが最低1つ必要。

また、各HDアカウントセットには Profile の `chain` に対応するアカウントが一つ存在しなければならない。

最後に残っているHDアカウントセットは除外できない。

秘密鍵インポートアカウントだけの状態にはできない。

---

## 6. HDアカウントの除外

HDアカウントの削除操作は、完全削除ではなく管理対象からの除外として扱う。

```text
active → excluded
```

例:

```text
HDアカウント #1
└─ Profile.chain のアカウント #1
```

HDアカウントセットを除外する場合は、そのセットのアカウント全体を除外する。

---

## 7. 除外済みHDアカウントのデータ

HDアカウントを除外した際は、対応する暗号化秘密鍵を削除する。

除外済みレコードには、復活に必要な最小限の情報だけを保持する。

```ts
interface ExcludedHdAccountSet {
  id: string;
  profileId: string;
  accountIndex: number;
  name: string;
  excludedAt: string;

  address?: string;
}
```

保持対象:

- HDインデックス
- 表示名
- 除外日時
- 必要に応じて Profile の `chain` のアドレス

秘密鍵は保持しない。

---

## 8. HDインデックス

新しいHDアカウントを追加する場合は、過去に一度も使用されていないインデックスを使用する。

例:

```text
#0 active
#1 excluded
#2 active

新規追加 → #3
```

除外済みインデックスを、新しいHDアカウントの作成に再利用してはならない。

次に使用するインデックスは、過去に使用した最大インデックスに1を加えた値とする。

```ts
nextAccountIndex = maxUsedAccountIndex + 1;
```

---

## 9. 除外済みHDアカウントの復活

除外済みHDアカウントを復活させる機能を用意する。

復活時は、保持しているHDインデックスを使い、プロファイルのニーモニックから Profile の `chain` に対応する Account / Key Identity を、その Chain を明示した導出契約で再導出する。

処理内容:

1. プロファイルを認証する
2. ニーモニックを復号する
3. 保存済みのHDインデックスから、Profile の `chain` に対応する導出契約で秘密鍵を再導出する
4. 公開鍵とアドレスを再計算する
5. 保存済みアドレスがある場合は整合性を検証する
6. 秘密鍵を再暗号化して保存する
7. ステータスを`active`に戻す

復活は新規アカウント作成ではないため、同じHDインデックスを使用する。

---

## 10. 秘密鍵の保存

ニーモニック由来のHDアカウントについても、導出した秘密鍵を暗号化して保存する。

署名時に毎回ニーモニックから再導出する方式にはしない。

保存対象:

- 暗号化ニーモニック
- HDアカウントの暗号化秘密鍵
- インポートアカウントの暗号化秘密鍵

```ts
interface ChainAccount {
  id: string;
  profileId: string;
  chain: Chain;
  name: string;

  origin: 'hd' | 'imported';

  address: string;
  publicKey: string;
  encryptedPrivateKey: EncryptedSecret;

  derivationPath?: string;
  hdAccountSetId?: string;
}
```

`ChainAccount` は一つの Chain-specific Account / Key Identity を表す。`chain` は対象 Chain、`profileId` は Profile に固定された Network との関連を示し、`id` はその Account / Key Identity を一意に識別する。異なる Chain の `ChainAccount` を、一つの秘密鍵を暗黙共用する一つの Account として扱ってはならない。

HDアカウントを除外した場合、そのHDアカウントセットに属する秘密鍵は削除する。

---

## 11. 秘密鍵インポート

秘密鍵 import の raw key そのものは既存の許可方針を維持するが、登録される Account / Key Identity は対象 Chain と Profile Network に明示的に関連付ける。秘密鍵を一方の Chain 用に import したことだけで、他方の Chain 用 Identity として暗黙に利用してはならない。具体的な import の検証条件・拒否条件・UX は Wallet Core / Chain integration / platform 設計へ委譲する。

インポートアカウントはHDアカウントセットには属さない。

アカウントが利用できる Chain は、所属 Profile の `chain` と、Account に明示された Chain Identity の関連付けで決定する。Account の `chain` は Profile の `chain` と一致しなければならず、異なる Chain の Account を同じ Profile へ登録してはならない。

秘密鍵の形式またはSDKによるIdentity導出が不正な場合は、暗号化Vaultやアカウント一覧を変更せず、64桁の16進数が必要であることを表示する。

---

## 12. デフォルトアカウント

デフォルトアカウントは Profile ごとに一つ設定する。

```ts
defaultAccountId: string;
```

初期値は、Profile で最初に作成されたHDアカウントとする。

設定画面から、以下のどちらもデフォルトに選択できる。

- HDアカウント
- 秘密鍵インポートアカウント

デフォルトアカウントが除外または削除された場合は、自動的に別のアカウントへ変更する。

デフォルトアカウントを再選択する場合の推奨優先順位:

1. Profile.chain のアクティブなHDアカウント
2. Profile.chain の秘密鍵インポートアカウント

Profile には最低1つのHDアカウントが存在するため、通常は未設定にはならない。

---

## 13. プロファイルパスワード

プロファイルにはパスワードを設定する。

このパスワードを以下に使用する。

- プロファイルのロック解除
- ニーモニックの暗号化と復号
- 全秘密鍵の暗号化と復号
- 完全バックアップの暗号化と復号
- 秘密鍵表示
- ニーモニック表示
- 秘密鍵エクスポート
- パスワード変更

バックアップ専用の別パスワードは設けず、プロファイルパスワードと同じものを使用する。

---

## 14. パスワード変更

プロファイルパスワードを変更する場合は、全秘密情報を新しいパスワードで再暗号化する。

対象:

- ニーモニック
- 全アクティブHDアカウントの秘密鍵
- 全インポートアカウントの秘密鍵
- 生体認証用に保存している解除情報

マスターキーだけを包み直す方式にはしない。

処理順:

1. 旧パスワードを検証
2. ニーモニックと全秘密鍵を旧パスワードで復号
3. 新しいsaltとnonceを生成
4. 新パスワードから新しい暗号鍵を導出
5. 全秘密情報を新しい暗号鍵で再暗号化
6. 全件の整合性を確認
7. 単一トランザクションまたは原子的処理で保存内容を切り替える
8. 旧暗号データと平文バッファを破棄
9. プロファイルを再ロック

既存データを1件ずつ直接上書きしてはならない。

再暗号化後の全データを一時領域に作成し、すべて成功した場合のみ一括で切り替える。

途中で失敗した場合は、旧パスワードの暗号データを保持し続ける。

---

## 15. パスワード変更とバックアップ

パスワード変更前に作成した完全バックアップは、自動的には更新しない。

```text
変更前に作成したバックアップ → 旧パスワードで復元
変更後に作成したバックアップ → 新パスワードで復元
```

パスワード変更完了時に、以下の注意を表示する。

```text
以前に作成したバックアップのパスワードは変更されません。
必要に応じて、新しい完全バックアップを作成してください。
```

---

## 16. 完全バックアップ

ニーモニックだけではなく、プロファイル全体を暗号化してエクスポートできるようにする。

将来の完全バックアップで対象候補となるもの（最終的な対象範囲は `OPEN-PROFILE-001` で決定する）:

- プロファイル情報
- ネットワーク
- Profile の `chain`
- 暗号化対象となるニーモニック
- HDアカウントセット
- 除外済みHDアカウント情報
- HDアカウントの秘密鍵
- 秘密鍵インポートアカウント
- アカウント名
- デフォルトアカウント
- 自動ロック設定
- 署名時再認証ルール（署名ごとに固定）
- その他プロファイル単位の設定

バックアップ全体は、プロファイルパスワードを使って暗号化する。この Profile password を backup の暗号化 / 復号に使用する関係は本仕様の既存 credential boundary として維持し、Product または将来 platform が別の backup password を追加してはならない。backup format、crypto policy、restore verification および backup-related state の未決事項は `OPEN-PROFILE-001` で管理する。

---

## 17. バックアップ形式

将来の backup format は、暗号化方式、KDF設定および version / migration の扱いを定義しなければならない。これらの metadata の presence、placement および具体形式は `OPEN-PROFILE-001` で決定する。

以下の `BackupEnvelope` は未確定の概念例であり、current wire contract、実装必須の schema または canonical backup format ではない。暗号 algorithm、KDF、AEAD、salt / nonce policy、version / migration、metadata および envelope の最終契約は `OPEN-PROFILE-001` の decision まで確定しない。

概念上、復号前に暗号化方式を判定できるように encryption metadata を扱う必要がある。ただし、metadata を暗号化された本文の外側に置くかを含む最終配置は `OPEN-PROFILE-001` で決定する。

概念例:

```ts
interface BackupEnvelope {
  format: 'mosaic-lynx-profile';
  formatVersion: number;

  encryption: {
    algorithm: string;
    kdf: string;

    kdfParameters: {
      memory?: number;
      iterations?: number;
      parallelism?: number;
    };

    salt: string;
    nonce: string;
  };

  ciphertext: string;
  authTag?: string;
}
```

暗号化アルゴリズム、KDF、AEAD、salt / nonce policy および backup format の version / migration policy は、実装開始前に `OPEN-PROFILE-001` の decision として安全性・互換性を含めて選定する。具体方式は本仕様の現時点では未決である。

---

## 18. プロファイル復元

完全バックアップからプロファイルを復元できるようにする。restore の integrity verification、schema / version compatibility、Account / key identity consistency、verification state および restore commit condition の最終契約は `OPEN-PROFILE-001` で管理する。既存プロファイルを保護し、検証前に current Profile state を変更しない安全下限は維持する。

将来 capability では、既存 Profile との重複によって既存 state を上書きまたはマージしない。重複判定の入力、identity の表現、重複時の結果および import lifecycle の最終契約は `OPEN-PROFILE-001` で決定する。

以下は重複・identity handling の非 normative な概念例であり、現行の error、wire または verification contract ではない。

```text
このプロファイルは既に登録されています。
```

概念上、同一判定にはニーモニックそのものを直接比較せず、ニーモニックから決定的に導出できる識別情報とネットワークの組み合わせを使う。

概念例（最終的な verification identity / schema は `OPEN-PROFILE-001` で決定する）:

```ts
interface ProfileIdentity {
  identityPublicKey: string;
  network: Network;
}
```

同一のニーモニックでも、MainnetとTestnetは別プロファイルとして扱える。

---

## 19. 自動ロック

自動ロック時間は設定画面から変更できるようにする。

選択肢:

- なし
- 1分
- 3分
- 5分
- 10分
- 15分

```ts
type AutoLockDurationMinutes = null | 1 | 3 | 5 | 10 | 15;
```

`null`は自動ロックなしを表す。

初期値は5分を想定する。

基本的には無操作時間を基準にロックする。

以下の場合は自動ロック時間に関係なくロックする。

- 手動ロック
- プロファイル切り替え
- アプリ終了
- OSからロック要求を受けた場合

バックグラウンド移行時の即時ロックについては、実行環境に応じて実装する。

---

## 20. 署名時の認証

署名ごとに再認証を必須とする。プロファイルが `UNLOCKED` であること、connection permission または session が有効であることだけを理由に、署名時認証を省略してはならない。unlock と signing authentication は別の状態・処理として扱う。

```ts
type SigningAuthentication = 'every-signature';
```

### every-signature

署名のたびに、プロファイルパスワードまたは有効な端末認証を要求する。

---

## 21. 高リスク操作の再認証

以下の操作では、プロファイルがロック解除済みでも再認証を要求する。

- ニーモニック表示
- 秘密鍵表示
- 秘密鍵エクスポート
- 完全バックアップ作成
- プロファイルパスワード変更
- 生体認証の登録
- 生体認証の解除
- プロファイル削除

認証にはプロファイルパスワードを使用する。

生体認証が有効な場合は、生体認証による代替も検討する。

---

## 22. 生体認証

将来的に、生体認証によるプロファイル解除および署名認証を提供する。

生体情報そのものはアプリで保存しない。

OSが提供する安全な領域を利用する。

例:

- iOS Keychain / Secure Enclave
- Android Keystore
- WebAuthn対応環境の端末認証

生体認証成功後に、端末の安全領域からプロファイル解除用の情報を取得する。

プロファイルパスワード変更後は、生体認証用の解除情報も更新する。

更新に失敗した場合は、生体認証を無効化する。

---

## 23. パスキー

パスキー対応は将来機能として検討する。

パスキーは通常、公開鍵認証用の資格情報であり、そのままローカル秘密鍵の暗号化パスワードとしては使用しない。

パスキーを利用する場合は、以下の方式を別途検討する。

- WebAuthn PRF拡張を利用したローカル鍵導出
- パスキー認証後に安全な解除鍵を取得する方式
- OSの端末保護鍵と組み合わせる方式

サーバー依存を避けるため、初期実装ではプロファイルパスワードを必須とし、生体認証を補助認証として扱う。

---

## 24. 設定画面

プロファイル設定画面には、少なくとも以下を配置する。

- プロファイル名
- Profile の `chain`
- Profile のデフォルトアカウント
- 自動ロック時間
- 署名時再認証ルール（表示のみ、署名ごとに固定）
- パスワード変更
- ニーモニック表示
- 完全バックアップ作成
- 完全バックアップ復元
- 生体認証設定
- プロファイル削除

ネットワークは表示のみとし、変更操作は提供しない。

---

## 25. アカウント管理画面

アカウント管理は、プロファイル設定とは分離する。

提供する操作:

- HDアカウント追加
- 除外済みHDアカウント一覧
- 除外済みHDアカウントの復活
- 秘密鍵インポート
- アカウント名変更
- デフォルトアカウントに設定
- 秘密鍵表示
- 秘密鍵エクスポート
- HDアカウントセットの除外
- インポートアカウントの削除

HDアカウントの除外はセット単位で実行する。

---

## 26. 実装上の不変条件

以下の条件を常に満たすこと。

```text
1. プロファイルは必ずニーモニックを持つ
2. プロファイルは必ず一つの `chain` を持つ
3. プロファイルの `chain` は作成後に変更できない
4. プロファイルには最低1つのアクティブなHDアカウントセットがある
5. 各HDアカウントセットには Profile の `chain` に対応するHDアカウントが一つある
6. HDアカウントはセット単位で追加・除外・復活する
7. 新規HDアカウントでは過去に使用済みのインデックスを再利用しない
8. 除外済みHDアカウントの秘密鍵は保持しない
9. ネットワークはプロファイル作成後に変更できない
10. 同一プロファイルの重複復元はエラーにする
11. パスワード変更は全秘密情報の再暗号化として実行する
```

これらの不変条件は、UIだけではなくドメイン層および永続化層でも検証すること。

## 27. 未決事項

本仕様の Profile 全体 backup / restore は、将来の個別 platform / release で capability を提供する場合の canonical owner を本仕様とする。Browser Extension 初回 milestone / release、MVP 完了条件および現時点の実装必須事項には含めない。Product Specification は本節を参照し、backup contract を override しない。

### OPEN-PROFILE-001: Future Profile backup contract

- **Owner:** Profile / Account Specification。将来 backup capability を提供する platform / release は、本 OPEN が close され、適用される Profile / Account contract が定められた後に限り、この owner を参照する。
- **Decision point:** 最初の backup export / import capability をいずれかの platform / release で提供する前。format、crypto、restore および deletion policy を本仕様に記録し、Product / platform 側の記述はその決定を参照する。
- **Unresolved contract:** backup の対象 data と secret content boundary、export / import lifecycle、format / envelope、crypto algorithm、KDF、AEAD、salt / nonce policy、format / crypto version、migration compatibility、restore integrity / schema / Account identity / key consistency verification、restore commit condition、backup verification state / metadata の意味。
- **Profile deletion policy:** backup verification state と Profile deletion の関係、Mainnet-specific deletion policy、未検証または未作成 backup の場合に deletion を拒否・許可する条件は未決とする。現時点で必ず拒否または必ず許可のいずれも決定しない。
- **Existing boundary:** Profile password を完全 backup の暗号化 / 復号に使用する既存契約、plaintext Mnemonic / private key を backup file に出力しないこと、invalid / corrupted / incompatible backup を安全側に拒否すること、検証前に current Profile state を変更しないこと、backup 作成だけを restore verification 成功と扱わないこと、および password 忘失を管理者 reset / secret reissue で迂回しないことは維持する。
- **Not decided by this OPEN:** AES-256-GCM、Argon2id、その他の crypto library / algorithm、具体的な backup file serialization、storage backend、cloud provider、UI flow または Profile deletion gate の採用を、この OPEN の追加自体から推測してはならない。

## 28. Traceability

本表は Profile / Account の外部契約を、承認済み Requirements、Design、関連 Specification および canonical owner / OPEN へ追跡するための表である。本書は Profile metadata と Profile 全体 backup contract の owner であり、Wallet Store の内部形式、Chain-specific signing bytes、共通 handoff envelope または release policy を再定義しない。

| Requirement / acceptance                                                 | Design                                                                             | 本仕様             | Canonical owner / OPEN                                                                                                                                                                  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CR-017`、`CR-AC-020`                                                    | Architecture の Profile / Account 境界、Security Design の Profile isolation       | §2〜§12、§24、§26  | 一つの Profile は一つの Network と一つの Chain に固定する。Symbol と NEM の併用は別 Profile とし、既存 mixed Profile / backup の移行・互換は現行開発範囲に含めない                      |
| `CR-005`、`CR-009`、`CR-AC-003`、`CR-AC-010`                             | Architecture §6.6〜§6.8、Interfaces Design §6、Security Design §6、§9              | §1〜§12、§25、§26  | Profile Network と Application Account association は本書。Chain identity / address は Chain Compatibility Specification、Wallet Store は wallet-core                                   |
| `CR-008`、`CR-013`、`CR-NFR-002`、`CR-NFR-004`、`CR-AC-007`、`CR-AC-010` | Architecture §6.8、Security Design §6、§13、Mobile Design §11、§19                 | §10、§13、§20、§26 | secret processing、Wallet Store、raw signing は wallet-core。Profile password と Application lifecycle は本書                                                                           |
| `CR-003`、`CR-016`、`CR-AC-017`                                          | Signing Flow §4、§5、§16、Security Design §7〜§9、Browser / Mobile Design §10〜§12 | §20〜§23、§26      | Authentication、unlock、Account authorization、approval の共通 gate は Signing Protocol / Interfaces。Profile-local authentication context は本書と platform Specification              |
| `CR-NFR-003`、`CR-NFR-010`、`CR-NFR-011`、`CR-AC-013`、`CR-AC-014`       | Signing Flow §7、§20〜§23、Security Design §10、§15                                | §8、§9、§19、§26   | Profile revision、lock、index non-reuse は本書。request / session expiry、replay、delivery は Interfaces / Handoff / Relay                                                              |
| `CR-014`、`MR-009`、`MR-010`、`MR-AC-008`、`MR-AC-011`                   | Architecture §6.6、Security Design §6、Mobile Design §11、§19、§27                 | §15〜§18、§26、§27 | Profile-wide backup / restore contract は本書 `OPEN-PROFILE-001`。Product / Mobile は capability と safety boundary を参照し、format / crypto / restore policy を独自に override しない |
| `CR-NFR-006`、`CR-AC-008`、`MR-013`、`MR-AC-009`                         | Architecture §3、§16、Security Design §16、Mobile Design §23〜§24                  | §1〜§3、§24、§27   | Mainnet release / evidence gate は ADR 0001、`evidence-policy.json`、Mainnet release evidence。Profile backup 未決事項を current gate の具体条件として本書から固定しない                |

### 28.1 下流参照と OPEN mirror

- Product Specification は本書の `OPEN-PROFILE-001` を backup contract の canonical owner として参照する。
- Mobile Specification は `MR-OPEN-006` と `MOB-OPEN-006` を本書の backup / migration contract へ戻し、未承認の OS wrapping、hardware capability、restore verification を current Mainnet gate として固定しない。
- Interfaces、Handoff、SDK および Chain Compatibility Specification は Profile ID、Wallet Store ID、key slot、internal Account reference または backup envelope の意味を推測せず、本書と wallet-core の owner 境界を維持する。
