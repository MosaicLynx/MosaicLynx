# MosaicLynx 共通要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/requirements.md`
- 確認日: 2026-08-24
- 判定: `READY`
- 対象範囲: 共通要件本文、共通の対象範囲、要求の根拠・適用主体、受け入れ条件、未決事項、前回レビュー指摘への対応
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。コンセプト、platform / Relay 要件、関連仕様、ADR、レビュー履歴、参照ファイルの存在を照合した。
- 変更範囲: 本レビュー成果物のみを新規作成する。要件本文、仕様書、ADR、コードは変更していない。

## 総評

現行の要件定義は、仕様化へ進められる状態（`READY`）と判定する。一般ユーザーの安全な署名判断を中心価値として、Signer、Relay、dApp、wallet-core の責任境界が分離され、Symbol / NEM と Mainnet / Testnet の区別、blind signing の禁止、秘密情報分離、Mainnet の fail-closed が共通要求として整理されている。

また、要求元・許可範囲、要求内容の完全性、鮮度、replay / duplicate / late delivery、署名結果との対応が MUST として追跡され、主要要求ごとに成功時と安全側失敗時の受け入れ条件がある。前回レビューで指摘された Relay の適用範囲、セキュリティ要求の導出、共通署名操作と OPEN-003 の関係、wallet-core の統合方式との境界も、現行本文では明示的に整理されている。

ただし、仕様化の開始前に、下記の非ブロッカー事項を引継ぎ資料へ記録する必要がある。これらは現行要件のスコープ・責任・安全原則を不成立にするものではないが、後続仕様で解消しなければ外部契約の整合性または根拠の再現性を損なう。

## 前回指摘の対応状況

- `REQ3-001`（Relay と Signer の適用範囲）: 対応済み。第1節、第3節、第4節、`CR-011` および `CR-AC-009` で、Relay には受け渡し境界だけを直接適用し、Signer の確認・承認・署名責任と分離している。
- `REQ3-002`（セキュリティ要求の導出）: 対応済み。第6節冒頭に安全原則からの導出を記載し、`CR-NFR-008`〜`CR-NFR-012` に個別の導出理由と下流参照がある。
- `REQ3-003`（共通署名操作と `OPEN-003`）: 対応済み。第3節および `OPEN-003` で、Browser Extension、Android、iOS の transaction signing / message signing と共通安全要求を確定済み範囲として明示し、個別完了条件を未決範囲として分離している。
- `REQ3-004`（wallet-core の責任範囲と実装方式）: 要件本文上は対応済み。`2.3`、`CR-013`、`CR-OPEN-001`、`CR-OPEN-002` で、wallet-core の正本範囲を制約として固定し、Binding / FFI / WASM / Native / React Native 連携などの統合方式を後続設計へ委ねている。

## 指摘事項

### REQ4-001 — `WARN` — wallet-core 採用制約の承認根拠と参照再現性を補強するとよい

- 状態: `NON-BLOCKING / OPEN`
- 対象: `docs/requirements/requirements.md:13,47-51,229-237,436-445`
- 根拠: 本文は `symbol-nem-wallet-core` の採用と責任範囲を「承認済みプロジェクト制約」として扱い、外部コンポーネント契約として `_snwc` の資料を参照している。現行リポジトリには `_snwc` の gitlink はあるが、サブモジュール本文が初期化されておらず、参照された requirements / specification / binding decision をローカルで確認できない。MosaicLynx 側の `docs/adr/` にも、この採用判断を識別できる ADR は確認できない。
- 影響: 要件本文の責任境界は理解できるが、第三者が「何が承認済みで、どの版の wallet-core 契約に依拠するか」を同じ checkout から再確認できない。wallet-core の外部契約と MosaicLynx の要件を混同したまま仕様化するリスクが残る。
- 必要な対応: 採用判断を既存の承認記録または ADR へ追跡し、参照する wallet-core commit / version を固定する。レビュー・仕様化時には `_snwc` サブモジュールを初期化して、本文が挙げる3資料を確認する。具体的な Binding 方式をこの要件へ追加する必要はない。

### REQ4-002 — `WARN` — message signing の下流契約を仕様化開始前に整合させる必要がある

