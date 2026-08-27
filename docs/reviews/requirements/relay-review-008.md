# MosaicLynx Relay Requirements フル再レビュー

## 1. Review Target

- 対象: [`docs/requirements/relay.md`](../../requirements/relay.md)
- 確認日: 2026-08-27
- 成果物: `docs/reviews/requirements/relay-review-008.md`
- レビュー種別: requirements-review Skill 復元後の独立した初回フル再レビュー
- 上位 Concept: [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)
- 上位 Common Requirements: [`docs/requirements/requirements.md`](../../requirements/requirements.md)
- 最新 Concept review: [`concept-sheet-review-003.md`](../concept/concept-sheet-review-003.md)
- 最新 Common Requirements review: [`requirements-review-006.md`](requirements-review-006.md)
- 過去 Relay reviews: `relay-review-001.md`〜`relay-review-007.md`
- 使用 Skill: [`requirements-review/SKILL.md`](../../../.agents/skills/requirements-review/SKILL.md)

過去レビューの READY は正しさの根拠にせず、finding の履歴、再発および状態追跡にのみ使用した。今回は `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、未決事項、traceability、共通要件および下流資料との整合を、現行文書に基づき独立に確認した。

レビュー対象は Relay Requirements の要件品質である。Relay protocol、SDK、実装およびテストは、用語、責任境界、traceability、明白な資料間矛盾の確認に限定して使用した。要件本文、Concept、Design、Specification、実装コードおよび既存レビュー成果物は変更していない。

## 2. Execution Audit

現行 `requirements-review` Skill と、参照された review-common playbook、reviewers、review-gates、output-format を適用した。サブエージェントは使用せず、メインエージェントが Review Board Chair として Reviewer A / B / C の観点を独立した走査に分けて確認した。

### Phase 0: 対象・根拠・境界

- 対象、上位資料、最新上位レビュー、過去 Relay review の最大番号および成果物の次番号を確定した。
- 前段レビューの判定と finding 状態を確認し、過去主張を現行要件の根拠として再利用しなかった。
- Source はレビュー中に変更せず、成果物だけを新規作成する境界を確定した。

### Phase 1: 独立レビュー

- Reviewer A: Relay 要求の MUST / SHOULD / MAY、責任、範囲、受け入れ条件、traceability、opaque envelope と structural / semantic validation の分離、内部整合性を確認した。
- Reviewer B: 一般ユーザーの署名価値、Browser / Mobile Signer、dApp / SDK、Relay の milestone と責任、transaction signing / message signing の範囲、Relay と v1 完了境界を Concept と照合した。
- Reviewer C: secret、transport credential、E2E secret、generation / state loss、retry / fresh approval、bounded retention、failure、failure-closed、Common Requirements の `CR-015`、`CR-016`、`CR-NFR-013` との整合および wallet / announce 境界を確認した。

### Phase 2〜3: 反証・統合・判定

- 各候補について、対象本文または承認済み上流資料への直接追跡、現在の影響、Requirements レベルで必要な修正か、下位フェーズで決めてよい事項かを反証した。
- 過去 RREQ finding の再発、解消、下位委譲を整理し、単なる実装未反映や具体方式の未決を新規 Requirements finding にしなかった。
- 8 つの正式 Review Gate、finding 状態、成果物の Markdown、リンク、見出し、ID、Source 非変更および `git diff --check` を検証した。

## 3. Evidence Used

- 対象本文: [`relay.md`](../../requirements/relay.md)
- 上流: [`concept-sheet.md`](../../concept/concept-sheet.md)、[`requirements.md`](../../requirements/requirements.md)
- 上位レビュー: [`concept-sheet-review-003.md`](../concept/concept-sheet-review-003.md)、[`requirements-review-006.md`](requirements-review-006.md)
- 過去 Relay review: `relay-review-001.md`〜`relay-review-007.md`。finding ID と状態の追跡に使用した。
- 兄弟要件: [`mobile-app.md`](../../requirements/mobile-app.md)、[`browser-extension.md`](../../requirements/browser-extension.md)、[`sdk.md`](../../requirements/sdk.md)
- 整合確認・下流引継ぎ: [`architecture.md`](../../design/architecture.md)、[`web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)、[`docs/design/relay.md`](../../design/relay.md)、[`docs/specifications/relay.md`](../../specifications/relay.md)、[`release/`](../../release/)
- 実装・テストの整合確認: `apps/relay/`、`packages/relay-protocol/`、`packages/sdk/src/mobile-relay.ts` および関連テスト。これらの実装未反映を Relay Requirements の欠陥や検証済み要件の代替とは扱っていない。
- 実行規約: [`project-context.md`](../../../.agents/project-context.md)、現行 requirements-review Skill および参照 playbook / reviewers / gates / output-format

