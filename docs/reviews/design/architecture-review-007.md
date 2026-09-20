# Architecture Design Review 007

## Review Target

- **対象:** [Architecture Design](../../design/architecture.md) の単一 Chain Profile 境界反映
- **確認日:** 2026-09-20
- **対象コミット:** `204b4c2`
- **関連確認:** `security-design.md`、`interfaces.md`、`browser-extension.md`、`mobile-app.md`、`signing-flow.md` の同一方針への整合
- **レビュー範囲:** `CR-017` / `CR-AC-020` の設計追跡、Profile / Account / permission の責務、Chain / Network separation、signing authority、Profile switch lifecycle、Browser / Mobile host、wallet-core / Chain integration 境界、下流 handoff
- **未確認範囲:** API、wire format、暗号パラメータ、wallet-core 内部契約、具体的 error code、実装・テスト・fixture・runtime、既存データの migration / backward compatibility

## Execution Audit

サブエージェントは使用せず、Review Board Chair が次の4パスを独立に実施した。

| Pass            | 確認結果                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer A 相当 | Architecture、Security、Interfaces、Browser、Mobile、Signing Flow の Profile / Account、component responsibility、dependency direction、trust boundary を確認した。 |
| Reviewer B 相当 | Mnemonic、private key、Wallet Store、signing authority、Profile-local context、Account authorization、Chain / Network separation、fail-closed を確認した。          |
| Reviewer C 相当 | Profile creation / switch、pending request、approval、authentication、authorization、restart / lifecycle invalidation および別 Chain 利用時の運用境界を確認した。   |
| Reviewer D 相当 | `CR-017` / `CR-AC-020`、Profile / Account Specification、Chain Compatibility、Browser / Mobile downstream handoff、traceability table を確認した。                  |

## Evidence Used

| 資料                                                                                                             | 確認目的                                                                                       |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `docs/requirements/requirements.md`                                                                              | `CR-017`、`CR-AC-020`、単一 Chain Profile、別 Profile 利用、no-mixed state の根拠              |
| `docs/reviews/requirements/requirements-review-007.md`                                                           | Requirements `READY`、`REQ7-001` の下流引継ぎ、既存 migration / compatibility を追加しない判断 |
| `docs/specifications/profile-account-spec.md`、`product-spec.md`、`chain-compatibility-spec.md`、`mobile-app.md` | Profile.chain、Account、permission、Chain-specific identity、backup scope の下流契約           |
| `docs/design/architecture.md`                                                                                    | 対象 Design の責務、依存、trust boundary、Profile invariant、§17.1 traceability                |
| `docs/design/security-design.md`、`interfaces.md`、`browser-extension.md`、`mobile-app.md`、`signing-flow.md`    | 関連設計の security invariant、Profile-local context、Signer authority、lifecycle、下流整合    |
| `architecture-review-006.md`、既存関連 Design Review                                                             | 過去の判定状態の continuity 確認のみ。過去 finding を自動的に継承していない                    |

## Review Result

**READY**

## Summary

Architecture は、Application Profile を作成時に一つの Chain / Network へ固定し、Account、default Account、permission、approval、authentication、signing authorization および result を同一 Profile の Chain に限定する設計へ更新されている。Symbol と NEM の両方を利用する場合は Chain ごとに別 Profile を使用し、Profile switch 時には旧 context を失効させる責任が Application / Signer にあることが確認できる。

Security、Interfaces、Browser、Mobile、Signing Flow も同じ Profile-local context と Account authorization の境界へ追跡されており、wallet-core の cryptographic identity / secret ownership、Chain integration の semantic inspection、Signer の approval / signing authority を混同していない。Critical、Major、Minor の新規 formal finding は確認しなかった。

## Finding Status

| ID   | Severity | Status | 初出レビュー | 今回の状態根拠                                                      |
| ---- | -------- | ------ | ------------ | ------------------------------------------------------------------- |
| なし | —        | —      | —            | Gate 不合格または任意改善として登録する新規 formal finding はない。 |

## Required Changes

なし。Critical の New / Open / Reopened finding はない。

