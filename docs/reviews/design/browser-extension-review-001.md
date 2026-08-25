# MosaicLynx Browser Extension 基本設計レビュー

## 1. レビュー情報

- 対象: [`docs/design/browser-extension.md`](../../design/browser-extension.md)
- 確認日: 2026-08-26
- レビュー種別: Browser Extension 基本設計レビュー
- 判定: `READY`
- 変更範囲: 本レビュー成果物のみを新規作成。レビュー対象本文、上位資料、ADR、実装および既存レビューは変更していない。
- 主判定基準: Concept、Requirements、Architecture、Security Design、Signing Flow、Interfaces との整合性、ならびに基本設計としての責務・境界・状態・安全条件の十分性。

## 2. 総評

`docs/design/browser-extension.md` は、Browser Extension の基本設計として実装または下位仕様策定へ進められる品質に達している。

本書は、Web page / page-facing bridge / Content Script / privileged host / trusted approval UI / chain integration / wallet-core binding / storage・Browser adapter の責務を分離し、Web page を untrusted とする Trust Boundary を明示している。特に、Browser が観測した caller context による Origin binding、connection・public account disclosure・signing request の分離、request ごとの approval・認証、approval 対象と実署名 payload の署名前再検証、result unknown と delivery unknown の区別、Service Worker・reload・navigation・context loss 後の stale authorization 不使用が、基本設計上の判断として具体化されている。

また、共通 security policy、署名 semantics、共通 request / response、wallet-core の暗号・鍵管理契約、Relay / Mobile protocol を Browser Extension 独自仕様として再定義せず、上位設計を Browser の実行 context、UI、lifecycle および local signer の責務へ適用する構成になっている。

実装不能性、上位設計との矛盾、Trust Boundary の破綻、Origin Binding または Approval Binding の重大な不足は確認されなかった。Manifest、wire schema、storage schema、queue algorithm、具体 API 等を下位仕様へ委譲している粒度も妥当である。

## 3. 判定

### BROWSER EXTENSION DESIGN READY

最終判定: `READY`

基本設計として必要な主要責務、境界、lifecycle、security invariant、fail-closed 方針が定まり、下位仕様策定および実装へ進めてよい。`LOW` / `NIT` を含め、今回のレビューで記録すべき指摘はない。

## 4. 重点確認結果

