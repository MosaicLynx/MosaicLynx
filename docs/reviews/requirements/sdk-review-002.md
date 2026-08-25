# MosaicLynx SDK 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/sdk.md`
- 確認日: 2026-08-25
- 判定: `READY`
- 対象範囲: SDK 固有要求 `SDK-FR-*`、`SDK-SEC-*`、`SDK-PRIV-*`、`SDK-PLAT-*`、`SDK-COMP-*`、`SDK-ERR-*`、`SDK-NFR-*`、受け入れ条件、未決事項、共通要件および Web handoff 仕様との整合性
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Browser Extension / Mobile / Relay 要件、Architecture、Product Specification、Chain Compatibility Specification、Web Transaction Handoff Specification、Wallet Core の参照資料を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または要求からの引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

現行の SDK 要件は仕様化へ進められる状態である。SDK を Signer と区別し、秘密情報、承認 UI、Wallet Core、Relay server、announce を SDK の責任外に置いている。接続許可と署名承認、Browser の実 Origin と Mobile / Relay の handoff session、要求・承認・結果、Symbol / NEM、Mainnet / Testnet の境界も明示されている。

`SDK-FR-007` と `SDK-AC-004` は message signing を SDK v1 の必須 operation として確定し、既存の Web handoff 仕様 §2 および `signData` 契約と整合している。`SDK-AC-003`、`SDK-AC-005`〜`SDK-AC-008` は Caller / Origin、正常な cross-transport 結果、失敗分類および自動 retry / fallback 禁止を外部から確認できる形で追跡している。

前回レビュー `sdk-review-001` の指摘は、次のとおり現行版で解消または適切に反映されている。

- message signing の v1 必須範囲を確定し、未決事項 `SDK-OPEN-001` を除去している。
- Browser の実 Origin / browser context と Mobile / Relay の handoff session / caller の最終検証主体を分離し、検証不能時の安全側結果を定めている。
- Success と九つの失敗分類を外部アプリケーションが区別できること、および拒否・検証失敗・result unknown の自動 retry / fallback 禁止を受け入れ条件へ反映している。
- transaction signing と message signing の正常系について、要求、operation、signer、Account、Chain / Network、correlation および Signer の確認・承認対象との対応を cross-transport で検証する受け入れ条件を追加している。

## 指摘事項

重大度 `ERROR` / `WARN` に該当する未解決指摘はない。`NIT` も、仕様化を妨げる曖昧さとしては確認されなかった。

| 指摘 ID | 重大度 | 状態   | 内容                                                                                               |
| ------- | ------ | ------ | -------------------------------------------------------------------------------------------------- |
| なし    | —      | CLOSED | 現行文書の要求、根拠、責務境界、受け入れ条件および未決事項に、仕様化を停止させる未解決事項はない。 |

## 未決事項・下流引継ぎ

`SDK-OPEN-002`〜`SDK-OPEN-007` は未解決の不備ではなく、要件から仕様・設計へ引き継ぐ判断事項として妥当である。特に次を仕様化前に確定する必要がある。

- Aggregate / multisig / cosignature の SDK 公開範囲。
- Transport の選択順、明示的代替経路および unavailable / connection failure / timeout の扱い。
- Transaction construction helper の責務。
- 正式対応 runtime、配布形態、versioning、backward compatibility および deprecation policy。
- platform 固有の Caller / Origin binding と、SDK が外部へ表明できる保証範囲。

これらは、対応しない operation を capability 上 unavailable とし、別 operation への silent downgrade や安全境界の迂回を許さないという現行要件の制約下で決定する必要がある。

## 確認できた整合事項

- `docs/requirements/requirements.md` の `CR-007` / `CR-007-MSG` と、Web handoff 仕様 §2 の transaction / message signing の v1 範囲が整合している。
- `SDK-FR-005`、`SDK-SEC-004`、`SDK-PLAT-002`〜`003` および `SDK-AC-003` が、Browser と Mobile / Relay の caller 検証主体を適切に分離している。
- `SDK-FR-008`、`SDK-FR-009`、`SDK-NFR-003`、`SDK-AC-005`〜`006` が、正常結果を含む cross-transport の対応確認を要求している。
- `SDK-FR-011`、`SDK-ERR-001`、`SDK-AC-007`〜`008` が、成功、拒否、未接続・許可不足、入力不正、未対応、検証失敗、result unknown を含む失敗境界を追跡している。
- `SDK-SEC-001`、`SDK-SEC-007`〜`008`、`SDK-PRIV-001`〜`003` および `SDK-AC-009` が、秘密情報・credential・payload・診断情報の境界を明示している。
- `SDK-FR-012`、`SDK-NFR-002`、`SDK-AC-010`〜`012` が、Symbol / NEM、Mainnet / Testnet、固定 compatibility、malformed input および secret leakage の検証可能性を維持している。
- Mobile App が現在のワークスペースに実装済みであると誤認させず、提供開始後の検証結果だけを受け入れる記述になっている。

## Validation

- `pnpm exec prettier --check docs/requirements/sdk.md docs/reviews/requirements/sdk-review-002.md`: 成果物作成後に実行する。
- `git diff --check`: 成果物作成後に実行する。

## Not validated

- 本レビューは要件・仕様・責務境界の文書レビューであり、SDK、Provider、Relay、Mobile App の実装変更や実装テストは行っていない。
- Mobile App は現在のワークスペースに実装されていないため、Mobile / Relay の実機連携、App Link、Origin proof、Mobile E2E は検証していない。
- Relay の Redis integration、Mainnet release evidence の生成・署名・検証、外部公式資料との追加照合は実行していない。

## 参照資料

- `docs/requirements/sdk.md`
- `docs/requirements/requirements.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/relay.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/design/architecture.md`
- `docs/adr/0001-mainnet-evidence-lite.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
- `docs/reviews/requirements/sdk-review-001.md`
