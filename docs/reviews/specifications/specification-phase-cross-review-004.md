# Specification Phase Cross Review 004

## Review Target

- **対象:** 単一 Chain Profile 方針を反映した Specification 工程の変更
- **確認日:** 2026-09-20
- **対象仕様:** `product-spec.md`、`profile-account-spec.md`、`chain-compatibility-spec.md`、`mobile-app.md`
- **対象コミット:** `aad0d87`、`84006c6`
- **レビュー範囲:** `CR-017` / `CR-AC-020` の追跡、Profile の Chain 固定、Account / default Account / permission の同一 Chain 境界、Symbol / NEM の別 Profile 利用、backup の適用範囲、既存の Chain / Network / wallet-core 責任境界、下流仕様の表現整合性
- **未確認範囲:** 実装・テスト・fixture への適合、Design の更新後の最終整合、既存データの移行・互換性、将来 backup capability、外部 wallet-core の内部契約

## Execution Audit

- Reviewer A として、Profile / Account の入力、状態、データ例、禁止条件、受け入れ条件、Requirements への追跡を確認した。
- Reviewer B として、Profile 作成、Account 管理、Symbol / NEM の併用、Mobile の Profile binding、backup の適用範囲および利用者から観測できる結果を確認した。
- Reviewer C として、Chain / Network binding、Account / signing authority、secret boundary、wrong-chain 防止、fail-closed、wallet-core / Chain Compatibility の責任境界および検証可能性を確認した。
- サブエージェントは使用していない。Chair が3観点を独立に走査し、候補を統合した。

## Evidence Used

| 資料                                                            | 用途                                                                                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `docs/requirements/requirements.md`                             | `CR-017`、`CR-AC-020`、既存の Profile / Account / Chain / Network 境界、移行・互換性を現行開発範囲に含めない判断の確認 |
| `docs/reviews/requirements/requirements-review-007.md`          | Requirements 判定 `READY`、`REQ7-001` の対象、下流 Specification で解消すべき旧契約の確認                              |
| `docs/design/architecture.md`、`docs/design/security-design.md` | Application Profile / Account、Chain / Network、wallet-core、secret および signing authority の責任境界の確認          |
| `docs/specifications/profile-account-spec.md`                   | Profile の `chain` 固定、単一 Account、default Account、invariant、backup owner および traceability の確認             |
| `docs/specifications/product-spec.md`                           | Product terminology、作成・管理フロー、logical model、MVP acceptance、traceability の確認                              |
| `docs/specifications/chain-compatibility-spec.md`               | chain-specific Account 導出と別 Profile 前提の確認                                                                     |
| `docs/specifications/mobile-app.md`                             | Mobile の Profile / Account / Scope binding と acceptance の確認                                                       |
| `aad0d87`、`84006c6`                                            | Specification Author の実変更範囲と追補変更の確認                                                                      |

## Review Result

**READY**

## Summary

`CR-017` と `CR-AC-020` は、Profile を一つの Network と一つの Chain に作成時から固定し、Symbol と NEM の両方を利用する場合は別 Profile を使用する外部契約へ具体化されている。旧 `enabledChains`、同一 Profile の Symbol / NEM Account、Profile 作成後の Chain 追加・変更、Chain ごとの default Account は対象仕様から除去され、Product、Profile、Chain Compatibility、Mobile の記述も同じ境界へ整合している。

レビュー対象に Gate 不合格となる Critical finding はない。Design 側の Profile / Account 境界の明文化と、実装・テストでの mixed Profile 防止確認は次工程へ引き継ぐ。

## Finding Status

| Finding | Severity | Status | 初出レビュー | 今回の状態根拠                                                      |
| ------- | -------- | ------ | ------------ | ------------------------------------------------------------------- |
| なし    | —        | —      | —            | Gate 不合格または任意改善として登録する新規 formal finding はない。 |

## Required Changes

なし。`Critical` の New / Open / Reopened finding はない。

## Optional Improvements

なし。実装・テストへ引き継ぐ確認事項は `Deferred Findings` に記録する。

## Resolved Findings

### `REQ7-001` — 旧 mixed Profile 契約の Specification 残存

- **対象箇所:** `profile-account-spec.md` §3、§4、§5、§6、§7、§9、§11、§12、§16、§24、§26、`product-spec.md` §4、§7.2、§7.4、§9、§10、§15、§18、`mobile-app.md` §6.1、§20、`chain-compatibility-spec.md` §2.2。
- **確認事実:** Profile は `chain: 'symbol' | 'nem'` を一つだけ持ち、作成後に変更できない。HD Account Set、import Account、default Account、backup 候補、logical model、Mobile binding および acceptance は Profile.chain へ限定される。両 Chain の利用は別 Profile と明記されている。
- **完了条件:** `enabledChains`、同一 Profile 内の Symbol / NEM Account、Profile 作成後の Chain 追加・無効化・復元、Chain ごとの default Account および同一 Profile 前提の Chain compatibility 表現が、今回の対象仕様から除去されている。