下流資料の message signing、generation、opaque envelope、credential、retention、failure の記載は、対象要件の責任境界と引継ぎの明白な矛盾確認に用いた。API、schema、暗号パラメータ、storage、state machine、実装ライブラリを Requirements の不足として要求していない。

## 4. Review Result

**READY**

Relay は Signer ではない非署名 handoff 基盤として、transaction signing / message signing の必須範囲、opaque envelope と structural validation の境界、secret / credential 分離、generation / state loss、bounded retention、安全側失敗および正常系 handoff を Requirements レベルで判定できる。過去 RREQ finding の再発、Critical の New / Open / Reopened finding、Requirements フェーズ逸脱は確認されなかった。

## 5. Summary

Relay は dApp / Mobile Signer 間の受け渡しだけを担い、Signer の Trust Boundary 外に置かれる。Relay は署名、transaction / message の意味解釈・表示、利用者の最終承認、署名秘密情報の処理、announce、長期履歴サービスを担わない。Mobile Signer が復号・semantic validation・確認・承認・署名を行い、dApp が結果を独立検証する責任分界は Common Requirements と整合している。

`RR-001` / `RR-002` と `RR-AC-009` / `RR-AC-010` により、transaction signing と message signing の両方が Relay milestone の必須 handoff 範囲として明確である。`connect`、`refreshActiveAccount`、`disconnect` は SDK / Mobile 契約、`cosignTransaction` は optional / existing SDK contract として Relay milestone の必須範囲から分離されている。

`RR-003` と `RR-AC-006` は、Relay が opaque envelope の外形、size、expiry、version、authorization、correlation、lifecycle 等を structural / transport validation として扱える一方、plaintext の復号、transaction / message semantics、Signer 表示内容、semantic validation、承認および署名を扱わない境界を直接判定可能にしている。

`RR-006`、`RR-NFR-003`、`RR-AC-003`、`RR-AC-011` は、generation / state loss 後の旧 state・identity の復活を禁止し、old ciphertext の一時保存自体を Relay に過去履歴で検出させず、App の E2E validation による no-approval / no-sign / no-success と fresh retry を要求する。durable payload / ciphertext history は要求されていない。

`RR-008`、`RR-NFR-004`、`RR-AC-006` は signing secret、Relay endpoint authorization credential、E2E session secret / derived encryption material、verified client-side handoff を別分類し、credential / secret の不要な URL、log、diagnostics、analytics、telemetry、persistent history への露出を防ぐ。`RR-NFR-005` と `RR-AC-012` は failure、result unknown、Relay unavailable、retry を success と混同しない最低保証を定める。

未決事項は exact handoff contract、failure の分類粒度、具体的な protocol / API / crypto / storage / retention / operation の実装契約に限定され、最低保証を弱めない形で下位フェーズへ委譲されている。Relay Requirements は READY と判定するが、Requirements フェーズ全体は継続中であり、SDK の復元後レビューが残っている。

## 6. Finding Status

現行要件に対する正式な active finding はない。

