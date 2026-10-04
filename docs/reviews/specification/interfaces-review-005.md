# MosaicLynx Interfaces Specification 再レビュー 005

## 1. Review Target

- 確認日: 2026-10-04。
- 主対象: [interfaces.md](../../specifications/interfaces.md)。
- Reviewed MosaicLynx HEAD: `ef1393f61f65ecddfe9fa39f475817856d977326`。作業開始時の working tree は clean。
- 成果物: `docs/reviews/specification/interfaces-review-005.md`。
- 出力先はユーザー指定の単数形 `specification/` を使用する。既存の複数形 `specifications/` に 001〜004 が存在するため、同一対象の履歴として連番 005 を採用した。既存記録は移動・更新しない。
- Scope: 共通 envelope、Account / Network、transaction / cosignature / message、承認、取消、error / unknown、replay、Extension / Mobile / Relay、完成済み wallet-core の正式 API への統合可能性。
- 制約: レビューのみ。仕様、production code、wallet-core、既存 finding の記録は変更しない。Mobile は仕様上の対象であり実装済み workspace とみなさない。
- 未確認範囲: runtime 動作、公開 npm tarball と commit の同一性、store release、実端末、秘密情報の実際の memory lifetime。

## 2. Execution Audit

サブエージェントは使用せず、Chair が観点別に自己レビューした。

| パス                           | 確認内容                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| A: 契約                        | required / optional、operation、wire union、binary、canonical bytes、DTO、sync contract、error mapping                                     |
| B: 運用                        | approval / rejection、locked、timeout / cancel、既知結果の recovery、公開 capability、既存 OPEN と実装開始条件                             |
| C: Security / Interoperability | trust boundary、secret flow、request / account / network / payload binding、TOCTOU、replay、JS 境界、未知 type、opaque Relay、backend 差異 |
| Chair                          | 既存 ID の引継ぎ、関連文書による反証、重複統合、ユーザー指定 Severity / Gate の適用                                                        |

Skill の一般 Gate より、今回の明示された Severity と「実装開始を妨げる Major は理由付きで差戻し可能」を優先する。内部 parser、UI toolkit、storage engine、zeroization の方式は固定しない。

## 3. Evidence Used

### Reviewed wallet-core state

