# MosaicLynx Relay Specification 独立再レビュー

## 1. Review Target

- **対象:** [`docs/specifications/relay.md`](../../specifications/relay.md)
- **対象 revision:** `778c3bcd7da22d212e0d8d04397abb33b0461d9f`（`main` / `origin/main`）
- **確認日:** 2026-08-29
- **今回の成果物:** `docs/reviews/specifications/relay-review-003.md`
- **前回レビュー:** [`relay-review-001.md`](./relay-review-001.md)、[`relay-review-002.md`](./relay-review-002.md)
- **レビュー種別:** 最新の `spec-review` Skill、`review-common` playbook、reviewers、review-gates、output-format に基づく独立 Specification Review
- **レビュー範囲:** 現行 Relay Specification 全文、Handoff §9 の endpoint 契約、共通 Interfaces / Signing Protocol / SDK、Requirements / Design との追跡、opaque transport 境界、credential / secret 分離、lifecycle、ACK / cancel、generation、replay、error、observability、four-condition / Mainnet authority、phase boundary および過去 finding の再評価
- **対象外:** Relay / Mobile / SDK 実装の変更、Redis / database / deployment、WebSocket / push、wallet-core、暗号 primitive、release evidence evaluator、実 Relay、実 Mobile App、実ネットワーク、E2E および runtime build。実装は今回の normative authority として使用していない。

今回の判定は差分または `relay-review-002.md` の判定を継承せず、現行 `relay.md` 全文を直接確認して行った。過去レビューは finding history と比較材料に限定し、normative authority として使用していない。

## 2. Execution Audit

サブエージェントは使用していない。Chair が scope / authority を確定し、Reviewer A〜C の観点を独立した走査として実施した後、反証、責任分界、重複排除、Review Gate および成果物の整合性を確認した。

| Phase   | Reviewer / 活動                              | 実施内容と結果                                                                                                                                                                                                                                                                                                |
| ------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0 | Chair                                        | `HEAD` と `origin/main` が対象 revision と一致し、開始時 worktree が clean であること、変更対象が review artifact のみであることを確認した。                                                                                                                                                                  |
| Phase 1 | Reviewer A — Contract clarity / completeness | Relay の opaque envelope、endpoint、credential scope、generation、state、ACK / cancel、error、known result / unknown result、delivery authority、acceptance および traceability を全文確認した。RLS-001 の解消と SR-001 候補を確認した。                                                                      |
| Phase 1 | Reviewer B — Value / operational alignment   | Relay Requirements / Design、Handoff §9、Interfaces、Signing Protocol、SDK、Architecture、Mobile / Browser の責任分界を照合した。Handoff endpoint の独自再定義、retention、restart、duplicate、resource、observability の差分を確認した。                                                                     |
| Phase 1 | Reviewer C — Safety / interoperability       | secret / credential、cross-session、generation、state loss、ACK / cancel race、signing outcome、`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN`、four conditions、Mainnet gate、fallback および phase boundary を adversarial に確認した。                                                                              |
| Phase 2 | Chair — counterargument / integration        | 「Relay の `delivered` は単なる transport observation である」「Relay は signing authority を除外している」という反証を確認した。その上で、Signer-originated `deliveryDisposition` と同名の概念を本文が別定義している曖昧さを blocking と判定し、Mainnet / four-condition の追跡不足を非blocking と分類した。 |
| Phase 3 | Chair — gates / artifact                     | finding の severity / status、Required / Optional / Deferred、7 Review Gates、Validation Results、Final Decision を統合し、本成果物だけを作成する。                                                                                                                                                           |

## 3. Evidence Used

