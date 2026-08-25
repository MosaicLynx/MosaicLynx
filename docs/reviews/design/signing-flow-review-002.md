# MosaicLynx Signing Flow Design Review

## レビュー情報

- 対象: [`docs/design/signing-flow.md`](../../design/signing-flow.md)
- 前回レビュー: [`signing-flow-review-001.md`](./signing-flow-review-001.md)
- 確認日: 2026-08-26
- 判定: `READY`
- レビュー範囲: 前回 `SDR-001`〜`SDR-004` の対応確認、Signing Operation Model、Aggregate Complete / Bonded、cosignature、Partial、NEM multisig、message signing、State Machine、Authorization / TOCTOU、RESULT_UNKNOWN / delivery disposition、Retry / Replay、Wallet Core / Relay / Node 境界、Security Invariants、OPEN の回帰確認。
- 変更範囲: 本レビュー成果物のみ。対象設計、要件、仕様、ADR、コードは変更していない。
- 参照資料: `docs/design/architecture.md`、`docs/design/security-design.md`、`docs/requirements/requirements.md`、`docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`、`docs/specifications/product-spec.md`、`docs/specifications/web-transaction-handoff-spec.md`、`docs/specifications/chain-compatibility-spec.md`、`docs/specifications/profile-account-spec.md`、`docs/release/threat-model.md`、`docs/release/release-process.md`、`docs/release/mainnet-release-evidence.md`、`docs/adr/0001-mainnet-evidence-lite.md`、`_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`、`_snwc/docs/decisions/binding-implementation.md`

## 総評

前回レビューの `SDR-001`〜`SDR-004` は適切に反映されている。Authorization は permission scope / revision と protocol / capability context を含む binding tuple へ拡張され、署名直前の比較も承認時 context との一致を要求している。`signing operation` は logical signing target に対する一回限りの Authorization 消費として定義され、内部 API call、署名検証、result delivery および resend / lookup と区別された。

また、署名生成の成否不明である `RESULT_UNKNOWN` と、署名済み result の配送成否不明である `DELIVERY_UNKNOWN` が分離された。`DELIVERY_UNKNOWN` から result の resend / retrieval / lookup だけを許可し、再署名を禁止するため、前回の二重署名リスクに対する状態上の不足も解消されている。cosignature の「同等の全体表現」についても、外部補助情報や hash + summary を排除し、parent 全体の再構成・検証・表示を要求する条件が明記された。

現行設計は、Browser Extension / Mobile / SDK / Relay に共通する署名基本設計として、下位仕様へ進められる状態である。公開 API、wire schema、具体的な delivery lookup、Chain-specific schema、platform capability などの OPEN を勝手に確定していない点も維持されている。

## 良い点

- Authorization tuple に caller、session、operation、Account、Chain、Network、permission context、protocol / capability context、signing target、transaction context、inspection result、freshness が含まれ、承認時の permission scope / revision と capability context への binding が明示された。
- `1 request = 1 confirmation = 1 authentication = 1 signing operation` の適用単位が logical signing target と一回限りの Authorization に固定された。Wallet Core 内部処理や result delivery が追加の signing operation と誤解されない。
- `RESULT_UNKNOWN` は署名生成自体の成否不明に限定され、確定済み result の配送失敗には `DELIVERY_UNKNOWN` を使う構成になった。既存 result の再配送と新しい署名生成が明確に分離されている。
- cosignature の hash-only 拒否に加え、hash + summary、external summary、部分 field、hash + external lookup を「同等の全体表現」から明示的に除外している。
- Aggregate inspection は outer / embedded transaction、asset effect、authority / permission、transactions hash、existing cosignature、expected role を対象とし、unknown / unsupported / 表示不能を fail closed にしている。
- Partial は共通 signing primitive ではなく chain / network / handoff context として扱われ、Node lookup による parent 補完を署名条件にしていない。
- NEM multisig は Symbol Aggregate と構造・hash・address・signing bytes を共有せず、共通化を lifecycle、approval、binding、correlation、fail closed に限定している。

## 指摘一覧

新規指摘はない。

### 前回指摘の対応状況