| 区分                          | Severity                               | Status                         | 初出 / 履歴        | 今回の状態根拠                                                                                                                   |
| ----------------------------- | -------------------------------------- | ------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| 新規 finding                  | —                                      | なし                           | 今回               | 要件レベルで採用すべき新規問題は確認されなかった。                                                                               |
| 過去 `RREQ1-001`〜`RREQ1-006` | Critical / Major 相当を含む旧 taxonomy | Resolved                       | `relay-review-001` | message signing、credential、bounded retention、traceability、正常系 handoff、failure 下限は現行本文で確認でき、再発なし。       |
| 過去 `RREQ2-001`〜`RREQ2-004` | 旧 taxonomy                            | Resolved                       | `relay-review-002` | opaque envelope、state loss、MAY と milestone 下限は現行本文で確認でき、再発なし。                                               |
| 過去 `RREQ3-001`〜`RREQ3-002` | 旧 taxonomy                            | Resolved                       | `relay-review-003` | structural validation と semantic validation の分離、message signing 対象化後の注記整合を確認でき、再発なし。                    |
| 過去 `RREQ4-001`〜`RREQ4-002` | 旧 taxonomy                            | Resolved                       | `relay-review-004` | endpoint credential と E2E secret、verified client-side handoff、structural failure の境界を確認でき、再発なし。                 |
| 過去 `RREQ5-001`〜`RREQ5-003` | 旧 taxonomy                            | Resolved                       | `relay-review-005` | `appToken` の分類、state loss 後の責任分離、Relay milestone operation 範囲を確認でき、再発なし。                                 |
| 過去 `RREQ6-001`〜`RREQ6-002` | 旧 taxonomy                            | Resolved / lower-phase handoff | `relay-review-006` | Relay structural rejection と App E2E rejection の責任分離、実装未反映を要件適合 evidence としない下流委譲を確認でき、再発なし。 |

現行の Formal finding は `RR` prefix、`Critical` / `Major` / `Minor` severity、`New` / `Open` / `Resolved` / `Deferred` / `Reopened` status を使用する。今回の `RR` Formal finding は 0 件である。

## 7. Required Changes

なし。Critical または Major の New / Open / Reopened finding はない。

## 8. Optional Improvements

なし。Minor の New / Open / Reopened finding もない。過去 finding の内容を、表現上の好みだけで再採番していない。

## 9. Resolved Findings

過去 `RREQ1-*`〜`RREQ6-*` は、現行文書において次の要件境界が確認できるため再発なし・Resolved と扱う。

- message signing は Relay v1 の必須 handoff 範囲であり、下流仕様の対象範囲と一致する。
- Relay は E2E opaque envelope と必要最小限の metadata / transport authorization 情報のみを扱い、structural validation と Mobile / dApp の semantic / client-side validation を分離する。
- signing secret、endpoint authorization credential、E2E session secret / derived encryption material は別分類であり、verified client-side handoff の credential 非露出条件がある。
- bounded retention、terminal 後の再利用不能、durable payload / ciphertext history を要求しない state-loss 境界が MUST / Acceptance Criteria へ追跡されている。
- generation / state loss 後の旧 identity / session の復活禁止、old ciphertext の一時保存と App の署名前拒否の責任分離、fresh retry / fresh approval が明記されている。
- failure、result unknown、Relay unavailable、expiry、validation failure、retry を success / approval / signing outcome と混同しない最低保証がある。
- traceability 表により、各 `RR-*` / `RR-NFR-*` が上流、適用主体、整合確認資料、下流引継ぎ、Acceptance Criteria へ追跡される。

上記は今回の現行本文との照合結果であり、過去レビューの READY 判定を再利用したものではない。

## 10. Deferred Findings

現行の Relay Requirements に対する Deferred Formal finding はない。次の未決事項と下流引継ぎは、Requirements の最低保証を満たすための具体化であり、今回の READY 判定を阻害しない。