| 区分                           | 確認資料                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 用途                                                                                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill / repository             | [`AGENTS.md`](../../../AGENTS.md)、[`.agents/project-context.md`](../../../.agents/project-context.md)、[`spec-review/SKILL.md`](../../../.agents/skills/spec-review/SKILL.md)、`reviewers.md`、`review-gates.md`、`output-format.md`、[`review-common/review-playbook.md`](../../../.agents/skills/review-common/review-playbook.md)、`review-common/output-format.md`                                                                                                                                                                                    | review phase、authority、formal finding、severity / status、7 gates、phase boundary、成果物構成および Git 運用を確認した。                                                    |
| Target / history               | [`relay.md`](../../specifications/relay.md)、[`relay-review-001.md`](./relay-review-001.md)、[`relay-review-002.md`](./relay-review-002.md)                                                                                                                                                                                                                                                                                                                                                                                                                | 現行本文全文、既存 OPEN、RLS-001 の履歴および focused re-review を確認した。過去レビューの結論は根拠として再利用していない。                                                  |
| Requirements                   | [`requirements.md`](../../requirements/requirements.md)、[`relay.md`](../../requirements/relay.md)、[`sdk.md`](../../requirements/sdk.md)、[`mobile-app.md`](../../requirements/mobile-app.md)、[`browser-extension.md`](../../requirements/browser-extension.md)                                                                                                                                                                                                                                                                                          | RR-001〜RR-011、RR-AC、共通 four conditions、Mainnet release gate、SDK / Mobile / Browser / Relay の責任と fail-closed 要求を確認した。                                       |
| Design                         | [`architecture.md`](../../design/architecture.md)、[`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)、[`interfaces.md`](../../design/interfaces.md)、[`relay.md`](../../design/relay.md)、[`sdk.md`](../../design/sdk.md)                                                                                                                                                                                                                                                                         | Relay の untrusted boundary、secret boundary、Signer authority、four conditions、lifecycle、known-result recovery、Mainnet gate 非代替性および責任分界を確認した。            |
| Common / related Specification | [`interfaces.md`](../../specifications/interfaces.md)、[`signing-protocol.md`](../../specifications/signing-protocol.md)、[`sdk.md`](../../specifications/sdk.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`browser-extension.md`](../../specifications/browser-extension.md)、[`profile-account-spec.md`](../../specifications/profile-account-spec.md)、[`chain-compatibility-spec.md`](../../specifications/chain-compatibility-spec.md)、[`product-spec.md`](../../specifications/product-spec.md) | Handoff wire / HTTP authority、transport と signing の分離、`deliveryDisposition`、`RESULT_UNKNOWN`、four conditions、Mainnet gate、Origin / Account / chain 境界を確認した。 |
| Supplementary implementation   | なし                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 実装、build、E2E および実 Relay の挙動は本 Specification の authority として扱わなかった。                                                                                    |

## 4. Review Result

`REVISE SPECIFICATION`

現行本文は Relay を opaque / untrusted transport として設計し、Handoff §9 の endpoint、credential、ACK / cancel、generation、retention、privacy および concurrency を概ね適切に定めている。RLS-001 の ACK / cancel `204 No Content` no-op semantics も解消済みである。

ただし、§3、§13.3、§14.1、§14.3 および §22.10 の Relay-local “delivery disposition” と、上流が Signer-originated field として予約する `deliveryDisposition` / `PENDING` / `DELIVERED` / `DELIVERY_UNKNOWN` の境界が一意でない。Relay が transport failure から `DELIVERY_UNKNOWN` を作る、または ACK / consumed を `DELIVERED` として公開する読み方を排除できないため、現行のままでは public result semantics と recovery semantics を安全に実装できない。`SR-001` は Critical とし、修正まで Ready としない。

加えて、四つの signing conditions と Mainnet release / evidence gate が Relay の非権限であることは上流・Design では確定しているが、Relay 本文の security invariant、acceptance、traceability で明示性が不足する。Relay に新しい gate や実装詳細を要求するものではなく、`SR-002` は Minor の同期・検証可能性 finding とする。

## 5. Summary

- Relay は request / response encrypted envelope を復号・意味解釈せず、Account、permission、Origin、approval、authentication、signing、result validity および Mainnet evidence の authority を持たない。`appToken` / `webToken` と `sessionSecret` / derived E2E material も分離されている。
- Handoff §9 の generation、create / retrieval / response / polling、ACK、cancel、HTTP status、expiry、size、rate limit、existence hiding および generic error body は本文と整合する。本文は Handoff wire contract を新しい endpoint や token model として拡張していない。
- RLS-001 は解消済みである。外形が妥当な ACK / cancel は常に `204 No Content`、状態変更は正しい endpoint-scoped `webToken`、対応 session、current generation / lifecycle 等を確認できる場合だけ、その他は no-op である。`204`、purge、ACK、cancel は signing result、approval、signing cancellation、unsigned または Signer-side delivery success を証明しない。
- generation、restart / state loss、terminal state、duplicate / replay、response race、expiry / purge、bounded retention、observability privacy、error authority、automatic re-sign / fallback 禁止は概ね一貫している。旧 state / credential / approval / signing state を復元しない契約も維持されている。
- `SR-001` は、Relay の transport status と Signer-originated `deliveryDisposition` が同じ “delivery disposition” 名で定義され、response delivery failure を “不明” と扱う記述も残るため、Signer-only `DELIVERY_UNKNOWN` の生成禁止と ACK / consumed 非同値性を本文から一意に検証できない点である。
- `SR-002` は、Relay が四条件または Mainnet gate を所有しないことを、本文の acceptance / traceability まで明示的に追跡できない点である。現在の本文に Relay がそれらを評価・代替する直接の記述はなく、opaque boundary の基本方向は維持されている。

## 6. Finding Status

`Status` は current Skill の formal disposition を示す。旧レビューの `ERROR` は歴史上の表記であり、現行の severity 体系では RLS-001 を当時の blocking 相当として `Major` と表示する。

| Finding   | Severity | Status     | 初出レビュー | Previous | Current      | 今回の判定根拠                                                                                                                                                                           |
| --------- | -------- | ---------- | ------------ | -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RLS-001` | Major    | `Resolved` | review-001   | Resolved | **Resolved** | §5.2、§8.2、§13.1、§13.2、§14.1、§15.1、§16.1 が Handoff §9.6 の valid-shape `204`、条件付き mutation、no-op、existence hiding、terminal / state-loss semantics を一貫して定める。       |
| `SR-001`  | Critical | `New`      | review-003   | —        | **New**      | §3、§13.3、§14.1、§14.3、§22.10 が Relay-local transport status と Signer-only `deliveryDisposition` の名前・生成権限を完全には分離していない。                                          |
| `SR-002`  | Minor    | `New`      | review-003   | —        | **New**      | §4.2、§20〜§23 が approval / authentication / signing を一般に除外する一方、四条件、Mainnet gate 非権限、fail-closed、Testnet-only 継続の acceptance / traceability が明示されていない。 |

前回 finding の再評価を表にすると次のとおりである。

| Finding | Previous | Current      |
| ------- | -------- | ------------ |
| RLS-001 | Resolved | **Resolved** |

## 7. Required Changes

### SR-001 — Relay-local delivery status と Signer-originated deliveryDisposition の境界

- **Severity:** Critical
- **Status:** New
- **Location:** `relay.md` §3、§13.3、§14.1、§14.3、§22.10
- **Issue:** §3 は “delivery disposition” を Relay が request / response を配送した状態として定義する。§13.3 は Relay が `delivered` を報告できるとし、`DELIVERED`、`ACKNOWLEDGED`、`CONSUMED` を列挙する。さらに §14.1 は response delivery failure を “delivery disposition を失敗または不明” とし、§14.3 は Relay failure / response delivery から outcome を判定できない場合に SDK / Signer が `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` semantics を使用すると記載する。これは、Relay-local failure / ACK / consumed state を Signer-originated `DELIVERY_UNKNOWN` / `DELIVERED` として生成・推測・昇格できる余地を残す。
- **Authoritative conflict:** Interfaces §10.3、Signing Protocol §19.3、Handoff §7.2 は `deliveryDisposition` を known signed result に付随する Signer-side field とし、`PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` を SDK / Provider / Relay / transport が生成・推測・変更してはならない。Handoff §9.6 / SDK ACK・Relay `consumed` は Signer-side delivery disposition と同値ではなく、response registration や ACK から `DELIVERED` を成立させない。
- **Required clarification:** Relay-local observation は `transport status` または同等の専用語へ改める。`deliveryDisposition`、`PENDING`、`DELIVERED`、`DELIVERY_UNKNOWN` は Signer-originated known signed result のみが設定し、Relay の storage、retrieval、HTTP success、ACK、`consumed`、timeout、connection / restart / state loss、response absence、delivery failure から Relay が生成・推測・変更・確定しないと明記する。`RESULT_UNKNOWN` も同様に Relay が生成しないこと、known signed result の `DELIVERY_UNKNOWN` は result を保持すること、Relay failure 後の recovery は既存 result の resend / retrieval / lookup に限ることを本文の failure / acceptance / traceability に反映する。
- **Phase boundary:** これは実装方式、retry 秒数、storage schema または新しい error taxonomy の要求ではなく、既存共通契約の外部名、authority、意味保存を一意にするための仕様修正である。

## 8. Optional Improvements

### SR-002 — Common four conditions / Mainnet gate の Relay 非権限の明示と追跡

- **Severity:** Minor
- **Status:** New
- **Location:** `relay.md` §4.2、§20、§21、§22、§23
- **Issue:** 本文は approval、authentication、signing、Account / permission 等を一般に Relay の責任外としているが、Authentication、Signing-capable unlock、Account authorization、Explicit user approval の四条件を独立した Signer authority として列挙していない。また Mainnet release / evidence gate、missing / invalid / expired / inconsistent / unverifiable / unknown の fail-closed、Testnet-only 継続および Relay health / availability / transport success の非代替性が、acceptance / traceability に現れない。
- **Evidence:** Requirements `CR-AC-017`、`CR-NFR-006` / `CR-AC-008`、Interfaces §7.4 / §15、Signing Protocol §8 / §21.1、Relay Design §10.2 / §20 はこれらを確定済みの共通契約としている。本文 §20.2 の availability 非代替性と §21 の Mobile responsibility は方向として整合するため、現時点で Relay が gate evaluator や four-condition authority になっているとは判定しない。
- **Recommended clarification:** §20、§22、§23 に、四条件は trusted Signer の独立した必須条件であり Relay の session / participant / token / generation / request existence / transport success では所有・検証・キャッシュ・復元・推測・代替できないことを短く追記する。Mainnet gate は trusted Signer / release security authority の responsibility で、Relay は evaluator / verifier / capability promoter ではなく、Mainnet gate failure / unknown から別 route、再署名、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` または transport success を生成しないこと、Testnet-only の安全な継続を妨げないことを acceptance / traceability に追加する。evidence evaluator、trusted key、SBOM、release tooling の詳細は追加しない。
- **Disposition:** 現本文に直接の authority 逆流はないため、`SR-002` は Optional Improvement とし、Review Gate を単独で fail させない。

## 9. Resolved Findings

### RLS-001 — ACK / cancel semantics

現行 §5.2、§8.2、§13.1、§13.2、§14.1、§15.1 および §16.1 は Handoff §9.6 の例外を明示している。method、path、header、body、protocol 等の外形が妥当な ACK / cancel は、wrong token、unknown / purged session、terminal / expired state、duplicate、generation mismatch、restart / state loss を含め、常に `204 No Content` である。正しい endpoint-scoped `webToken`、対応 session、current generation / lifecycle、適用可能な state を確認できた場合だけ一度の mutation / purge を行い、それ以外は no-op とする。

`204`、ACK、cancel、purge、`consumed` または `cancelled` は signing success、signing failure、signing cancellation、unsigned、user approval、session existence、token validity、Signer-side delivery success の証明ではない。ACK と cancel の競合も terminal transition を高々一度とし、late response、cross-session、terminal reactivation を許さない。これは `relay-review-002.md` の判定を機械的に継承したものではなく、現行本文と Handoff §9.6 を直接照合した結果である。

## 10. Deferred Findings

- `OPEN-RELAY-001` generation exact format、`OPEN-RELAY-002` storage / deployment topology、`OPEN-RELAY-003` reconnect / resume API、`OPEN-RELAY-004` retry / transport failure mapping、`OPEN-RELAY-005` operational resource policy は、現行本文が安全側の境界を固定した上で下位仕様または運用へ委譲しており、今回の finding にはしない。
- Handoff §9.6 の “unfinished session” と state graph の `response_available` から `cancelled` への明示枝の関係は、Handoff と Relay に共通する表現上の残余である。Relay は §13.2 の “cancellation が適用可能な lifecycle” と競合時の一つの terminal transition を定めている。上流の endpoint authority を越えて cancel 対象 state を独断で決めないため、今回は新規 finding とせず、Handoff の次回 lifecycle clarification に委譲する。
- generation の exact format、retention の具体値、retry interval / count、storage backend、concurrency primitive、deployment topology、WebSocket / push、crypto implementation、release evaluator schema / tooling は Specification phase boundary の対象外である。

## 11. Scope and Traceability

対象本文は Relay の外部可視 transport contract、opaque / untrusted boundary、credential scope、routing、lifecycle、failure、retention、privacy、resource control および上流 authority への委譲を扱う。Signer の transaction / message semantics、Origin / Account / permission、four conditions、approval、wallet-core、Mainnet release evaluator および SDK / Provider の公開 result mapping は Relay が所有しないため、Relay の非権限と pass-through だけを判定した。

| 上流要求 / 契約                                                                      | 対象本文                        | 評価                                                                                                                                                                |
| ------------------------------------------------------------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RR-001`〜`RR-003`、`RR-AC-006`〜`RR-AC-010`、Relay Design §3 / §15〜§17             | §2〜§4、§9、§10、§20〜§22       | Relay は opaque envelope を構造検証と routing の範囲で扱い、semantic parse、Account / permission、approval、signing、secret を持たない。                            |
| `RR-004`、`RR-006`、`RR-NFR-002`、`RR-NFR-005`、Interfaces §5〜§6、Handoff §9.7      | §6、§7、§11、§13〜§16、§20〜§22 | generation、expiry、state loss、terminal state、duplicate / replay、fresh retry、fail-closed、ACK / cancel を追跡できる。                                           |
| `RR-005`、`RR-007`、Handoff §9.2〜§9.5                                               | §5、§7、§8、§10、§15            | session / participant / direction / request identity / generation / endpoint credential の binding と cross-session isolation を追跡できる。                        |
| `RR-008`、`RR-NFR-003`、`RR-NFR-004`、Security Design、Handoff §7.3 / §8〜§9         | §8、§9、§12、§17、§18、§20      | `appToken` / `webToken` と session secret / derived E2E key の分離、byte preservation、bounded retention、non-logging、generic error body を追跡できる。            |
| `RR-009`、`RR-AC-001`、`RR-AC-012`、Signing Protocol §19、SDK §5 / §13〜§17          | §14〜§16、§20〜§22              | signing outcome を Relay state と混同しない方向、no automatic re-sign / fallback、fresh context、known-result recovery の境界を追跡できる。ただし `SR-001` が残る。 |
| `CR-AC-017`、Interfaces §8 / §9.7、Signing Protocol §8 / §16 / §22                   | §4.2、§20、§21、§22             | Relay が approval / authentication / signing を持たないことは追跡できるが、四条件の個別列挙と acceptance / traceability は不足する（`SR-002`）。                    |
| `CR-NFR-006`、`CR-AC-008`、Interfaces §7.4、Signing Protocol §21.1、Relay Design §20 | §2、§4、§20〜§23                | Relay の Mainnet gate 非権限は設計・共通契約で確定しているが、Relay 本文の acceptance / traceability に明示がなく、`SR-002` の対象となる。                          |
| Interfaces §10.3、Signing Protocol §19.3、Handoff §7.2 / §9.6、SDK §5.1 / §5.4       | §3、§13.3、§14、§20、§22        | Relay transport observation と Signer-originated `deliveryDisposition` の用語・生成 authority が本文で衝突する（`SR-001`）。                                        |

## 12. Domain Checks

| Check                               | 判定                        | 根拠                                                                                                                                                                                                       |
| ----------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Purpose / scope                     | **Pass**                    | §1〜§4 は Relay を SDK / Web-side と Mobile App 間の短期 opaque / untrusted transport に限定し、semantic、signing、wallet、secret を除外する。                                                             |
| Handoff endpoint contract           | **Pass**                    | §5、§7〜§8、§13〜§14、§19 は Handoff §9 の endpoint、HTTP、credential、expiry、existence hiding、ACK / cancel、generic error、size / rate limit を参照・適用し、独自 endpoint / token model を追加しない。 |
| Opaque / untrusted boundary         | **Pass**                    | §4.2、§9、§20、§21 は復号、semantic parse、summary、Account / permission、approval、authentication、signing、result validation、E2E secret の扱いを Relay から除外する。                                   |
| Credential / E2E secret separation  | **Pass**                    | §8 は `appToken` / `webToken` を endpoint authorization credential、session secret / derived key を client-side E2E secret として分離し、raw token、secret、plaintext、full ciphertext を漏えいさせない。  |
| ACK / cancel                        | **Pass — RLS-001 Resolved** | 外形妥当なら常に `204`、条件付き mutation、それ以外の no-op、terminal / purge / state loss existence hiding、signing outcome 非同値が一貫している。                                                        |
| Generation / restart / state loss   | **Pass**                    | §6、§7.4、§11、§15〜§16 は generation change、old state 不復元、fresh identity / envelope、state loss 時の no-op / fail-closed、generation mismatch の非 signing error 化を定める。                        |
| Replay / duplicate / race           | **Pass**                    | §11、§15、§16 は same envelope retry、first response wins、conflict、terminal transition、cross-session isolation、late response、防止すべき rollback / double response を定める。                         |
| Signing result / delivery semantics | **Fail — SR-001**           | §13.3 / §14.1 / §14.3 の Relay-local “delivery disposition” と `DELIVERY_UNKNOWN` の関係が一意でなく、Signer-only disposition の non-generation / non-rewrite を本文だけで完全には検証できない。           |
| Error authority                     | **Conditional — SR-001**    | 新しい public SDK error taxonomy を作らず Handoff / Interfaces / Signing Protocol を参照する点は Pass。ただし transport “unknown” と `DELIVERY_UNKNOWN` の読み替え余地が残る。                             |
| Four signing conditions             | **Pass with SR-002**        | Relay は一般に approval / authentication / signing authority を持たないが、四条件を独立した trusted Signer authority として acceptance / traceability まで明示していない。                                 |
| Mainnet release / evidence gate     | **Pass with SR-002**        | Relay に gate evaluator / promoter の直接記述はなく、Design / common contract と方向は整合する。本文の non-authority、fail-closed、Testnet-only 継続の追跡が不足する。                                     |
| Observability / privacy             | **Pass**                    | §17〜§18 は health、counts、latency、resource / state failure 等の最小 metadata に限定し、plaintext、secret、token、full ciphertext、Account / Origin linkage を排除する。                                 |
| Automatic retry / fallback          | **Pass**                    | §7.4、§14.3、§16、§20〜§22 は automatic re-sign、approval reuse、Signer / Provider / transport fallback を Relay が開始・要求しないこと、known result recovery の境界を定める。                            |
| Specification phase boundary        | **Pass**                    | Redis、database、mutex、queue、Lua、exact TTL / retry、deployment、WebSocket、crypto primitive、release tooling の実装詳細を要求していない。                                                               |

## 13. Validation Results

| Validation                                                             | 結果                                                                                                                                                                                                              |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revision / worktree                                                    | `git status --short --branch` と revision 確認を行い、開始時に `main...origin/main`、対象 revision `778c3bcd7da22d212e0d8d04397abb33b0461d9f`、worktree clean を確認した。                                        |
| Target Markdown formatter                                              | `mise exec -- pnpm exec prettier --check docs/specifications/relay.md` を実行し、成功。                                                                                                                           |
| Review artifact formatter                                              | 作成後に `mise exec -- pnpm exec prettier --write docs/reviews/specifications/relay-review-003.md`、続けて `mise exec -- pnpm exec prettier --check docs/reviews/specifications/relay-review-003.md` を実行する。 |
| Whitespace                                                             | review artifact 作成後に `git diff --check` を実行する。                                                                                                                                                          |
| Markdown table structure                                               | 対象本文と review artifact の全 pipe table について delimiter と row column 数を確認する。                                                                                                                        |
| Repository-local links / paths                                         | review artifact と参照した対象文書の repository-local link / path の存在を確認する。                                                                                                                              |
| Finding ID / severity / status                                         | RLS-001、SR-001、SR-002 の ID、current Skill の severity / status、Previous / Current、Required / Optional / Deferred の分類を確認する。                                                                          |
| Review Gate / Final Decision                                           | SR-001 の Critical blocking status により、failed gate と `REVISE SPECIFICATION` が一致することを確認する。                                                                                                       |
| Implementation / build / E2E / real Relay / Mobile / release evaluator | **Not validated**。今回の Specification Review の対象外であり、実装修正、build、実 Relay、実 Mobile、実ネットワーク、wallet-core および evidence evaluator は実行していない。                                     |

## 14. Review Gates

| Gate                  | 判定                 | 根拠                                                                                                                                                                                             | 対応                                                                |
| --------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1. 目的と範囲         | **Pass**             | Relay の untrusted transport scope、Mobile / Web / SDK / wallet-core との責任、対象外の実装詳細が明確である。                                                                                    | なし                                                                |
| 2. 契約               | **Fail — SR-001**    | Relay-local “delivery disposition” と Signer-originated `deliveryDisposition` / `DELIVERY_UNKNOWN` の field / authority 境界が一意でなく、public result contract の誤実装を許す。                | SR-001 を修正する。                                                 |
| 3. 処理と例外         | **Fail — SR-001**    | response delivery failure、transport unknown、ACK / consumed と Signer delivery semantics の関係を本文だけで一意に処理できない。                                                                 | failure / result / recovery mapping を明示する。                    |
| 4. 内部整合性         | **Fail — SR-001**    | §3 の Relay-local definition、§13.3 の `DELIVERED`、§14.1 / §14.3 の unknown wording が上流の Signer-only authority と衝突し得る。                                                               | 用語と authority を分離する。                                       |
| 5. 検証可能性         | **Fail — SR-001**    | `SUCCEEDED + PENDING / DELIVERED / DELIVERY_UNKNOWN`、`RESULT_UNKNOWN`、transport observation、ACK / consumed を相互に区別する conformance 判定が一意でない。                                    | acceptance / traceability に non-generation 条件を追加する。        |
| 6. 安全性と相互運用性 | **Fail — SR-001**    | known signed result の disposition を transport failure から作成・破棄・書換えできる読み方は、result recovery と SDK / Handoff interoperability を損なう。                                       | Signer-originated value を byte / meaning preserving に通過させる。 |
| 7. 上流整合性         | **Pass with SR-002** | Handoff、Interfaces、Signing Protocol、SDK、Requirements、Design を参照しており、主たる責任分界は一致する。Mainnet / four-condition の Relay-side non-authority の明示追跡は改善余地として残る。 | SR-002 を非blocking の同期改善として扱う。                          |

Gate 2〜6 の Critical blocking issue が残るため、Minor の SR-002 が解消されていても `READY` にはできない。

## 15. Remaining Risks and Open Decisions

- `SR-001` が修正されるまで、Relay-local `delivered` / unknown observation と Signer-originated `deliveryDisposition` の誤マッピング、ACK / consumed からの誤った `DELIVERED` 生成、transport failure からの誤った `DELIVERY_UNKNOWN` 生成を実装レビューで安全に排除できない。
- `SR-002` は現在の本文が Relay に signing / Mainnet authority を与えていないため直ちに authority 逆流を示すものではないが、共通 four conditions と Mainnet gate を Relay 本文から追跡する検証可能性を弱める。
- `OPEN-RELAY-001`〜`OPEN-RELAY-005` は残るが、generation format、storage / deployment、resume、retry policy、resource operations の未決定を実装詳細のまま維持しており、今回の Final Decision を追加で悪化させる finding とはしない。
- `response_available` から cancel 可能な範囲の表記は Handoff の lifecycle clarification 待ちであり、Relay が独自の state branch を発明しないことを前提に deferred とする。

## 16. Automatic Changes

なし。レビュー中に変更したのは本成果物だけである。`docs/specifications/relay.md`、Requirements、Design、他 Specification、ADR、source、tests、README および過去 review artifact は変更していない。レビュー成果物の作成・stage・commit・push はこの成果物に限定する。

## 17. Final Decision

`REVISE SPECIFICATION`

- **RLS-001:** `Resolved`。ACK / cancel の valid-shape `204`、条件付き mutation、no-op、existence hiding、terminal / generation / state-loss semantics に回帰はない。
- **SR-001:** `New / Critical`。Relay transport observation と Signer-originated `deliveryDisposition`、`DELIVERY_UNKNOWN`、`DELIVERED`、`RESULT_UNKNOWN` の生成 authority と意味保存を明示的に分離するまで blocking。
- **SR-002:** `New / Minor`。four conditions と Mainnet release / evidence gate の Relay 非権限、fail-closed、Testnet-only 継続を acceptance / traceability へ追跡する同期改善。直接の authority 逆流は確認していない。

新規 finding は Critical 1 件、Major 0 件、Minor 1 件である。Relay の opaque / untrusted transport boundary、secret 分離、ACK / cancel semantics、generation / replay / retention / privacy、automatic re-sign / fallback に重大な回帰は確認していない。`RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の authority については SR-001 の重大な明確化不足が残る。Mainnet gate と four-condition authority が Relay に逆流する直接記述はないが、本文の明示追跡が不足している。Specification phase boundary の逸脱は確認していない。

Review Gate は 2〜6 が SR-001 により不合格であり、Final Decision は `REVISE SPECIFICATION` とする。これは実装 build、実 Relay / Mobile、E2E、wallet-core または release evidence evaluator の検証済み判定ではない。
