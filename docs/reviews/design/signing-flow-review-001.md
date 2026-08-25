# MosaicLynx Signing Flow Design Review

## レビュー情報

- 対象: [`docs/design/signing-flow.md`](../../design/signing-flow.md)
- 確認日: 2026-08-25
- 判定: `READY WITH CONDITIONS`
- レビュー範囲: Browser Extension / Mobile / SDK / Relay に共通する署名 lifecycle、`TRANSACTION_SIGN` / `COSIGNATURE_SIGN` / `MESSAGE_SIGN`、Aggregate Complete / Bonded、Partial、NEM multisig、message signing、状態機械、Authorization / TOCTOU、Wallet Core / Relay / Node 境界、RESULT_UNKNOWN、retry / replay、error model、Flow Security Invariants および OPEN の引継ぎ。
- 変更範囲: 本レビュー成果物のみ。レビュー対象本文、要件、仕様、ADR、コードは変更していない。
- 参照資料: `docs/design/architecture.md`、`docs/design/security-design.md`、`docs/requirements/requirements.md`、`docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/relay.md`、`docs/requirements/sdk.md`、`docs/specifications/product-spec.md`、`docs/specifications/web-transaction-handoff-spec.md`、`docs/specifications/chain-compatibility-spec.md`、`docs/specifications/profile-account-spec.md`、`docs/release/threat-model.md`、`docs/release/release-process.md`、`docs/release/mainnet-release-evidence.md`、`docs/adr/0001-mainnet-evidence-lite.md`、`_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`、`_snwc/docs/decisions/binding-implementation.md`

## 総評

署名フローの基本設計として、主要な安全境界と責任分担は十分に整理されている。特に、Signer が target 全体から confirmation model を生成すること、解析不能・未対応・表示不能を警告付きで通過させないこと、Aggregate / multisig の親全体を cosignature の signing target とすること、hash-only signing を拒否すること、Node lookup を署名の前提にしないこと、Wallet Core を raw signing と秘密情報処理に限定することは、`security-design.md` および既存要件と整合している。

また、`RESULT_UNKNOWN` からの自動再署名禁止、Relay delivery success と署名成功の分離、Service Worker / Mobile process / Relay state loss 後の Authorization 再利用禁止、Symbol / NEM の chain-specific semantics の分離も明確である。既存の `SDK-OPEN-*`、`MR-OPEN-*`、`CR-OPEN-*` を公開 API や platform capability の確定に使っていない点も適切である。

一方、下位設計へ進める前に、Authorization の binding tuple と実際に再検証する context の表現を一致させ、署名済み結果の配送失敗を `RESULT_UNKNOWN` と混同しない論理状態を補い、`1 signing operation` の安全上の単位を明文化する必要がある。いずれも現行本文に直ちに blind signing や自動再署名を成立させる抜け道があるという判定ではないが、実装者の解釈差が安全性と回復性へ影響する。

## 良い点

- §4〜§5 は、request identity だけでなく caller、session、permission、Account、Chain、Network、target、transaction context、freshness、capability を署名判断の文脈として扱い、SDK / Relay / Provider / Node の自己申告を最終根拠にしていない。
- §6 は Aggregate Complete / Bonded、Partial、NEM multisig を共通 primitive として無理に増やさず、chain-specific transaction context と operation の関係に分離している。公開 API の範囲は `SDK-OPEN-002` 等へ適切に残している。
- §10〜§13 は、Aggregate の outer / embedded 全体、asset effect、権限変更、既存 cosignature、expected signer / role を inspection 対象とし、完全な parent を確認できない cosignature と NEM multisig を拒否する。hash、Relay、Node、dApp の自己申告だけで進める経路を明示的に禁止している。
- §7、§19、§21 は、duplicate、replay、late delivery、old generation、lifecycle loss、request expiry、message expiry を署名 retry と混同せず、新しい request と新しい承認を要求している。
- §14 は message signing を transaction signing から分離し、表示内容と signing bytes の入力を分けないこと、message-level replay / cross-domain / cross-purpose protection と request-level correlation を別層として扱うことを明示している。
- §17〜§18 は、Wallet Core に UI、caller verification、semantic inspection、approval を押し込まず、MosaicLynx 側が承認済み target の orchestration と再検証を担う境界を維持している。`_snwc` の Binding / Core 契約とも矛盾しない。

## 指摘一覧

### SDR-001