## Optional Improvements

なし。

## Resolved Findings

### Requirements `REQ7-001` の Design 反映

- **対象箇所:** Architecture §3、§6.6、§13、§17.1、Security Design §6、§17、Interfaces §3.3、§6、Browser Extension Design §5.4、Mobile App Design §9、Signing Flow §3、§9、§23、§24。
- **確認事実:** Application Profile の固定 Chain / Network、異なる Chain の Account / permission / authorization の関連付け禁止、両 Chain 利用時の別 Profile、Profile switch に伴う lifecycle invalidation が責務・invariant として定義されている。
- **完了条件:** Specification の `Profile.chain`、単一 Account、別 Profile 利用、no-mixed acceptance と各 Design の Profile-local context / signer gate が相互に追跡できるため、Requirements Review からの Design 引継ぎを解消した。

## Upstream Feedback

なし。Requirements は `CR-017` / `CR-AC-020` と `CR-AC-020` の拒否・no-success 条件を提供しており、現行 Design を安全に評価できる。

## Deferred Findings

- 実装工程で、Profile 作成時の Chain 固定、Profile.chain と Account.chain の一致、異なる Chain の Account / permission の保存・authorization 拒否、Profile switch に伴う pending authorization の失効を確認する。
- wallet-core Profile / Store と Application Profile の対応、opaque Store の migration、具体的な Binding ownership / error mapping は既存外部契約と OPEN に委譲する。Application が wallet-core Store の内部を解釈しない境界は維持する。
- API、wire、暗号、具体的 error、parser、runtime lifecycle、既存データ migration / backward compatibility は本 Design Review の対象外であり、下位工程で確認する。既存 mixed Profile / backup の互換機能は現行開発範囲に追加しない。

## Scope and Traceability

| 領域                                   | Requirements / Specification                                                                                        | Design の適用                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile の単一 Chain 境界              | `CR-017`、`CR-AC-020`、`profile-account-spec.md` §3、§11、§26、`product-spec.md` §4、§18                            | Architecture §3、§6.6、§13、§17.1、Security Design §6、§17                                                                                                    |
| Account / permission / signing context | `CR-005`、`CR-009`、`CR-016`、`CR-017`、`CR-AC-020`、Profile / Account Specification §11、Product Specification §10 | Interfaces §3.3、§6、Browser Extension §5.4、Mobile App §9、Signing Flow §9、§16、§23                                                                         |
| Chain-specific identity                | Chain Compatibility Specification §2、Architecture §6.7、§13                                                        | wallet-core は cryptographic identity / secret / raw signing owner、Chain integration は semantic inspection、Signer は Profile / Account authorization owner |
| Lifecycle / stale context              | `CR-NFR-009`〜`CR-NFR-011`、`CR-AC-013`、`CR-AC-014`、Interfaces / Signing Flow の lifecycle invariant              | Architecture §6.9、Interfaces §6、Browser Extension §7、Mobile App §14〜§16、Signing Flow §7、§21、§23                                                        |
| Backup / migration boundary            | `CR-014`、`OPEN-PROFILE-001`                                                                                        | Architecture §2.2、§17、Mobile / Profile Design の OPEN。現行 Profile 境界を弱める migration / compatibility を設計へ追加しない                               |

## Domain Checks