| 確認項目                          | 判定 | 確認結果                                                                                                                                                                                                                                                                               |
| --------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基本設計としての粒度              | 適合 | §2、§4、§5、§7〜§22 で責務、境界、状態、委譲範囲を定め、Manifest・schema・API・UI layout 等は下位仕様へ委譲している。要求の単なる再記述にも、詳細仕様への過剰な固定にもなっていない。                                                                                                  |
| 上位設計との責任分界              | 適合 | §2、§21、§22 が Architecture、Security Design、Signing Flow、Interfaces を参照し、共通 semantics、wallet-core、Relay / Mobile、SDK の責務を再定義していない。                                                                                                                          |
| コンポーネント境界                | 適合 | §5 が Web page、page-facing bridge、Content Script、privileged host、trusted UI、chain integration、wallet-core binding、storage / Browser adapter を論理的に分離している。Web page から privileged 処理への直接到達を許可していない。                                                 |
| Trust Boundary                    | 適合 | §6 が Web page / bridge / Content Script を untrusted boundary、privileged host を caller・permission・lifecycle の検証主体、trusted UI を承認主体、wallet-core を秘密処理・raw signing 境界として明示している。                                                                       |
| Origin Binding                    | 適合 | §7、§8、§10、§20 が Browser-observed Origin / caller context、browsing context、session、permission、Profile / Account、Chain / Network、target、freshness を binding し、自己申告 Origin や requestId 単独への依存を否定している。                                                    |
| Permission Model                  | 適合 | §7〜§9 が Extension 検出、connection、public account disclosure、signing request を分離し、Origin 単位の permission、scope / revision、revoke、session 無効化および request ごとの approval・認証を定めている。                                                                        |
| Secret Isolation                  | 適合 | §5、§6、§13〜§15、§20 が page / Provider / Content Script への Secret 非公開、wallet-core への cryptographic delegation、UI / permission / Origin logic と cryptographic core の分離を定めている。                                                                                     |
| Signing Request Lifecycle         | 適合 | §10、§12、§18 が受信、検証、inspection、approval、authorization、signing、success と rejected / failed / expired / invalidated / cancelled / result unknown を定義し、terminal state からの再開を禁止している。                                                                        |
| Approval Binding                  | 適合 | §10.3、§11、§13、§20 が Origin、session、permission revision、Account、Chain / Network、operation、inspection result、freshness、target を一回限りの authorization に束ね、wallet-core 呼び出し直前に再検証している。                                                                  |
| Approval UI                       | 適合 | §5.6、§10.2、§11 が Extension 管理下の UI で Origin、Chain / Network、Profile / Account、transaction / message、Aggregate / cosignature の必要な context、影響および approve / reject を扱い、blind signing と Web DOM の承認 authority を否定している。                               |
| Aggregate / Cosignature / Partial | 適合 | §16 が Aggregate Complete / Bonded の outer・embedded 全体、cosignature の parent 全体と signer role、Partial の必要 context を確認対象とし、hash-only、部分情報および node 補完を通常署名の根拠にしていない。詳細 schema は chain-specific design へ委譲している。                    |
| Lock / Unlock Lifecycle           | 適合 | §14、§15、§18、§20 が起動直後、restart、reload、Service Worker 再生成、manual lock、idle、permission / Profile 変更、UI close、context loss を扱い、secret・session・approval の危険な復元を禁止している。                                                                             |
| Storage                           | 適合 | §14 が encrypted Wallet Store、decrypted secret、Profile / Account metadata、permission、settings、session / authorization、transient request を persistent / session scoped / memory only に概念分類している。具体 API・schema は要求していない。                                     |
| Concurrent Requests               | 適合 | §17 が request ごとの identity、context、target、expiration、独立した approval、前面 UI の単一対象、Origin / Account / Network の混在禁止および approval の流用禁止を定めている。queue algorithm は下位仕様へ委譲している。                                                            |
| Failure / Recovery                | 適合 | §18 が malformed、unsupported、permission denied、locked、wrong network、expired、reject、UI close、wallet-core failure、restart、reload、context loss、disconnect、stale response、concurrent conflict を fail-closed に分類している。結果不明時の自動 retry / 再署名も禁止している。 |
| Browser Compatibility             | 適合 | §19 が page injection、message transport、caller context、runtime lifecycle、trusted UI、storage 等を adapter 境界へ限定し、context を確実に観測できない Browser では capability を無効化する方針を示している。                                                                        |
| Mobile / Relay / SDK 境界         | 適合 | §3、§21、§22 が Browser Extension を local signer に限定し、Mobile remote signing、Relay opaque transport、SDK の transport-independent contract と semantic inspection / approval / signing の責務を混同していない。                                                                  |
| Security Invariants               | 適合 | §20 に Web Application の Secret 非アクセス、trusted UI 非制御、明示 approval、Origin binding、解析不能拒否、approval 対象一致、stale authorization 不使用、Secret isolation、Browser / wallet-core 分離および fail-closed が MUST として列挙されている。                              |

## 5. 指摘一覧

今回のレビューで、`BLOCKER`、`HIGH`、`MEDIUM`、`LOW`、`NIT` に該当する指摘は確認されなかった。

| Severity | 件数 |
| -------- | ---: |
| BLOCKER  |    0 |
| HIGH     |    0 |
| MEDIUM   |    0 |
| LOW      |    0 |
| NIT      |    0 |

したがって、レビュー指摘 ID は発行していない。問題がない領域に形式的な指摘を追加しない。

## 6. Security / Trust Boundary 評価

### 6.1 Trust Boundary

適合。§5〜§6 は、page-facing bridge と Content Script を routing / transport の untrusted 境界として扱い、privileged host に次の判断を集約している。