## Upstream Feedback

### Design への引継ぎ: Profile / Account の単一 Chain 境界

- **送信元フェーズ:** Specification Review
- **受領すべき上流フェーズ:** Design
- **対象となる正式資料 / decision:** `docs/design/architecture.md` §6、§13、§16 および関連 Security Design
- **不足・曖昧さ・矛盾:** 現行 Design は Application の Profile / Account、Chain-specific Software Key および Chain / Network binding を定めているが、今回承認された「一つの Profile は一つの Chain に固定する」責務境界を一つの設計判断として明示していない。
- **下流への影響:** 次の Design Author は Profile metadata、Account association、permission、active context、wallet-core Profile 対応を単一 Chain Profile 前提へ追跡し、同一 Profile に異なる Chain を関連付ける設計余地を残さない必要がある。
- **non-normative status:** 本記録は Design への確認依頼であり、新しい Requirement、Design Decision または Specification contract ではない。現行 Specification は Requirements と既存 Design の責務境界を維持したまま安全にレビューできるため、Specification Gate を阻害しない。
- **解消条件:** Design Author が `CR-017` / `CR-AC-020` と本 Specification の Profile.chain、Account、permission、signing context の対応を `docs/design/` の正式資料へ反映し、Design Review で追跡可能と判定すること。

## Deferred Findings

- 実装工程で、Profile 作成時の Chain 固定、Profile.chain と Account.chain の一致、異なる Chain の Account / permission の関連付け拒否、mixed Profile を success としないこと、Profile 切替時の approval / authorization invalidation を確認する。
- 実装工程で、既存実装に残る `enabledChains`、dual identity、Chain ごとの default Account または mixed Profile の保存形式を、現行開発範囲で新契約へ合わせる。既存データの migration / backward compatibility は追加しない。
- `OPEN-PROFILE-001` の backup format、crypto、restore verification、migration compatibility は未決のままであり、本変更で close していない。現行 Browser Extension milestone の実装必須事項にも含めない。
- 外部 wallet-core の key derivation、Wallet Store、secret processing、raw signing の内部実装および exact binding contract は本レビューの対象外である。

## Scope and Traceability

| 領域                          | Requirements / Design                                                       | 現行 Specification / owner                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Profile の Chain 境界         | `CR-017`、`CR-AC-020`、Architecture の Profile / Account boundary           | `profile-account-spec.md` §3、§11、§26、`product-spec.md` §4、§7、§10、§18。Profile は一つの Network と一つの Chain に固定                                       |
| Account / identity            | `CR-005`、`CR-009`、`CR-017`、Security Design の signing authority boundary | `profile-account-spec.md` §4、§10〜§12、`product-spec.md` §10、§15。Account の Chain は Profile.chain と一致し、外部公開 identity は既存 Interfaces owner を参照 |
| Chain / Network compatibility | `CR-005`、`CR-NFR-005`、Chain Compatibility Design                          | `chain-compatibility-spec.md` §2。Chain-specific 導出と network validation は Chain Compatibility、Profile association は Profile / Account Specification        |
| Mobile binding                | `CR-017`、`CR-AC-020`、Mobile Design                                        | `mobile-app.md` §6.1、§6.2、§20。Mobile は selected Profile.chain を request Scope / Account / signer と照合                                                     |
| Backup / migration boundary   | `CR-014`、`OPEN-PROFILE-001`                                                | `profile-account-spec.md` §16〜§18、§27、`product-spec.md` §9.1、§20.1。将来 capability として owner / OPEN を参照し、現行 mixed backup migration は追加しない   |

## Domain Checks