- 正式比較対象は [nemnesia/symbol-nem-wallet-core の main commit](https://github.com/nemnesia/symbol-nem-wallet-core/commit/4c4407e9255857b6d28748e33a2d6ec290776f43): `4c4407e9255857b6d28748e33a2d6ec290776f43`。
- GitHub `branches/main` の read-only API で SHA を取得し、外部ローカル checkout の HEAD と MosaicLynx `_snwc` submodule の SHA が同じことを確認した。外部 checkout は clean。
- [package manifest](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/packages/wallet-core/package.json) の version は `0.2.0`。これは main の manifest version であり、公開済み release artifact の検証結果ではない。
- wallet-core は依頼どおり完成済みとして扱い、修正要求・品質再レビューの対象にしない。

| 根拠                                                                                                                                                                                                                            | 確認用途                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [interfaces-review-001](../specifications/interfaces-review-001.md) / [002](../specifications/interfaces-review-002.md) / [003](../specifications/interfaces-review-003.md) / [004](../specifications/interfaces-review-004.md) | `IS-001`、`SR-001`〜`SR-005` の内容・最新状態・解決条件                                   |
| [Interfaces Design Review 006](../design/interfaces-review-006.md)                                                                                                                                                              | Design 判定 `READY`、`DR-001`〜`DR-007`、`IF-001`〜`IF-003` の解決状態                    |
| [共通要件](../../requirements/requirements.md) CR-007-MSG、CR-008、CR-013、CR-016、CR-NFR-004                                                                                                                                   | secret isolation、wallet-core ownership、承認、失敗の安全側処理                           |
| [Interfaces Design](../../design/interfaces.md) §3 / §6〜§9                                                                                                                                                                     | application identity と core identity、cancel / recipient の設計上の責任                  |
| [Chain Compatibility](../../specifications/chain-compatibility-spec.md) §2〜§7                                                                                                                                                  | allowlist、全 field、生成 hash、署名 bytes、cosignature、固定 vector の契約               |
| [Profile / Account](../../specifications/profile-account-spec.md) §1〜§3 / §20                                                                                                                                                  | Application Profile の単一 Chain、Network 固定、署名認証                                  |
| [Signing Protocol](../../specifications/signing-protocol.md) §6 / §9〜§13 / §19                                                                                                                                                 | 検証・表示・署名対象、cancel race、unknown / recovery                                     |
| [Handoff](../../specifications/web-transaction-handoff-spec.md) §5〜§13                                                                                                                                                         | SDK result、Relay request / response、AAD、body bounds、error、timeout                    |
| [SDK](../../specifications/sdk.md) §5 / OPEN-SDK-004                                                                                                                                                                            | cosignature result の既存公開形・未決範囲                                                 |
| [Browser Extension](../../specifications/browser-extension.md) §10〜§19                                                                                                                                                         | browser-observed caller、privileged host、secret・lifecycle boundary                      |
| [Mobile App](../../specifications/mobile-app.md) §6〜§19                                                                                                                                                                        | untrusted invocation、verified App Link、cold-start locked、process loss、secret handling |
| [ADR 0001](../../adr/0001-mainnet-evidence-lite.md)、[release evidence](../../release/mainnet-release-evidence.md)                                                                                                              | Mainnet gate の owner。公開準備の実証レビューは対象外                                     |
| [core index.d.ts](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/packages/wallet-core/src/index.d.ts)                                                                         | 16 API、全公開 DTO / binary / error 型                                                    |
| [core specification](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/docs/specifications/specification.md) §8〜§10                                                             | approval assertion、operation password、raw payload、1 MiB bounds、backend parity         |
| [npm facade specification](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/docs/specifications/npm-typescript-facade.md) §3〜§10 / §14                                         | exact DTO、snapshot、sync / initialization、error、fallback                               |
| [React Native specification](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/docs/specifications/react-native.md) §2〜§8                                                       | 同期 API、JSI provider、lifecycle、RN fallback 禁止                                       |
| [core sign implementation](https://github.com/nemnesia/symbol-nem-wallet-core/blob/4c4407e9255857b6d28748e33a2d6ec290776f43/crates/core/src/store.rs#L739)                                                                      | raw payload を変更せず署名し Store を更新しないことの補助照合                             |

`git ls-remote` は sandbox の DNS 解決失敗で取得できなかったため、GitHub connector の read-only API を使用した。ネットワーク制約を対象仕様の欠陥には計上しない。

## 4. Review Result — Verdict

**REVISE SPECIFICATION**

今回の有効 finding は **Critical 1 / Major 5 / Minor 0**。状態は **New 5 / Reopened 1 / Resolved 5**（Specification finding のみ。Design の解決済み件数は加算しない）。

## 5. Summary

interfaces.md は request ID、Scope、permission、target-derived summary、四条件、署名前再検証、opaque Relay、未知 type の拒否、自動再署名禁止を明示している。これらを欠落と判定しない。hash-only cosigning も明示的に禁止されている。

ただし、署名 primitive の正式 owner と、参照先 Chain Compatibility §6 が要求する秘密鍵付き symbol-sdk Account が競合する。また正式 wallet-core DTO への接続、cosignature の response、message の canonical expiry、JS 入力の境界契約が固定されていない。Handoff §11 は timeout / App close を未署名と断定し、解決済み unknown model を再び縮退させる。

最重要 finding は `SR-006`。wallet-core に transaction / cosignature / message 専用の署名 API や unlock session API は存在しない。MosaicLynx の公開 operation をそのまま wallet-core API とみなすことはできない。

## 6. Finding Status — Existing findings status

ID は Interfaces Specification の履歴を単位に管理する。他対象レビューの同番号とは別である。

| ID     | Severity                            | Status   | 今回の確認・解決内容                                                                                       |
| ------ | ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| IS-001 | Major（前回の再評価を維持）         | Resolved | §6.3 / §10.2 は Handoff §10 を公開 error owner とし、独自 INVALID_MESSAGE / NONCE_REUSED を追加しない      |
| SR-001 | Critical（履歴上）                  | Resolved | §9.7 / §12 / §15 は独立四条件、同一 context、非代替性、直前再確認を規定                                    |
| SR-002 | Critical（履歴上）                  | Resolved | §8.4〜§8.5 は Profile-local invalidation、concurrent isolation、recipient 再割当て禁止を規定               |
| SR-003 | Major（今回のユーザー基準へ再評価） | Reopened | 共通 union 自体は修正済みだが Handoff §11 が close / timeout を未署名と断定する。§7 の再オープン記録参照   |
| SR-004 | Critical（履歴上）                  | Resolved | §13.1 は unknown / security / transport failure 後の自動 re-sign / route fallback を禁止し新規四条件を要求 |
| SR-005 | Critical（履歴上）                  | Resolved | §7.4 は current release / evidence gate、unknown 時 disabled、Testnet 分離を規定                           |
| SR-006 | Critical                            | New      | 署名処理委譲と秘密鍵付き SDK signing の競合                                                                |
| SR-007 | Major                               | New      | 完成 core の正式 DTO・呼出し・result / error への接続が未固定                                              |
| SR-008 | Major                               | New      | cosignature request に対応する安全な公開 response contract が未固定                                        |
| SR-009 | Major                               | New      | message expiry と binary displayability の契約が未確定                                                     |
| SR-010 | Major                               | New      | JS 境界の stable input と resource bounds が未固定                                                         |

Design Review 006 の `DR-001`〜`DR-007` と `IF-001`〜`IF-003` はその文書での Resolved を維持する。cancel / participant の設計済み問題を新規 finding として二重登録しない。今回 `SR-003` を引き継ぐため timeout を新しい ID で登録しない。

## 7. Required Changes — New findings / Reopened findings

今回は実装開始を妨げる Major も本章に含める。ユーザー指定 Gate による扱いであり、Major を Critical に変更してはいない。

### SR-006 — 正式 wallet-core 委譲と秘密鍵付き SDK signing の規範が競合する

- Severity: Critical
- Status: New
- Affected: interfaces.md §2.2 / §9.2〜§9.6 / §16、chain-compatibility-spec.md §6.1〜§6.3。
- Description: interfaces は signing primitive と secret processing を wallet-core に委譲する一方、署名 bytes の参照先 Chain Compatibility §6 は symbol-sdk Facade / Account を唯一の生成実装とし、`createAccount(privateKey)`、Account `signTransaction` / `cosignTransaction`、`keyPair.sign` を本番経路に指定する。同 §2 / §9 の wallet-core ownership とも競合する。正式 core の公開署名 API は raw `sign` のみで、秘密鍵付き Account を返す API はない。`export_private_key` は別の明示的 export 操作であり通常 signing の鍵取得 API ではない。
- Risk: 実装者が旧 §6 を満たすため signing ごとに private key を export・保持し、SDK 側で raw signing を行う合理的解釈が成立する。不要な secret exposure と cryptographic responsibility の二重化を招き、今回の信頼境界を破る。
- Required change: 同一フェーズの参照契約を正式 core の raw signing 委譲へ統一する。解析、公開 hash、検証、signed payload 組立てと秘密鍵を使う署名 primitive を区別し、通常 signing に秘密鍵 export を必要としない契約を固定する。core 自体を変更しない。
- Acceptance criteria: transaction / cosignature / message の全経路が承認済み exact bytes を core `sign` に渡し、MosaicLynx、chain adapter、SDK が秘密鍵を取得・導出・使用せず同じ期待 signature と公開 result を作れる。秘密鍵付き SDK Account は production signing の前提に存在しない。

### SR-007 — 完成 core の正式 DTO・同期 API・error への統合契約が固定されていない

- Severity: Major
- Status: New
- Affected: interfaces.md §5.3 / §9.6〜§9.7 / §10 / §11 / §16、Profile / Chain / Browser / Mobile の wallet-core 参照境界。
- Description: 論理責任は規定されるが、正式 package / state、`sign(store, request, password_utf8)`、`SigningRequest.target { profile_id, key_id, context }`、`payload: Uint8Array`、`approval.status`、`SignatureResult.value.signature` の接続先が規範的に固定されていない。core は raw 64-byte signature と warnings だけを返し、SignedTransaction、hash、signerPublicKey、request ID、delivery disposition を返さない。core の同期 throw、初期化 error、operation error の正確な mapping もない。Application Profile は単一 Chain、core Profile は Network 固定・key ごと Chain 固定であり、両 ID を同一の意味と仮定できない。
- Risk: hex wire payload を raw signing bytes と誤認する、numeric enum と DTO の string enum を混同する、未認証 list index を identity authority とする、存在しない unlock / transaction API を想定する、BindingFailure を未実行確定と誤認するなどの実装差が生じる。正式 core の利用だけでは共通 interface を実装できない。
- Required change: owner を定めた規範的 integration contract を固定し、外部 wire と core DTO の明示 mapping、internal Account → Profile / key 解決、operation-specific exact bytes、result 組立て・独立検証、warning policy、secret input / output allowance、同期 call と初期化、error の安全な分類を定める。unlock は Signer-local gate として扱い、core に未公開 API を要求しない。
- Acceptance criteria: 三 backend で同じ DTO / result 契約を適用できる。`AuthenticationFailed`、`ProfileNotFound`、`SoftwareKeyNotFound`、`NetworkMismatch`、`BindingFailure`、初期化失敗、未知 error と result conversion failure の公開 category / terminal / unknown の扱いが判定できる。例外だけで未署名を推測しない。通常 signing で Mnemonic / private key export を呼ばず、password や opaque Store を page / SDK / Relay に返さない。

### SR-008 — cosignature の公開 response と不確定結果が定義済み request に対応しない

- Severity: Major
- Status: New
- Affected: interfaces.md §6.2〜§6.3 / §9.3 / §9.6 / OPEN-006、sdk.md §5 / OPEN-SDK-004、Handoff §5 / §7。
- Description: `cosignTransaction`、Symbol の `detached`、NEM の `payload / parentPayload` は request union にあるが、canonical RelayResponse は `signedTransaction` と `signedData` しか定義しない。cosignature exact field を下位へ委譲する §9.6 に対し SDK / Handoff は既存 `Promise<MosaicLynxCosignature>` と OPEN を維持し、unknown / delivery union の適用を未決としている。core は cosignature DTO を返さず raw signature のみを返す。
- Risk: detached cosignature を SignedTransaction へ詰める、別 field を発明する、不確定結果を通常 exception にするなど互換性と安全性が分岐する。request / parent hash / cosigner / network と result を独立検証する契約が成立しない。
- Required change: 対象 release で提供する chain / mode を確定し、その公開結果、signature / parent hash / cosigner の表現、request correlation、unknown / delivery disposition を規定する。今回公開しないなら capability・受付を disabled / unsupported とすることを明示し、成功 response を発明しない。
- Acceptance criteria: full parent の解析・表示、Signer による親 hash 再計算、existing signature / cosignature 検証、cosigner / network 一致に加え、attached / detached / NEM の許可結果と禁止結果が一意である。hash-only 外部要求は拒否し、不確定時に再署名しない。

### SR-009 — message の canonical expiry と確認可能な binary format が未確定

- Severity: Major
- Status: New
- Affected: interfaces.md §9.4 / OPEN-001、Handoff の RelayDataSigningRequest、Product structured message contract。
- Description: signing bytes は prefix + JCS(StructuredMessage) と定まるが、StructuredMessage の `expiresAt` と Relay request の `messageExpiresAt` の変換 owner / mapping は明示的 OPEN であり、暗黙 alias も禁止されている。`encoding: 'hex'` は許可される一方、「raw bytes の羅列だけでは承認不可」に対し、確認可能な binary format の範囲と undecodable input の具体的受付条件がない。
- Risk: 別実装が異なる JCS object を署名・検証する、request expiry と message expiry を取り違える、hex 表示を意味確認と誤認する。domain / origin prefix があっても blind signing 防止の成立は証明できない。
- Required change: message signing の対象 release を決め、canonical object / expiry mapping の owner を確定する。human-readable / binary の対応 format と表示可能性の受入条件を固定し、意味を確認できない arbitrary bytes は unsupported にする。安全な契約を閉じない場合は MVP の MESSAGE_SIGN を disabled とする判断を上流で承認する。
- Acceptance criteria: SDK / Extension / Mobile / independent verifier が同じ canonical message と signing bytes を得る。observed / proven requester origin と署名 origin が一致する。UTF-8、NFC 不正、unsupported encoding、解釈不能 hex、expiry mismatch、nonce replay が署名前に拒否される。UI layout の固定は不要。

### SR-010 — untrusted JS DTO の安定した値と検証前 resource bounds が未固定

- Severity: Major
- Status: New
- Affected: interfaces.md §6.4 / §11 / §12、Browser page → Provider / host boundary、Mobile 復号後 boundary。
- Description: JSON 型検証、unknown field 拒否、transaction 256 KiB、message 16 KiB、chain collection limit はある。しかし SDK が受ける JS object の inherited field / accessor / getter / Proxy と、承認・署名の間で同じ値を維持する境界契約はない。Relay 側 Handoff §13 は prototype pollution / 過剰 depth を拒否するとするが exact bound がなく、Browser も含めた envelope / string / nesting の検証前上限・拒否条件が一意でない。core facade は own data property snapshot を規定するが、その時点は承認後であり上流の表示・承認の同一性を保証しない。Proxy trap の副作用・原子的 snapshot は保証対象外である。
- Risk: getter が表示用と署名用に異なる値を返す入力や、oversized / deeply nested object が、実装ごとに異なる validation・JCS・inspection を誘発する。core の安全な変換だけでは Signer の TOCTOU と resource exhaustion を防げない。
- Required change: 外部 JS / JSON → Signer-owned validated value の許可・拒否条件と、同じ target / summary / core-call bytes の binding を契約化する。getter / inherited / unreadable input を authority としないこと、malformed / dangerous keys の扱い、pre-parse / pre-copy の必要な resource limits を owner 付きで固定する。具体的 parser や clone library は指定しない。
- Acceptance criteria: inherited required field、accessor による置換、descriptor trap failure、dangerous key、過剰 string / bytes / depth / elements を入力した時の rejection と wallet-core 未呼出しを独立判定できる。Proxy を無副作用で検出できるという不可能な保証は置かず、untrusted realm の object を直接 approval authority にしない。

### SR-003 — Handoff の timeout / App close が未署名確定へ縮退する

- Severity: Major
- Status: Reopened
- Affected: interfaces.md §10.3 / §13.1 と参照する Handoff §11、Signing Protocol §19.2。
- Description: review-004 で解決した common outcome / delivery union は維持されている。しかし Handoff §11 の「拒否、App close、timeout は署名されていない状態として完了する」は、SIGNING 中の timeout / close と signed-result 配送前の close を未署名と断定する。Signing Protocol は signing generation が確定しない時だけ RESULT_UNKNOWN、生成済みなら既知 result を保持すると規定し、共通 contract と異なる結果を要求する。
- Risk: 呼出し元が timeout を未署名の証明として扱い、新たな要求・announce を重ねる。不確定な署名生成と既知結果の配送不明を区別できない。自動 retry 禁止だけでは誤った確定情報を訂正できない。
- Required change: 同 ID の既存 non-collapse 条件を Handoff §11 にも適用し、rejection、pre-sign cancel、in-flight unknown、known result / delivery、transport timeout を区別する。SDK / Relay が RESULT_UNKNOWN / DELIVERY_UNKNOWN を合成しない条件を維持する。
- Acceptance criteria: 承認前 timeout、sign 呼出し中 process loss、署名成功後 response loss、SDK timeout、SUCCEEDED 後 cancel に対して未署名を推測しない。既知 result は再生成せず、Signer-only unknown と transport failure を維持する。旧 Severity は Critical だったが今回はユーザーの error / unknown state 基準で Major とし、状態解釈が実装を妨げるため Gate blocker とする。

## 8. Optional Improvements

独立した Minor finding はなし。対応 operation を無制限に増やすこと、opaque transport に検査を追加すること、core に request ID / expiry / origin / approval UI を追加することは要求しない。

## 9. Resolved Findings

`IS-001`、`SR-001`、`SR-002`、`SR-004`、`SR-005` は §6 の根拠により Resolved を維持する。履歴上の Critical を有効 finding の件数には含めない。

`SR-003` の共通仕様側での解決内容も失われていない。再オープン理由は関連 normative Handoff の未署名断定であり、同じ unknown state 問題として引き継いだ。

## 10. Upstream Feedback

外部への送信は行っていない。以下はレビュー内の非規範的記録であり、新たな設計判断ではない。

- 送信元フェーズ: Specification Review。
- 受領すべき上流フェーズ: Design、message / cosignature の release scope を変える場合のみ Requirements の該当 owner。
- 対象: Interfaces / Security / platform Design の wallet-core integration、SDK / Mobile の公開 operation scope。
- 不足・曖昧さ・矛盾: `SR-007` の Application Profile / Account と core Profile / Software Key の mapping owner、正式 facade の採用境界。`SR-008` / `SR-009` の公開 scope に関する既存 OPEN。
- 下流への影響: 仕様作者が secret flow、別 API、公開 union、release scope を独自決定しなければ実装できない。
- non-normative status: 検討依頼。今回 Profile model や公開機能を変更したことにはならない。
- 解消条件: owner と対象 release を正式資料で確認し、その判断から必要な integration / operation contract を具体化する。core の内部実装を変更しない。

## 11. Deferred Findings

- Design `DR-006` / `DR-007` は cancel authority / acknowledgement / race と recipient / participant / direction を解決済み。実装ではその設計と Signing Protocol §19.2、Relay capability-token cancel、AAD direction / generation / session を追跡する。新規 ID を付けない。
- Browser privileged host と renderer / content script の実際の権限、Chrome sender metadata の実装、getter / Proxy 防御、secret cleanup の成立は Implementation Review が検証する。`SR-010` はその前提となる contract の不足のみ。
- `_snwc` の同 commit が npm `0.2.0` artifact、WASM / Native / RN 配布物に一致することは release validation に引き継ぐ。manifest version だけで配布証跡を代替しない。
- permission expiry、version / capability negotiation、非標準 Mobile caller の OPEN は今回閉じない。非対応経路は既存 fail-closed と verified App Link の範囲に限定する。

## 12. Scope and Traceability — Wallet-core compatibility assessment

### 公開 API と DTO の実態

正式 npm facade の runtime API は次の16関数である。

```text
create_empty_store          prepare_generated_profile
finalize_generated_profile  restore_profile
list_profiles               export_mnemonic
export_private_key          list_software_keys
derive_software_key         import_software_key
generate_software_key       get_public_account
sign                        change_profile_password
delete_software_key         delete_profile
```

`Network` / `Chain` 定数も公開される。runtime class、backend selector、`unlock`、`lock`、`verify_password`、`signTransaction`、`cosignTransaction`、`signMessage`、`getPrivateKey` は公開 API にない。MosaicLynx の operation 名は orchestration であり、存在しない core 関数の呼出しへ直結させない。

| 比較項目           | 正式 core contract                                                                                                                            | MosaicLynx 評価                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| binary             | Store / pending / password / mnemonic / private key / payload / signature は Uint8Array。key 32、signature 64 bytes                           | wire hex / base64url とは別。接続が未固定: SR-007                                                                 |
| enum               | 引数の Network.TESTNET=0 / MAINNET=1、Chain.NEM=0 / SYMBOL=1。DTO context は string names                                                     | Scope の string は整合可能。numeric Chain network-byte との混同禁止                                               |
| identity           | profile_id / key_id は UUID。Profile Network 固定、Software Key Chain 固定                                                                    | Application 単一 Chain Profile との mapping が必要。core Profile と同一概念ではない                               |
| public account     | get_public_account は password を受け authenticated public_key / address / key_id / context を返す                                            | key_id は内部限定。list の平文 index を authenticated identity の代用にしない                                     |
| signing input      | target + raw payload + approval.status、別引数 password、opaque Store                                                                         | request ID / operation / origin / expiry / replay / UI は Signer authority。core にない field を要求しない        |
| signing output     | ReadResult<Signature>、value.signature + warnings、Store 不変                                                                                 | payload / hash / signer / correlation / disposition は Signer が構成・検証する: SR-007                            |
| transaction        | raw primitive のみ。prefix / generation hash / transaction 解釈を追加しない                                                                   | 検証済み transaction から exact signing bytes が必要。旧 SDK secret signing は SR-006                             |
| cosignature        | 専用 API なし                                                                                                                                 | full parent を解析・確認して導出した署名 bytes は委譲可能。外部 hash-only 許可とは別。response は SR-008          |
| message            | 専用 API なし。渡された bytes を署名                                                                                                          | prefix + canonical bytes は Signer 側。expiry / displayability は SR-009                                          |
| mnemonic / key     | prepare の intended-user handoff と explicit export のみ secret-bearing result。export は target 一致、requested / confirmed、password が必要 | signing のために export しない。通常 key generation / derive は private key を返さない                            |
| unlock / password  | persistent unlocked session / password cache なし。protected operation ごと password                                                          | 四条件は Signer-local。password を page、cache、approval record、diagnostics に持たせない                         |
| Store              | opaque blob。mutation は完全 replacement Store、永続化は Application、失敗時旧確定 Store 維持                                                 | MosaicLynx は保管・atomic replacement を担える。Store 暗号・decode / key derivation を再実装しない                |
| bounds             | raw signing payload 1 MiB、Wallet Store 16 MiB、内部 bounded decode                                                                           | MosaicLynx transaction 256 KiB / message 16 KiB はより厳しく整合する。core bound は上流 JSON bound の代替ではない |
| approval invariant | approved は現在の target / payload の Application assertion。core は UI / freshness を独立証明しない                                          | 四条件と replay / TOCTOU 防御の最終 authority は Signer。core の成功を承認証明にしない                            |

### Error / backend assessment

Core は18の stable code を `WalletCoreError` として throw し、`name` / `code` / `message` は固定 contract。runtime `WalletCoreError` class export はない。`instanceof` の専用クラスを前提にしない。別 namespace の `WalletCoreBackendInitializationError` は code を持たず、固定 message `backend initialization failed` を返す。

`InvalidArgument` / `InvalidStore` / unsupported schema / `ProfileNotFound` / `SoftwareKeyNotFound` / `AuthenticationFailed` / `NetworkMismatch` / `CryptoFailure` / `BindingFailure` 等を Signer の公開 error と結果確定性へ写像する必要がある。Core は FAILED / RESULT_UNKNOWN / DELIVERY_UNKNOWN、locked、caller permission を判断しない。秘密・stack・raw backend detail・warnings を page-facing error にそのまま転送しない。正確な mapping は `SR-007`。

| backend       | 正式 contract                                                                                                                     | integration assessment                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Native / Node | node-addons 条件、同期関数。valid manifest に native target がない場合だけ package-local WASM へ初期選択可能                      | native load / operation failure 後に retry しない。Signer を切り替える fallback とは別                                             |
| Browser WASM  | module initialization は非同期になり得る。evaluation 後の16 API は同期                                                            | module import failure と sign operation failure を区別。Promise sign API を前提にしない                                            |
| React Native  | react-native 条件、New Architecture TurboModule / JSI provider、同じ同期 DTO / error。runtime / registry / lifecycle invalidation | npm install だけでは成立しない。provider / lifecycle failure 時 WASM / Node fallback 禁止。Mobile workspace が存在する証拠ではない |

backend の共通仕様は存在するため core 自体の非互換を指摘していない。MosaicLynx が利用する境界の採用・mapping が未固定である。

### 責務境界

| 主体              | 許可された責務                                                                                    | 禁止・非authority                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| dApp / SDK        | request / ID 作成、配送、response 受信、公開結果検証                                              | approval 代行、秘密鍵受領、raw signing、unknown 確定                   |
| MosaicLynx Signer | 構造・意味検証、account / network check、summary、explicit approval / reject、core 委譲、response | 未解析 payload、untrusted summary、page 自己申告 origin を信用して署名 |
| wallet-core       | secret management、Store 暗号・検証・変更、鍵導出、raw primitive                                  | transaction 解釈・UI、Origin / requester / replay policy、transport    |
| Relay             | untrusted opaque transport、最小 structural lifecycle、temporary encrypted envelope               | plaintext 解釈・改変、approval / signing decision、secret handling     |

## 13. Domain Checks — Required checklist

Pass は仕様契約の評価であり runtime PASS を意味しない。

| 必須項目                       | 評価                | 根拠 / follow-up                                                                                                         |
| ------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Wallet-core API Compatibility  | Fail                | SR-006 / SR-007。正式 API は確認済み、MosaicLynx 接続が未固定                                                            |
| Public Operation Coverage      | Fail                | operation は区別されるが cosign result と message canonical contract が未確定: SR-008 / SR-009                           |
| Request / Response Correlation | Pass with follow-up | requestId、digest、operation / Scope / target binding は明示。cosignature の完成は SR-008                                |
| Signing Request Contract       | Pass with follow-up | required ID / operation / Scope / expiry、選択 signer、summary 非authority、malformed 拒否。JS 境界は SR-010             |
| Signing Response Contract      | Fail                | known / unknown union 自体は成立。cosignature branch と raw core result mapping が未成立                                 |
| Transaction Signing Contract   | Fail                | bytes / fields / allowlist は明示されるが SR-006 の secret signing と core 委譲が競合                                    |
| Cosignature Signing Contract   | Fail                | full parent 必須・hash-only 禁止は Pass。response / mode / unknown の public scope は SR-008                             |
| Message Signing Contract       | Fail                | domain / origin / nonce / canonical prefix はある。expiry OPEN と binary displayability は SR-009                        |
| Account / Network Binding      | Pass with follow-up | Profile / permission / payload / selected key の照合は明示。core ID / enum mapping は SR-007                             |
| Semantic Inspection Contract   | Pass with follow-up | summary は target-derived、未解析拒否。message format は SR-009                                                          |
| Error / Unknown State Contract | Fail                | common 二軸モデルは正しいが SR-003 の Handoff 未署名断定と SR-007 の core error mapping が残る                           |
| Replay / Duplicate Protection  | Pass with follow-up | ID conflict、duplicate 追加署名禁止、message nonce reserve、expiry、terminal reopen 禁止。永続化・restart の実証は未検証 |
| Relay Trust Boundary           | Pass                | opaque AEAD、別方向鍵 / AAD、approval / semantic / unknown の非authority                                                 |
| Browser Extension Boundary     | Pass with follow-up | observed top-level Origin、privileged host、renderer 非authority、四条件。JS 契約 SR-010 / WASM mapping SR-007           |
| Mobile Signer Boundary         | Pass with follow-up | verified HTTPS App Link、非標準経路拒否、初期 LOCKED、cold restart invalidation。RN provider / facade mapping SR-007     |
| Secret Handling Boundary       | Fail                | 公開 DTO / error / diagnostics の secret 禁止は適合。SR-006 が通常 signing で秘密鍵利用を要求                            |
| Fail-Closed Behavior           | Pass with follow-up | unknown operation / type / encoding / version、gate unknown は拒否。SR-003 / SR-007 / SR-010 の具体化が必要              |

### Transaction / security checks の補足

- Transfer、Aggregate embedded、NEM wrapper / inner / cosignature は Chain Compatibility の allowlist と全 field table を確認した。fee、deadline、recipient、mosaic、amount、transactions hash、署名者 role、existing signature / cosignature、network、canonical bytes を検証する契約がある。
- namespace / metadata / multisig modification / account・mosaic・namespace restrictions / lock / secret transaction は現行 allowlist 外。unknown / future type とともに unsupported とし、「それらしい summary」で承認しない。対応する semantic parser を新たに要求しない。
- generation hash は固定 SDK Network の seed、NEM の signing bytes は non-verifiable serialization に追跡される。core はその情報を付加しない。
- 外部 aggregate hash だけでは拒否する。検証済み full parent から Signer が計算した cosigning bytes を raw core に渡すことは hash-only blind cosigning と同義ではない。
- request substitution、account / network substitution、confused deputy、duplicate approval / signing、stale / replay、TOCTOU は Origin / permission / Profile / Scope / target / freshness / 四条件 / digest と直前再検証で禁止される。入力値の安定性を成立させる契約が SR-010。
- secret leakage / exception leakage は invariants と公開 error policy が禁止。clipboard を authorization / handoff 標準として使わず、custom scheme は追加契約なしに受理しない。
- origin proof は要求元 key と request integrity の証明であり、dApp の善性の証明ではない。compromised dApp の summary を信用しない。compromised privileged Signer / core realm を core facade が安全化する保証はない。
- Relay compromise に対して E2E confidentiality / integrity は要求されるが、transport availability は保証されない。Relay failure を signing failure / unknown 判定へ変換しない。

## 14. Validation Results

- Validation 対象: 新規レビュー記録のみ。
- `pnpm exec prettier --write docs/reviews/specification/interfaces-review-005.md`: 環境エラーで終了。`ERR_PNPM_LOCKFILE_WRITE_FILE`、pnpm の global package-manager dependency 解決が `/home/harvestasya/.local/share/pnpm/global/v11/` の read-only filesystem へ書き込もうとして失敗した。対象レビュー本文の formatter failure ではない。
- `timeout 15s pnpm exec prettier --check docs/reviews/specification/interfaces-review-005.md`: 無出力のまま timeout、exit 124。
- 代替 `./node_modules/.bin/prettier --write docs/reviews/specification/interfaces-review-005.md`: PASS。
- 代替 `./node_modules/.bin/prettier --check docs/reviews/specification/interfaces-review-005.md`: PASS。元の `pnpm exec prettier` は script / pre-post hook / 環境変数の追加がない直接 executable 呼出しなので、対象ファイルの書式検証として同等。pnpm launcher の動作は未検証のまま。
- Local Markdown links: 全相対リンクを実在 path へ解決し PASS。18章、6件の有効 finding の ID / Severity / Status と件数を機械照合した。
- `git diff --check`: PASS。untracked 成果物は別途 formatter とリンク確認の対象にした。
- `git status --short`: 追加は新規レビュー記録のみ。対象 Specification / code / wallet-core は変更していない。
- 根拠・ID 確認: prior `IS-001` / `SR-001`〜`SR-005` を継承し、再発は `SR-003`。新規は `SR-006`〜`SR-010`。
- Not validated: lint / typecheck / test / build、core backend parity test、端末 lifecycle、npm artifact integrity。review-only で実装変更がないため実行していない。

## 15. Review Gates

| Gate                           | 判定                | 理由                                                                                                                                                                    |
| ------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical が1件以上             | Fail                | SR-006 により REVISE SPECIFICATION                                                                                                                                      |
| Major の実装阻害               | Fail                | SR-007 の正式 call / bytes / result / error、SR-008 の cosign response、SR-009 の canonical message、SR-010 の外部入力契約、SR-003 の確定性が安全な実装を一意に定めない |
| 目的と範囲                     | Pass with follow-up | 正式 core を使う意図は一貫するが既存参照の同期が必要                                                                                                                    |
| 入出力・処理・例外・内部整合性 | Fail                | SR-003 / SR-006〜SR-010                                                                                                                                                 |
| 安全性・相互運用性・検証可能性 | Fail                | secret boundary、raw bytes、public result、input rejection の契約が未完                                                                                                 |
| 上流追跡                       | Pass with follow-up | CR-013 と四条件は明示。既存 OPEN の scope / owner は正式判断を要する                                                                                                    |

Major を解消しただけで SR-006 が残る場合も Gate は不合格。Critical 解消後も公開しようとする operation の blocking Major が残る場合は理由付き差戻しを維持する。cosignature / message を対象 release から除外する場合は、その判断・capability・拒否契約を正式資料で確定して再レビューする。

## 16. Remaining Risks and Open Decisions — Residual risks

- interfaces の責任表だけを根拠に、矛盾する chain signing 規範を実装者が黙って無視することはできない。
- core の password 認証 / approved assertion は trusted UI、request freshness、Origin、replay、四条件の代替ではない。
- `0.2.0` の package version と main commit の確認は公開 artifact の integrity・release readiness を証明しない。
- Core は secret-bearing export を許可するが、それは専用 user-request / confirmation flow に限る。署名正常系の秘密鍵取得 workaround として使わない。
- Message Signing は安全な canonical / displayability contract を固定するまで MVP から外す選択を評価した。ただし CR-007-MSG の能力変更は正式 owner の判断を要し、このレビューだけで除外を決定していない。
- Mobile / RN は仕様整合の評価であり、MosaicLynx の Mobile アプリが完成済みであるという判定ではない。
- replay state の保持・process loss・同時 request・malformed DTO の実証は、仕様修正後の実装レビューで確認する。

## 17. Automatic Changes

新規レビュー記録だけを追加した。production code、specification 本文、wallet-core、既存レビューを変更していない。commit / push / tag / publish は行っていない。

## 18. Final Decision

**REVISE SPECIFICATION**

実装フェーズには進めない。最初に `SR-006` の秘密鍵付き SDK signing と正式 wallet-core 委譲の競合を解消し、今回公開する operation の raw bytes / DTO / response / error / input boundary を固定する。`SR-003` の non-collapse 条件を関連 Handoff に適用したうえで再レビューする。