- Browser が観測した sender、tab / frame、document、Origin と request の対応。
- caller、permission、session、Profile / Account、Chain / Network および request integrity。
- chain-specific inspection、trusted UI、approval、authentication、lifecycle および response delivery。

Trusted approval UI は Web Application の DOM、表示文言、CSS、page modal または branding から独立し、wallet-core は caller、permission、UI、利用者承認および transaction の意味解釈を担わない。これにより、Web page から privileged signing authority へ直接到達する設計になっていない。

### 6.2 Origin Binding

適合。§7.2 の authorization tuple は、Origin だけでなく browsing context、session、permission scope / revision、Profile / Account、Chain / Network、operation、signing target、freshness および integrity を含む。§7.3 は response にも request identity、session、Origin、context、Account、Chain / Network、target を要求している。

特に、Web page が自己申告する Origin、tab、Account、Chain、Network または requestId を Browser-observed context の代替にしていない。navigation、document / frame 変更、disconnect、permission change、payload mutation、expiry、duplicate、replay、stale session を旧 authorization の失効条件としており、Origin spoofing、confused deputy、request substitution、cross-origin response leakage、stale session および unsolicited request への基本的な防御方針が成立している。

### 6.3 Approval Binding

適合。§10.3 は approval を単独 boolean ではなく、Origin、session、permission revision、Profile / Account、Chain / Network、operation、target、inspection result、freshness および capability context に対する一回限りの authorization としている。wallet-core 呼び出し直前に、payload、parent、embedded / inner transaction、message、signer、expected signer、permission、inspection、canonicalization、期限および response recipient を再検証する。

immutable snapshot や digest の具体方式は下位仕様に委譲されているが、承認対象と実署名対象を一致させる不変性の概念は基本設計に表現されている。共通 Signing Flow が要求する target digest または同等の不変性確認情報、inspection result、認証状態との binding と矛盾しない。

### 6.4 Security Invariants

適合。§20 の 15 項目は、共通 Security Design §17 の invariant を Browser の context、UI、storage、lifecycle、response delivery、Aggregate / cosignature に適用している。共通方針の単なる重複ではなく、Browser-observed context、page / Content Script、trusted UI、Service Worker、navigation、tab / frame および response channel という Browser 固有の適用条件が加わっている。

## 7. 上位設計との整合性

### Concept / Requirements

[`concept-sheet.md`](../../concept/concept-sheet.md) の local signer、秘密情報と dApp の分離、利用者の明示判断、理解できない要求の安全な終了、Chrome を最初の提供形態とする方針に一致する。[`requirements/browser-extension.md`](../../requirements/browser-extension.md) の BR-001〜BR-013 および BR-AC-001〜BR-AC-013 に対して、Origin、top-level context、permission、trusted UI、page / Extension 分離、lifecycle、wallet-core 境界、最小権限、update safety、Mainnet gate が下流で実装可能な設計判断へ展開されている。

### Architecture

[`architecture.md`](../../design/architecture.md) §5.1、§6.3、§6.7〜§6.8、§7.2、§8、§11 と整合する。Browser Extension は browser context、Application permission、inspection、approval、lifecycle および wallet-core adapter を担い、SDK、Relay、Mobile および wallet-core の責務を取り込んでいない。特に wallet-core Binding を API / data ownership 境界とし、runtime isolation を自動保証しない点も §13 と一致する。

### Security Design

[`security-design.md`](../../design/security-design.md) §5、§7〜§10、§14〜§18 と整合する。Origin 単位 permission、署名ごとの authentication、`1 request = 1 confirmation = 1 authentication = 1 signing`、blind signing 禁止、fail-closed、Secret の最小保持、incident / lifecycle loss 後の authorization 破棄が Browser 固有の形で表現されている。

### Signing Flow

[`signing-flow.md`](../../design/signing-flow.md) §4〜§7、§10〜§13、§18〜§24 と整合する。request context、approval binding、state machine、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、Aggregate / cosignature / Partial の chain-specific 扱い、node lookup による補完禁止および response correlation を再定義していない。

### Interfaces