- `RR-OPEN-001`: transaction signing / message signing の handoff contract、operation ごとの具体的結果形式、Relay milestone の個別完了詳細。operation の必須範囲自体は確定している。
- `RR-OPEN-002`: Relay unavailable、expiry、result unknown、validation failure、retryable failure の外部可視な分類粒度。expiry、result unknown、validation failure の success 非扱いと fresh retry の下限は確定している。
- Relay protocol の endpoint、schema、transport、credential token、generation / epoch の具体表現、E2E envelope、AAD、digest、暗号方式、storage、TTL、purge、retry interval、state transition、インフラ構成および fault-injection test。
- `REQ4-001`〜`REQ4-003` は Common Requirements review に記録された別管理の Deferred / non-blocking 事項として扱いを維持する。wallet-core 固定参照、message signing handoff alignment、message format / encoding / canonicalization、UI 詳細を Relay Requirements の blocker へ昇格させない。
- 現行 `apps/relay`、`packages/relay-protocol`、SDK 実装・テストの generation-aware contract 未反映は、下流実装・仕様・テストで確認すべき事項であり、Relay Requirements の上流欠陥とは判定しない。

## 11. Scope and Traceability

上流から下流への追跡は次のように確認できる。

`Concept → Common Requirements → Relay Requirements → Relay protocol / Web handoff / Design / Implementation`

| 確認対象                                   | Relay Requirements での追跡                                                                                                                                                                       | 判定 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Relay の製品上の役割                       | Concept の Mobile Signer と外部主体を接続する非署名基盤を §1〜§2、`RR-001`〜`RR-002`、対象外、AC へ具体化                                                                                         | PASS |
| Browser / Mobile Signer、dApp / SDK、Relay | Common `CR-011`、`CR-015`、`CR-016`、`CR-NFR-013` を継承し、Relay §2、`RR-003`、`RR-009`、`RR-AC-006`〜`RR-AC-008` で Relay が Signer / approval authority にならないことを確認                   | PASS |
| transaction signing / message signing      | Common `CR-007` / `CR-007-MSG` から `RR-001`、`RR-002`、`RR-AC-009`、`RR-AC-010` へ追跡。`RR-OPEN-001` は具体 contract のみ未決                                                                   | PASS |
| opaque envelope                            | `RR-003`、`RR-AC-002`、`RR-AC-006` から downstream handoff / protocol の opaque envelope へ追跡                                                                                                   | PASS |
| structural / semantic validation           | Relay の外形・size・expiry・authorization・lifecycle・correlation と Signer / dApp の plaintext / semantic / approval validation を `RR-003`、`RR-005`、`RR-006`、`RR-AC-006`〜`RR-AC-008` で分離 | PASS |
| secret / credential                        | Common `CR-008` / `CR-NFR-002` と Concept §13 から `RR-008`、`RR-NFR-004`、`RR-AC-006` へ追跡。signing secret、endpoint credential、E2E secret、verified handoff を混同しない                     | PASS |
| generation / state loss / retry            | Common `CR-NFR-010` / `CR-NFR-011` / `CR-NFR-012` から `RR-006`、`RR-NFR-003`、`RR-AC-003`、`RR-AC-011` へ追跡                                                                                    | PASS |
| failure / result unknown                   | Common `CR-010` / `CR-012` と `CR-AC-015` から `RR-004`、`RR-NFR-002`、`RR-NFR-005`、`RR-AC-001`、`RR-AC-012` へ追跡                                                                              | PASS |
| 下流フェーズ境界                           | API、schema、crypto、storage、infra、detailed state、implementation library は下流へ委譲し、本文は MUST、responsibility、constraint、precondition、failure、external acceptance に留める          | PASS |

Relay は Browser Extension / Mobile Signer の検証・認証・認可・承認・署名条件を成立、更新、代替または迂回する主体として定義されていない。SDK は dApp 側の連携接点、Relay は非署名 transport であり、Signer の管理境界外からの入力を Signer が無条件に信頼しない Common Requirements の継承を弱めていない。

## 12. Domain Checks