- Severity: `MEDIUM`
- 対象: `docs/design/signing-flow.md` §5、§16.1〜§16.2、§23（特に行 90〜106、395〜415、552〜565）
- 内容: §5 の signing request model には `permission context` と `protocol / capability context` が含まれ、§16.2 でも permission と capability を再検証している。一方、Authorization の中心的な論理 tuple（§16.1）は caller、session、operation、Account、Chain、Network、signing target、transaction context、inspection result、freshness だけで、permission と capability が明示されていない。§23 の Authorization 失効条件にも permission / capability が直接列挙されていない。
- リスク: 実装者が §16.1 の tuple を Authorization の保存単位と解釈し、permission の revoke / scope change または capability / protocol context の変更を、単なる現在値の再確認で済ませると、承認時と署名時の権限境界・対応 capability が一致しない状態を作り得る。これは直ちに bypass を意味しないが、TOCTOU の対象を実装解釈へ残す。
- 推奨対応: Authorization tuple または同等の binding contract に、適用される permission scope / revision と protocol / capability context の snapshot または不変識別子を明示的に含める。revoke、scope change、capability / protocol change は Authorization を `INVALIDATED` にすること、再検証は現在値が存在することではなく承認時 binding と一致することを明記する。具体的な field 名や wire schema は確定しなくてよい。
- 根拠: `docs/design/security-design.md` §8.1、§9、§10.2、§17（Account、Chain、Network、caller、permission、session および request の対応、署名ごとの承認、承認状態の再利用禁止）；`docs/requirements/requirements.md` の `CR-NFR-008`、`CR-NFR-009`、`CR-NFR-011`；`docs/requirements/sdk.md` の `SDK-SEC-005`〜`SDK-SEC-006`。

### SDR-002

- Severity: `MEDIUM`
- 対象: `docs/design/signing-flow.md` §7.1〜§7.3、§20〜§22（特に行 135〜193、490〜548）
- 内容: 状態機械は `SIGNING → SUCCEEDED` を Wallet Core の結果検証完了として定義し、後続に `Response` を置く。しかし、署名結果が確定した後に response delivery だけが失敗した場合の状態または外部から識別できる結果 disposition がない。本文はその場合に自動再署名しないと述べる一方、`RESULT_UNKNOWN` は signing の成否自体が不明な状態として定義されている。
- リスク: delivery timeout を `FAILED` / `RESULT_UNKNOWN` と誤分類して同じ target の再署名を誘発する、または署名済み result を安全に再配送できず利用者に新規署名を促す、という実装差が生じ得る。二重署名防止の禁止規則はあるが、既知の署名結果と署名成否不明を lifecycle 上で機械的に区別できない。
- 推奨対応: `SIGNED_RESULT_PENDING_DELIVERY`、`DELIVERY_UNKNOWN` 等の非署名 recovery disposition を導入するか、状態名を増やさずとも「signature generation confirmed / response delivery pending」と「signature generation unknown」を明示的に区別する論理契約を追加する。前者は result resend / lookup のみ許可し、`SIGNING` への遷移・新しい署名生成を禁止する。result lookup / wire retry の具体方式は既存 OPEN と下位 handoff 仕様へ委譲できる。
- 根拠: 同設計 §7.3（行 192〜193）、§20.2（行 508〜516）、§21（行 525〜528）；`docs/requirements/relay.md` の `RR-NFR-002`、`RR-AC-011`、`RR-AC-012`；`docs/specifications/web-transaction-handoff-spec.md` の generation / state loss / result handling 規則。

### SDR-003

- Severity: `MEDIUM`
- 対象: `docs/design/signing-flow.md` §4、§6、§7、§23（特に行 82、112〜129、395〜402）
- 内容: `1 request = 1 confirmation = 1 authentication = 1 signing operation` は安全原則として適切だが、`signing operation` が logical user action、protocol operation、Wallet Core API call、または signature byte generation のどれを指すか定義されていない。本文は `Signing request` を一つの署名判断として定義し、operation を transaction / cosignature / message の分類として扱っているが、両者の安全上の単位が明示的に同一化されていない。
- リスク: Aggregate の初期署名と追加 cosignature、Wallet Core の内部呼び出し、結果再配送を実装ごとに異なる粒度で一つの authorization と扱う可能性がある。認証の使い回し、意図しない batch 化、または安全性を保つための過剰な API 制約につながる。
- 推奨対応: この不変原則における `signing operation` を「一つの logical signing target に対する一回の署名判断・一回の使用済み Authorization」と定義する。Wallet Core の内部 API call や signature verification、result delivery は新しい signing operation ではない。別の parent、cosigner、Account、operation または target は別 request / authorization とし、複数の内部 cryptographic call を許すかどうかは下位契約で決めるが、承認済み target の範囲を拡張しないことを明記する。
- 根拠: `docs/design/security-design.md` §7.1、§10.2、§17（毎回再認証、request ごとの承認・認証・署名分離）；`docs/requirements/requirements.md` の `CR-AC-001`、`CR-AC-012`、`CR-NFR-011`。これは batch signing を許可する提案ではなく、既存の一回限り原則の適用単位を明確化する提案である。