| Check                               | 判定 | 根拠                                                                                                                                                                                                    |
| ----------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API / data contract                 | Pass | `WalletProfile.chain`、`HdAccountSet.account`、単一 `defaultAccountId`、logical model の `chain` / `identity` が mixed Profile の field を置き換え、外部 Provider / common API を新設していない。       |
| Validation / error / state          | Pass | Profile.chain の作成時固定、Account.chain の一致、最後の Account / HD Account Set の禁止、invariant および invalid import 時の no-mutation を確認できる。具体的 error code は既存責務へ委譲されている。 |
| Security / secret boundary          | Pass | 別 Chain の秘密情報、Account、default 設定および権限を一つの Profile に保持しないこと、wallet-core が秘密処理を所有すること、backup format を未決のまま保つことを確認できる。                           |
| Chain / network interoperability    | Pass | Symbol / NEM と Mainnet / Testnet を混同せず、Chain-specific 導出を維持し、同じ mnemonic / index を別 Profile で使用しても Account / Key Identity を分離する契約になっている。                          |
| Malformed / wrong-chain input       | Pass | Profile.chain と Account.chain の不一致を登録不可とし、wrong-chain identity reuse を禁止している。具体的 parser / Wallet Core validation は対象 owner へ委譲されている。                                |
| Fail-closed / atomic visible result | Pass | invalid mnemonic / identity は Profile / Vault / Account list を変更せず、mixed Profile は成立させず、異なる Chain の署名成功を許可しない受け入れ条件がある。                                           |
| Traceability / verifiability        | Pass | `CR-017` / `CR-AC-020` が Profile、Product の両 traceability table と Requirements Review の `REQ7-001` へ追跡でき、Mobile / Chain Compatibility の下流表現も整合している。                             |

## Validation Results

| Validation                                          | 結果                                                                                                                                                                                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target revision / worktree audit                    | **Pass**。`aad0d87`、`84006c6` の差分と対象仕様を確認し、レビュー成果物作成前の worktree は clean だった。                                                                                                                                      |
| Specification search for old mixed Profile contract | **Pass**。対象 `docs/specifications/` で `enabledChains`、`SymbolとNEMの両方`、`有効チェーン`、`identities.symbol`、`identities.nem`、`DefaultAccountIds` の残存を確認しなかった。                                                              |
| Review artifact Markdown formatter                  | **Pass**。`./node_modules/.bin/prettier --write docs/reviews/specifications/specification-phase-cross-review-004.md` と `./node_modules/.bin/prettier --check docs/reviews/specifications/specification-phase-cross-review-004.md` を実行した。 |
| Whitespace / staged diff                            | **Pass**。`git diff --check` を実行した。                                                                                                                                                                                                       |
| Lint / typecheck / test / build / runtime / E2E     | **Not applicable / skipped**。今回の変更は仕様・レビュー文書であり、実装適合性は次工程で確認する。                                                                                                                                              |

## Review Gates

| Gate                           | 判定     | 根拠                                                                                                                                                              | 対応 |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1. Purpose / scope             | **Pass** | Product、Profile、Chain Compatibility、Mobile が対象 Chain の単一 Profile 境界、両 Chain 利用時の別 Profile、現行 backup / migration の範囲を一意に示している。   | —    |
| 2. Contract                    | **Pass** | Profile、Account、default Account、logical model、Profile / Account / Scope binding、禁止される混在を確認できる。                                                 | —    |
| 3. Processing / failure        | **Pass** | 作成時の Chain 選択、作成後変更禁止、Account / identity mismatch の拒否、最後の Account / HD Account Set の保護、wrong-chain success の禁止を確認できる。         | —    |
| 4. Internal consistency        | **Pass** | Product、Profile、Chain Compatibility、Mobile の旧 `enabledChains` / mixed Profile 表現を除去し、`Profile.chain` へ統一している。                                 | —    |
| 5. Verifiability               | **Pass** | `CR-AC-020`、MVP acceptance、Profile invariants、Mobile conformance、traceability table により単一 Chain、別 Profile、no-mixed state を独立確認できる。           | —    |
| 6. Security / interoperability | **Pass** | Chain / Network binding、Account authority、secret boundary、別 Profile の identity 分離、wallet-core / Chain Compatibility ownership、fail-closed を確認できる。 | —    |
| 7. Upstream consistency        | **Pass** | `CR-017` / `CR-AC-020` と Requirements Review `READY` に整合し、Design への明文化依頼は non-blocking の Upstream Feedback として分離している。                    | —    |

## Remaining Risks and Open Decisions

- Design 文書は次工程で単一 Chain Profile の責務境界を明文化する必要がある。
- 現行実装が新しい Profile / Account 契約に適合しているか、mixed state の生成・保存・署名拒否が機械的に検証できるかは未確認である。
- Profile backup / restore は `OPEN-PROFILE-001` の未決事項であり、既存 mixed backup の移行・互換性を今回決定していない。

## Automatic Changes

なし。レビュー中は対象 Specification、Requirements、Design、実装およびテストを変更していない。レビュー成果物のみ新規作成する。

## Final Decision

`READY`

単一 Chain Profile の Specification 契約は Requirements から追跡可能で、Critical finding なしに実装・Design 整合工程へ進められる。Design の明文化、実装適合、mixed state の拒否および未決 backup contract は次工程へ引き継ぐ。