| 観点                             | 結果 | 確認内容                                                                                                                                                                                                                       |
| -------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 要件完全性                       | PASS | handoff request / result、transaction / message signing、integrity、replay / duplicate / late delivery、generation、retention、failure、secret separation、DoS / availability の必要な品質特性を含む。                         |
| 利用者価値と範囲                 | PASS | 一般ユーザーが Mobile Signer で確認・承認する中心価値を Relay が支え、Relay 自身を wallet / signer / custody service に拡張していない。Relay 完了が v1 全体完了という上位境界も維持する。                                      |
| 責任境界                         | PASS | Mobile が復号・検証・意味解釈・表示・承認・署名、dApp が結果を独立検証・announce、Relay が transport / structural boundary を担う。SDK は Signer ではない。                                                                    |
| MUST / SHOULD / MAY              | PASS | security boundary、Acceptance Criteria、milestone 完了条件を MAY で免除せず、可用性のために安全条件を弱めない。実質的な SHOULD はなく、MUST の下限が明確である。                                                               |
| transaction / message 相互運用性 | PASS | 両 operation を必須範囲とし、結果を別 operation の成功へ変換しない。Chain / Network / Account と operation の対応を `RR-AC-009` / `RR-AC-010` で確認する。                                                                     |
| opaque / structural validation   | PASS | Relay は outer shape、size、expiry、version、authorization、correlation、lifecycle 等を検証できるが、plaintext / semantics / Signer summary を扱わない。                                                                       |
| Trust Boundary                   | PASS | Relay は trust anchor ではなく、Relay の応答・保存状態・delivery・availability だけで署名を成立させない。Relay 侵害時も Mobile の確認・承認境界を維持する。                                                                    |
| secret / credential              | PASS | signing secret と endpoint credential を分離し、E2E session secret / derived encryption material を Relay に受信・復号・保持・導出させない。verified client-side handoff の不要な露出も禁止する。                              |
| generation / state loss          | PASS | current generation binding、旧 generation / identity の失効、old session の復活禁止、old ciphertext の client-side 拒否、fresh retry と fresh approval が検証可能である。durable payload / ciphertext history は要求されない。 |
| retention                        | PASS | handoff に必要な bounded period を越える保持、履歴・分析・ユーザーアカウントサービス化、terminal 後の有効再利用を禁止する。具体 TTL / purge は下位へ委譲する。                                                                 |
| failure safety                   | PASS | outage、timeout、state loss、validation failure、result unknown、Relay unavailable、expiry、replay、duplicate、late delivery を success / approval / signing outcome と混同しない。                                            |
| Mainnet / announce boundary      | PASS | Mainnet release gate は共通 / release 文書へ追跡され、Relay は announce、node 選択、継続的 network state を担わない。                                                                                                          |
| Requirements フェーズ境界        | PASS | endpoint、API signature、schema、wire format、exact crypto、storage、state machine、infra、test implementation を固定せず、下流へ明示的に委譲する。                                                                            |

## 13. Validation Results

- `pnpm exec prettier --write docs/reviews/requirements/relay-review-008.md`: 実行済み、成功。
- `pnpm exec prettier --check docs/reviews/requirements/relay-review-008.md`: 実行済み、成功。
- Markdown の 17 セクション構成、章順、見出しおよび表の整合: 成功。
- repository 内リンク: 対象本文、上位資料、上位レビュー、Skill、下流参照資料および過去レビューのリンク先を確認し、成功。
- heading / anchor: 17 の正式見出しを順序どおり確認。fragment anchor を含む参照はなく、内部見出し構成に問題なし。
- finding ID 重複: 現行 Formal finding 0 件。過去 `RREQ1-*`〜`RREQ6-*` は履歴表で重複なく追跡し、新規 `RR` ID は採番していない。
- 既存レビュー非上書き: `relay-review-001.md`〜`relay-review-007.md` を変更していない。
- Source 非変更: `docs/requirements/relay.md`、上位・下流資料、実装コードおよびテストを変更していない。
- `git diff --check`: 成功。
- repository-wide formatter / lint / test / build: 未実行。今回の変更はレビュー成果物のみであり、現行 review 手順の対象外である。Relay production、Redis integration、Mobile 実装、release evidence、Apple / Android platform capability の実行検証も行っていない。