[`interfaces.md`](../../design/interfaces.md) §4〜§9 と整合する。Browser-observed caller context と SDK / Provider の自己申告を区別し、Public account identity と内部 reference、TransactionSummary と signing target、Signer と wallet-core の validation responsibility を保っている。

### ADR

[`ADR 0001`](../../adr/0001-mainnet-evidence-lite.md) の Mainnet release evidence / gate を Browser Extension の独自判定へ置き換えず、§9、§19、§22、§23 から release policy へ委譲している。gate 未達成または判定不能の build を Mainnet signing enabled として扱わない点も上位要求と整合する。

## 8. 基本設計粒度の評価

粒度は妥当である。

- 実装者が主要判断に迷わない範囲として、責務分担、信頼境界、Origin / permission / session binding、request state、approval binding、lock / reload、failure disposition、Aggregate / cosignature の確認条件を定めている。
- 下位仕様へ委譲すべき事項として、Provider API、wire schema、Manifest JSON、Browser permission 名、runtime message protocol、Origin canonicalization の具体形式、permission taxonomy の細分、storage record、wallet-core DTO、chain-specific schema、UI layout、timeout、queue algorithm、E2E test を列挙している。
- 共通 Security Design、Signing Flow、Interfaces の意味を上書きせず、Browser 固有の適用として整理している。

したがって、Manifest 完全定義、storage schema、JSON Schema、error code 全表、React component、Browser API 呼び出し順、queue algorithm 等の欠落を、この基本設計の不足とは判定しない。

## 9. 未決事項の評価

§23 の未決事項は、基本設計を確定不能にする blocker ではなく、下位仕様または release operation へ適切に引き継がれている。

- Chrome の最低 version、配布 channel、Manifest version、Mainnet gate の build-time / runtime 境界は、要求・ADR・release policy の範囲を超える下位運用事項である。
- Provider / SDK API、Origin proof、session protocol、response unknown 後の再配送・照会は Interfaces / protocol 下位仕様の責務である。
- Aggregate、cosignature、Partial、NEM multisig、message signing の公開 operation と supported scope は、共通の安全条件を維持したまま chain / SDK / platform 下位設計へ委譲されている。
- wallet-core binding、秘密 byte の一時 lifecycle、migration、permission の細分、queue、auto-lock 時間、Profile backup / restore の Browser 範囲は、上位設計の責任境界を弱めずに後続決定できる。

これらの未決事項を理由として blind signing、permission による自動署名、Origin binding の省略、古い approval の再利用、Relay / dApp への Secret 移管または fail-open recovery を許可していない点が明記されている。

## 10. 最終判定

`docs/design/browser-extension.md` は、Browser Extension 基本設計として `READY` と判定する。

### BROWSER EXTENSION DESIGN READY

指摘件数: `BLOCKER 0 / HIGH 0 / MEDIUM 0 / LOW 0 / NIT 0`

## 11. Validation

- Markdown formatting: `pnpm exec prettier --check docs/reviews/design/browser-extension-review-001.md` に成功した。
- 相対リンク: レビュー成果物から参照する上位資料のローカルファイル存在を確認した。
- 指摘 ID 重複: 指摘なし。指摘 ID は発行していない。
- Severity 表記: 指摘なし。集計表の表記は指定された `BLOCKER` / `HIGH` / `MEDIUM` / `LOW` / `NIT` と一致している。
- レビュー対象: `docs/design/browser-extension.md` のみを対象とし、本文は変更していない。
- `git diff --check`: レビュー成果物について問題なし。
- 変更ファイル: 既存の `_nem` / `_symbol` の変更を除き、今回の変更はレビュー成果物 1 ファイルのみ。
- リポジトリ全体 `pnpm format:check`: exit 2。`_nem`、`_sns`、`_symbol`、`.agents`、既存アプリ・パッケージ等に多数の既存 format warning と HTML syntax error があるため失敗した。レビュー成果物の個別 check は成功しており、今回の変更起因とは判定しない。
- lint / typecheck / test / build: レビュー成果物のみの変更のため実行していない。未実行を成功とは扱わない。