- 状態: `NON-BLOCKING / DEFERRED TO SPECIFICATION ALIGNMENT`
- 対象: `docs/requirements/requirements.md:156-183,391-401`; `docs/specifications/web-transaction-handoff-spec.md:13-38,102-117,207-209`
- 根拠: 共通要件は Browser Extension、Android、iOS の各 Signer に transaction signing と message signing を v1 共通能力として要求している。一方、現行の Web Transaction Handoff Specification は v1 の対象外にメッセージ署名を記載しつつ、公開 API と Mobile Relay Adapter には `signData` を記載している。これは要件本文の不備というより、上流要件を受けた下流仕様の更新対象である。
- 影響: message signing を Mobile / Relay handoff へ含める範囲、構造化 message の正本仕様、`signData` の結果・失敗契約が確定しないままでは、`CR-AC-006` と `CR-AC-015` の仕様適合を判定できない。
- 必要な対応: 要件本文の v1 共通 MUST を維持するなら、handoff 仕様、Mobile / Relay の必須範囲、message signing の具体化先を更新する。範囲を縮小する判断をするなら、その判断に合わせて `CR-007`、`CR-007-MSG`、受け入れ条件および `OPEN-003` を変更する。要件本文だけを変更せず、関連契約を同時に整合させる。

### REQ4-003 — `NIT` — 受け入れ条件の「確認可能な影響」と message の適用条件は仕様で具体化する

- 状態: `TRACKED / OPEN-002 へ引継ぎ`
- 対象: `docs/requirements/requirements.md:112-120,171-181,385-402`
- 根拠: `CR-002`、`CR-007-MSG`、`CR-AC-001`、`CR-AC-006` は、利用者が確認できる影響や、Chain / Network / Account が message に適用される条件を要件レベルで示しているが、transaction type、message format、encoding、canonicalization、表示粒度は意図的に後続仕様へ委ねている。
- 影響: 仕様化前にこの境界を定義しないと、platform ごとに「確認可能」「適用される」の判定がずれ、共通署名接点の外部動作が一致しない可能性がある。
- 必要な対応: `OPEN-002` と message signing の後続仕様で、対応 format、適用される chain context、表示・解釈規則、表示不能時の拒否条件、承認対象と signing bytes の対応を定義する。要件定義へ具体的な API や暗号パラメータを追加する必要はない。

## 確認できた整合事項

- 第1節、第3節、第4節、`CR-011` により、共通要求は Signer の共通能力と、Relay を含み得る End-to-End の受け渡し境界に限定され、Relay 自身が利用者判断や署名を担わないことが明確である。
- `CR-001`〜`CR-012` と `CR-AC-001`〜`CR-AC-016` により、要求受付、確認、承認・拒否、失敗、外部主体の独立検証、要求と結果の対応が追跡できる。
- `CR-NFR-008`〜`CR-NFR-012` は、要求元、完全性、鮮度、再利用、結果対応を方式非依存の安全要求として整理し、Relay 固有要求 `RR-003`〜`RR-007` と接続している。
- `CR-NFR-005` は Symbol / NEM の導出、address、transaction、署名処理の暗黙共通化を禁止し、chain compatibility specification と固定 vector へ追跡している。
- `CR-NFR-006`、`CR-AC-008`、`OPEN-005` は Mainnet gate の不成立・判定不能時を fail-closed とし、Testnet-only での継続を許容している。
- `CR-014`、対象外範囲および Browser Extension 要件 `BR-014` により、Profile 全体 backup / restore を共通完了条件から外しつつ、個別 platform で提供する責任を失わせていない。
- `OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005`、`CR-OPEN-001`、`CR-OPEN-002` は、未決事項と確定要求・設計方式を区別している。

## 未決定事項・引継ぎ

1. `symbol-nem-wallet-core` の採用承認を、MosaicLynx 側の判断記録と固定 commit / version へ追跡する。
2. message signing を v1 全体の共通能力として扱う要件と、現行 handoff 仕様の対象範囲・`signData` 記載を整合させる。
3. `OPEN-002` で一般ユーザーが確認する影響、message format、chain context、表示不能時の外部動作を定義する。
4. `OPEN-003` で各 milestone の個別完了条件、次 milestone へ進む条件、platform 固有の依存関係を定義する。
5. `OPEN-005` で Mainnet gate を各 platform の release / security operation へ引き継ぐ。

## Not validated

- `_snwc` サブモジュール本文が未初期化のため、`_snwc/README.md`、`_snwc/docs/requirements/requirements.md`、`_snwc/docs/specifications/specification.md`、`_snwc/docs/decisions/binding-implementation.md` の内容はローカルでは検証していない。
- 本件は文書レビューのため、コード、仕様実装、wallet-core integration、Redis integration、Mainnet release evidence の実行検証は行っていない。

## 参照資料

- `docs/requirements/requirements.md`
- `docs/concept/concept-sheet.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/relay.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/chain-compatibility-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/architecture/architecture.md`
- `docs/adr/0001-mainnet-evidence-lite.md`
- `docs/evidence/evidence-policy.json`
- `docs/release/mainnet-release-evidence.md`
- `docs/reviews/requirements/requirements-review-001.md`
- `docs/reviews/requirements/requirements-review-002.md`
- `docs/reviews/requirements/requirements-review-003.md`
- `docs/reviews/concept/concept-sheet-review-001.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
- `.gitmodules`