| 観点                                      | 判定 | 根拠                                                                                                                                                                                                                         |
| ----------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context / responsibility / trust boundary | Pass | Application / Signer が Profile、Account、permission、approval、authorization を所有し、wallet-core は cryptographic identity、Wallet Store、secret processing、raw signing を所有する。Relay と SDK は authority ではない。 |
| Dependencies / direction                  | Pass | Application / host から chain integration / wallet-core へ責務が流れ、wallet-core へ UI、caller、permission、approval の責務を逆流させていない。                                                                             |
| Main flows / lifecycle                    | Pass | Profile switch、lock、Account / permission change、Chain / Network change で pending authorization / approval / result context を失効させ、古い context を別 Profile へ流用しない。                                          |
| Protected assets / secret ownership       | Pass | Mnemonic、private key、Profile password、decrypted Store は untrusted boundary へ出さず、Profile の metadata / permission と wallet-core の opaque Store / secret ownership を分離している。                                 |
| Authentication / signing authority        | Pass | Profile.chain と Account / permission / authorization の一致を Application / Signer が確認し、四条件を同一 context へ binding する。wallet-core success は代替条件ではない。                                                 |
| Failure / fail-closed                     | Pass | wrong Chain、stale、unknown、mismatch、解析不能および security failure は Signer が署名・success result へ進めない設計である。                                                                                               |
| Chain / network separation                | Pass | Symbol / NEM、Mainnet / Testnet、Profile、Account、Chain-specific identity を同一 Profile に暗黙統合せず、両 Chain は別 Profile context へ分離する。                                                                         |
| Downstream handoff                        | Pass | Profile.chain、単一 Profile、Account.chain 一致、別 Profile、Profile switch invalidation が Specification と実装検証へ引き渡せる。詳細 API / wire / crypto は正しい owner へ委譲されている。                                 |

## Validation Results

| 検証                                                | 結果                                                                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target revision / worktree audit                    | **Pass**。対象コミット `204b4c2` の Design 差分を確認し、レビュー成果物作成前の worktree は clean だった。                                            |
| Design document formatting                          | **Pass**。`./node_modules/.bin/prettier --write` / `--check` を Architecture、Security、Interfaces、Browser、Mobile、Signing Flow の6文書へ実行した。 |
| Whitespace                                          | **Pass**。`git diff --check` を実行した。                                                                                                             |
| App / package lint、typecheck、test、build、runtime | **Not applicable / skipped**。Design 文書だけの変更であり、実装適合性は Implementation Review で確認する。                                            |

## Review Gates

| Gate                           | 判定     | 根拠                                                                                                                                                      | 対応 |
| ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1. 目的と範囲                  | **Pass** | Profile / Account / Signer の責務と、backup / migration / wallet-core の対象外境界が維持されている。                                                      | —    |
| 2. Context / responsibility    | **Pass** | Application Profile、Signer、chain integration、wallet-core、SDK、Relay の authority と非 authority が明確である。                                        | —    |
| 3. Dependencies / direction    | **Pass** | cryptographic identity / secret ownership は wallet-core、semantic inspection は chain integration、approval / authorization は Signer に分離されている。 | —    |
| 4. Main flows                  | **Pass** | Profile selection、Profile switch、approval、pre-sign binding、stale / restart / lifecycle loss の責任を追跡できる。                                      | —    |
| 5. Data ownership              | **Pass** | Application metadata / permission、public identity、opaque Store、Mnemonic / private key の境界と lifecycle owner が確認できる。                          | —    |
| 6. Security / interoperability | **Pass** | single Chain Profile、wrong Chain / Network 防止、four-condition gate、Relay non-authority、wallet-core boundary が維持されている。                       | —    |
| 7. Upstream consistency        | **Pass** | `CR-017` / `CR-AC-020`、Requirements Review `READY`、Specification Review `READY` および既存 Design の責任境界と整合する。                                | —    |
| 8. Downstream implementability | **Pass** | Profile.chain、Account.chain 一致、別 Profile、no-mixed authorization、Profile switch invalidation が実装・検証へ引き渡せる。                             | —    |

## Remaining Risks and Open Decisions

- 現行実装が旧 mixed Profile model をどこまで保持しているか、実装適合性は未確認である。
- wallet-core の opaque Store と Application Profile の exact mapping、Binding error / ownership、backup / migration は既存 OPEN / 外部契約へ委譲する。
- Mobile App は現在の workspace に実装されておらず、Mobile Design の runtime 適合、実機、OS capability は未検証である。

## Automatic Changes

なし。レビュー中は Design、Requirements、Specification、実装およびテストを変更していない。レビュー成果物のみ新規作成する。

## Final Decision

`READY`

単一 Chain Profile の設計判断は責務、trust boundary、lifecycle、security invariant、Chain / Network separation および下流 handoff へ一貫して反映されている。Critical finding なしで Implementation 工程へ進める。