### SDR-004

- Severity: `LOW`
- 対象: `docs/design/signing-flow.md` §11.1〜§11.2（特に行 264〜294）
- 内容: hash-only cosignature の拒否と parent 全体の inspection は明確であるが、「完全な parent payload、または下位仕様で承認された同等の全体表現」という表現が、何をもって parent 全体と同等とするかを下位仕様へ広く残している。
- リスク: 将来の下位仕様が、hash + 外部 summary、Node / Relay からの補完、または一部フィールドだけの commitment を「同等」と解釈すると、§11.2 の hash-only 禁止を実質的に迂回し得る。
- 推奨対応: 「同等の全体表現」は、Signer が外部補助情報なしに parent の全 security-relevant field、embedded / inner transaction、既存署名・cosignature、selected cosigner、canonical hash binding を再構成・検証・表示できる表現に限る、と基本設計上で条件付ける。hash、opaque identifier、外部表示文言および Node / Relay lookup は代替にならないことを再掲する。
- 根拠: 同設計 §4.1、§10.1、§11.1〜§11.2；`docs/specifications/product-spec.md` §12.3（完全な親 payload、hash / partial data の拒否）；`docs/specifications/chain-compatibility-spec.md` §5〜§6（parent hash / transactions hash の canonical validation）。

## Aggregate / Cosignature / Partial 評価

総合評価は「安全条件は満たしているが、SDR-004 の binding 表現を下位仕様へ引き継ぐ際に条件を固定すること」である。

- Aggregate Complete / Bonded: outer、embedded、signer、recipient、mosaic / amount、fee、deadline、namespace、metadata、authority / permission、transactions hash、payload size、existing cosignature、expected role まで inspection 対象に含め、部分解析や unknown / unsupported の warning bypass を拒否している。Complete / Bonded を独立共通 operation にしない分類も妥当である。
- Cosignature: signing target を cosignature bytes 単体ではなく parent 全体と selected cosigner の関係として定義している。parent contents、hash、Chain / Network、expected cosigner、duplicate / already signed、stale / expiry、result correlation を要求し、hash-only、Node / Relay / SDK / dApp の自己申告による省略を拒否している。SDR-004 の「同等表現」の条件だけ明文化が必要である。
- Partial: 共通 primitive ではなく chain / network / handoff context として扱い、Partial であることだけで署名可能にせず、全体確認不能なら fail closed としている。Node から検索・監視して補完する前提もない。Symbol と NEM の Partial semantics を同一化していない。
- NEM multisig: Symbol Aggregate と transaction model を共有せず、wrapper / inner transaction、initiator、inner signer、fee payer、cosignature semantics、hash、address、network、signing bytes を NEM integration に残している。共通化は lifecycle、approval、binding、correlation、fail closed に限定されている。

## State Machine 評価

`RECEIVED → VALIDATED → INSPECTED → AWAITING_USER → AUTHORIZED → SIGNING → SUCCEEDED` の責任分担、`AUTHORIZED` の短寿命、署名前の再検証、terminal state からの reopen / 再署名禁止、Service Worker / Mobile / Relay lifecycle loss の安全側終了は適切である。`SIGNING` の自動再実行禁止も明示されている。

ただし、`SUCCEEDED` 後の response delivery failure が state machine の外に残り、`RESULT_UNKNOWN`（署名成否不明）と同じ request の result delivery problem を機械的に分ける状態がない。SDR-002 を条件として、署名結果の再配送と署名生成を分離する disposition を下位仕様へ確実に引き継ぐ必要がある。

## Authorization / TOCTOU 評価

requestId 単体への依存を避け、caller、session、operation、Account、Chain、Network、target、transaction context、inspection result、freshness に binding し、Wallet Core 呼び出し直前に target、parent、embedded / inner、message、signer、expected signer、permission、capability、canonicalization、signature state を再検証する構成は十分に強い。Confirmation model と実 target の不変性、Browser observed context、Mobile handoff context、Relay generation も適切に扱われている。