## 14. Review Gates

| Gate                | 判定 | 根拠                                                                                                                                                                                                                   | 対応 finding |
| ------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1. 目的と課題       | PASS | dApp と Mobile Signer 間の transaction / message signing handoff という目的と、Relay の可用性より署名安全性を優先する理由が §1〜§2、`RR-001`〜`RR-004` にある。                                                        | なし         |
| 2. 利用者と責任     | PASS | Mobile Signer、dApp / SDK、Relay、利用者の役割と、Relay が署名・承認・secret handling・announce を担わない責任が明確である。                                                                                           | なし         |
| 3. 対象範囲         | PASS | transaction / message signing の必須 scope、非署名 Relay、非対象 operation、対象外の API / infra / crypto 詳細および v1 milestone 境界を区別している。                                                                 | なし         |
| 4. 要件と制約       | PASS | opaque envelope、structural validation、credential / E2E secret 分離、generation、bounded retention、failure、DoS / availability、下流委譲を MUST / 制約として識別できる。                                             | なし         |
| 5. 受け入れ条件     | PASS | `RR-AC-001`〜`RR-AC-012` が outage、tamper、structural failure、generation / state loss、normal transaction / message handoff、secret non-exposure、retention、failure distinction を外部から確認できる。              | なし         |
| 6. 内部整合性       | PASS | Relay の非署名責任、opaque / structural と semantic の分離、secret / credential 分類、generation / fresh retry、bounded retention、failure 下限が本文・AC・traceability で一致する。                                   | なし         |
| 7. 不可欠な前提     | PASS | Mobile / dApp が client-side validation / approval / result verification を担い、Relay が必要な transport state だけを bounded に扱う前提が明記される。具体 protocol / deployment の未決は下位へ適切に委譲されている。 | なし         |
| 8. コンセプト整合性 | PASS | Concept の一般ユーザー中心価値、Signer と Relay の分離、transaction / message signing、Relay milestone と v1 完了境界、秘密情報分離、announce 非責任を維持している。前段レビューに未解決 Critical はない。             | なし         |

FAIL Gate はなく、FAIL Gate に対応する正式 finding もない。

## 15. Remaining Risks and Open Decisions

- `RR-OPEN-001` / `RR-OPEN-002` の具体 contract、failure 粒度、milestone 詳細条件は下位で確定する。本文の最低保証を弱める変更は許容されない。
- generation-aware endpoint / schema / AAD / protocol / SDK / Relay implementation / fault injection の実装 evidence は、要件レビューとは別に下流レビューで確認する。現行実装の未反映を本レビューの Requirements finding にはしていない。
- exact TTL、purge、tombstone、storage、multi-instance consistency、credential verification、E2E envelope および retry policy は下位の Design / Specification / Operations で決定する。
- `REQ4-001`〜`REQ4-003` は Common Requirements の Deferred / non-blocking 状態を維持する。これらは Relay の現在の安全境界や handoff 必須 scope を弱めない。
- SDK の復元後レビュー、ならびに下流 Design / Specification / Implementation の実装適合性確認が残っている。Relay Requirements の READY は Requirements フェーズ全体の完了を示さない。

## 16. Automatic Changes

なし。レビュー中に Source、Concept、Design、Specification、実装、テストおよび既存レビュー成果物への自動修正は行っていない。作成したのは本成果物のみである。

## 17. Final Decision

過去 RREQ finding の再発はなく、現行 Formal finding は 0 件、8 つの Review Gate はすべて PASS である。Relay Requirements は、Signer でない opaque / untrusted handoff 基盤として仕様設計へ進められる品質を満たす。

**READY**

この判定は Relay Requirements 単体の判定であり、Requirements フェーズ全体の完了判定ではない。SDK の復元後レビューを継続する。