| ID        | Severity | 対応確認                                                                                                                                                                                     |
| --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SDR-001` | MEDIUM   | 解消。§4、§5、§16、§23 が permission context と protocol / capability context を Authorization binding および失効条件へ明示的に含め、承認時 revision / context との一致を要求している。      |
| `SDR-002` | MEDIUM   | 解消。§7.3〜§7.4、§20.3、§21 が `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` を分離し、確定済み result の resend / lookup のみを許可して再署名を禁止している。                                     |
| `SDR-003` | MEDIUM   | 解消。§4、§16、§23 が `signing operation` を logical signing target に対する一回限りの signing decision と定義し、内部 API call、verification、delivery、resend / lookup を除外している。    |
| `SDR-004` | LOW      | 解消。§11.2 が parent 全体の security-relevant field、canonical hash / parent binding、全体 inspection を要求し、hash-only、summary、partial field、external lookup を明示的に拒否している。 |

## Aggregate / Cosignature / Partial 評価

適合と評価する。

- Aggregate Complete / Bonded は共通 operation を不必要に増やさず、`TRANSACTION_SIGN` または `COSIGNATURE_SIGN` の chain-specific context として扱っている。outer、embedded、signer、recipient、asset、fee、deadline、namespace、metadata、authority / permission、transactions hash、existing cosignature および expected role を確認対象とし、全体確認不能時は署名しない。
- Cosignature の signing target は detached cosignature bytes ではなく、parent 全体と selected cosigner の関係である。parent contents、hash binding、Chain / Network、expected cosigner、duplicate / already signed、stale / expiry、result correlation を確認し、hash-only や外部 summary による blind signing を排除している。
- Partial は状態・context として扱われ、Partial であることだけでは署名できない。Signer に渡された情報だけで全体を検証・表示できない場合は fail closed し、Node の検索・監視・補完を必須前提にしていない。
- NEM multisig は wrapper / inner transaction、multisig role、hash、address、network、signing bytes を NEM-specific integration に残しており、Symbol Aggregate への不適切な変換はない。

## State Machine 評価

適合と評価する。`RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED` の責任境界、`AUTHORIZED` の短寿命、`AUTHORIZED → SIGNING` 前の target / context 再検証、terminal state からの reopen / 再署名禁止、lifecycle loss 後の Authorization 破棄が維持されている。

署名 lifecycle と result delivery disposition が分離され、`SUCCEEDED + DELIVERY_UNKNOWN` は signing state の再開や新しい signature 生成へ遷移できない。`RESULT_UNKNOWN` は Wallet Core / Binding 呼び出し中など署名生成自体が不明な場合に限定されている。

## Authorization / TOCTOU 評価

適合と評価する。Authorization tuple に permission scope / revision と protocol / capability context が追加され、署名直前は現在値の存在だけでなく、承認時に binding した context との一致を要求している。permission revoke、scope / revision change、protocol / capability change、operation capability change は既存 Authorization を `INVALIDATED` にする。

Confirmation model と target の不変性、caller、session、Account、Chain、Network、operation、signer、expected signer、parent、embedded / inner transaction、message、canonicalization、signature state の再検証も一貫している。Browser observed context、Mobile handoff context、Relay generation の扱いにも回帰はない。

## RESULT_UNKNOWN / Retry 評価

適合と評価する。署名生成自体の結果が不明な場合は `RESULT_UNKNOWN` とし、成功・未署名のいずれとも断定せず、自動再署名を禁止している。署名済みだが配送成否だけが不明な場合は `DELIVERY_UNKNOWN` とし、既存 result の resend / retrieval / lookup だけを候補とする。

同じ request identity の duplicate、内容違いの tampering、期限切れ、replay、Relay state loss、late delivery および stale request は追加署名を発生させない。Relay delivery retry と signing retry も分離されている。

## Wallet Core / Relay / Node 境界評価

適合と評価する。

- Wallet Core は Wallet Store、key management、secret processing、raw signing を担い、MosaicLynx は caller / permission、inspection、confirmation、authentication、Authorization、target revalidation、orchestration、result validation を担う。
- Relay は opaque / untrusted transport に留まり、inspection、approval、signing target の生成・補完・差し替え、signature generation、announce、semantic success 判定を担わない。
- Node は署名成立の必須条件ではなく、Aggregate / Partial parent の検索・監視・補完を署名フローの前提にしていない。
- Provider / Content Script / dApp の自己申告 caller を trusted signer とせず、Browser Extension の privileged layer または Mobile App が観測・検証した context を最終根拠にしている。

## OPEN事項

既存 OPEN は適切に維持されている。本レビューでは解決しない。

- `SDK-OPEN-002`、`SDK-OPEN-003`、`SDK-OPEN-004`、`SDK-OPEN-006`、`SDK-OPEN-007`
- `MR-OPEN-002`、`MR-OPEN-003`、`MR-OPEN-005`、`MR-OPEN-006`
- `CR-OPEN-001`、`CR-OPEN-002`
- Aggregate Complete / Bonded、Partial、Symbol cosignature、NEM multisig / cosignature の公開 operation、format、supported scope
- `DELIVERY_UNKNOWN` に対する具体的な result resend / retrieval / lookup 契約

これらの OPEN を理由に、blind signing、confirmation / authentication の省略、古い Authorization の再利用、Relay の署名判断または Wallet Core への承認責任移管を許可していない。

## 最終判定

`READY`

前回の全指摘が解消され、BLOCKER / HIGH / MEDIUM / LOW の新規指摘は確認されなかった。署名フローの基本設計は、Aggregate / cosignature / Partial、NEM multisig、message signing、State Machine、Authorization / TOCTOU、RESULT_UNKNOWN / delivery failure、Wallet Core / Relay / Node の責任境界を安全に下位仕様へ引き継げる状態である。

## Validation

- `git diff --check`: レビュー成果物作成後に実行する。
- Markdown formatter / lint: `prettier --check` をレビュー成果物に対して実行する。