SDR-001 のとおり、中心 tuple に permission / capability を明示しない点だけが表現上の不整合である。現在値との比較ではなく、承認時の permission scope / capability context との一致と、変更時の失効を明示すれば、TOCTOU の責任境界が一貫する。

## RESULT_UNKNOWN / Retry 評価

`RESULT_UNKNOWN` を成功とも未署名とも断定せず、自動再署名を禁止し、Relay delivery retry と signing retry を分離し、restart / state loss / stale / duplicate / replay 後に古い Authorization、session、ciphertext、target を再利用しない点は適合している。既知の署名結果を result resend / lookup と再署名から分ける方針も本文にある。

SDR-002 の状態表現を補えば、response delivery failure と signing generation uncertainty を外部契約へ安全に伝播できる。lookup が未決であること自体は問題ではなく、lookup がない場合でも自動再署名しないという現在の原則を維持すべきである。

## Wallet Core / Relay / Node 境界評価

- Wallet Core: MosaicLynx が caller verification、semantic inspection、confirmation、authorization、authentication、target revalidation、orchestration、result validation を担い、Wallet Core が Wallet Store、key management、secret processing、raw signing を担う分離は適切である。KDF、AEAD、Store format、key derivation、signing bytes、secret lifecycle を再実装していない。
- Relay: opaque / untrusted transport とし、inspection、approval、signing target の生成・補完・差し替え、signature generation、announce、semantic success 判定を Relay に置いていない。generation、late delivery、state loss、delivery success と署名成功の分離も適合している。
- Node: parse、validation、inspection、confirmation、署名の必須条件にせず、Node response や metadata を署名可否の単独根拠にしていない。Partial / Aggregate parent の node lookup を共通前提にしない点も適切である。
- Browser Extension / Mobile: Provider / Content Script / self-reported Origin を trusted signer とせず、privileged layer / Mobile App が browser observed context または handoff context を再検証する。tab / frame / document change、navigation、Service Worker restart、Mobile process loss の安全側扱いも要件と一致する。

## OPEN事項

既存の未決事項は適切に引き継がれており、本レビューでは解決しない。

- `SDK-OPEN-002`、`SDK-OPEN-003`、`SDK-OPEN-004`、`SDK-OPEN-006`、`SDK-OPEN-007`: Aggregate / cosignature の公開範囲、transport、transaction construction、version policy、caller / Origin binding、具体 API。
- `MR-OPEN-002`、`MR-OPEN-003`、`MR-OPEN-005`、`MR-OPEN-006`: Mobile 受信経路、OS 保護、Binding integration、lifecycle、backup / migration。
- `CR-OPEN-001`、`CR-OPEN-002`: Wallet Core Binding host integration、秘密 byte lifecycle、OS 保護、error mapping、migration。
- Aggregate / Bonded、Partial、Symbol cosignature、NEM multisig / cosignature の public operation、format、supported scope。
- `result unknown` 後の既存署名結果の lookup / resend 契約。既存署名を再配送する処理と、同じ target の再署名は分離する。

SDR-002 と SDR-003 は新しい公開 API を決める指摘ではないが、下位仕様の前提として追跡すべき設計 clarification である。SDR-004 の「同等の全体表現」の条件も、既存 OPEN を解決せずに安全下限として追記できる。

## 最終判定

`READY WITH CONDITIONS`

BLOCKER / HIGH は確認されなかった。基本設計は、下位仕様へ進めるための主要な責任境界、安全不変条件、Aggregate / cosignature / Partial の fail-closed 方針、Symbol / NEM の分離、Wallet Core / Relay / Node 境界を満たしている。

ただし、下位仕様化の前に次を反映することを条件とする。

1. Authorization tuple と失効条件へ permission scope / revision および capability / protocol context の binding を明示する（SDR-001）。
2. 既知の署名結果の response delivery failure と signing generation uncertainty を lifecycle / result disposition 上で区別し、前者を result resend / lookup のみに限定する（SDR-002）。
3. `signing operation` を一回限りの Authorization の安全上の単位として定義する（SDR-003）。
4. cosignature の「同等の全体表現」が parent 全体の再構成・canonical hash binding・全 field inspection を満たすことを固定する（SDR-004）。

## Validation

- `git diff --check`: 実行済み。レビュー成果物作成後に再実行する。
- Markdown formatter / lint: リポジトリにレビュー Markdown 専用 formatter / lint の定義があるか確認し、定義があればレビュー成果物に対して実行する。
