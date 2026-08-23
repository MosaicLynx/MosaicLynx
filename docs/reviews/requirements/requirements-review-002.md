# MosaicLynx 共通要件定義書 再レビュー

## レビュー情報

- 対象: `docs/requirements/requirements.md`
- 確認日: 2026-08-24
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: 修正後の共通要件、前回レビュー指摘への対応、上流コンセプトおよび下流仕様・platform / Relay 要件との整合
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独再レビュー。サブエージェントは使用していない。前回レビュー `requirements-review-001.md`、関連仕様、ADR、wallet-core 資料、platform / Relay 要件を照合した。
- 変更範囲: 本レビュー成果物のみを新規作成する。要件本文、仕様書、ADR、コードは変更していない。

## 総評

前回の主要な指摘は大きく改善されている。Signer と Relay の適用主体が分離され、Relay milestone の判定も受け渡し責任として整理された。要求元・許可範囲、要求内容の完全性、鮮度、replay / duplicate / late delivery、署名結果との対応が共通 MUST と受け入れ条件へ追加され、要求ごとの根拠・下流参照と成功時 / 失敗時の表も整備されている。wallet-core についても、具体的な Binding 方式は未決のまま、責任の正本範囲を明確にできている。Mainnet gate の fail-closed と既存 policy への追跡も改善されている。

ただし、現時点の判定は `REVISE REQUIREMENTS` とする。`CR-007` が全 Signer の v1 共通能力として message signing を要求する一方、現行の Web Transaction Handoff Specification は message signing を v1 対象外としており、同仕様内にも `signData` を含む記述がある。また、`CR-014` が Profile 全体 backup / restore を共通要件から外して将来扱いとする一方、Product Specification は Extension MVP の対応範囲として暗号化 backup export / import を定めている。いずれも要件本文単独ではなく、既存の上位・下流資料との責任範囲を決定する必要がある。

## 前回指摘の対応状況

- Relay と Signer の適用主体: `CR-011`、第3節の適用主体、`CR-AC-009` により改善済み。
- 認証・完全性・鮮度・replay 防止: `CR-NFR-008`〜`CR-NFR-012` と `CR-AC-011`〜`CR-AC-014` により要求化・受入条件化済み。
- wallet-core の統合境界: `CR-013` と `CR-OPEN-001` により、責任境界と具体的統合方式が分離された。
- 根拠追跡: 多くの要求に `根拠`、`下流`、`参考` が追加され、改善済み。
- Mainnet gate: `CR-NFR-006`、`CR-AC-008`、`OPEN-005` で既存 ADR / policy と fail-closed が追跡可能になった。
- 受け入れ条件: 関連要求、適用主体、成功時および失敗時の結果を持つ表へ改善された。なお、下記の残存する scope 競合は解消が必要である。

## 指摘

### REQ2-001 — `ERROR` — message signing の v1 共通要求が現行 handoff 仕様と競合している

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:74-75,150-175,371-381`
- 根拠: `CR-007`、`CR-007-MSG`、`CR-AC-006`、`CR-AC-015` は、Browser Extension、Android、iOS の全 Signer と dApp / transport を越えた v1 共通操作として message signing を要求している。一方、`docs/specifications/web-transaction-handoff-spec.md:13-20,29-38` は v1 対象外に「メッセージ署名」を明記している。同仕様は公開 API、Mobile Relay Adapter、論理要求には `signData` を含んでおり、仕様内部でも適用範囲が一致していない。Product Specification は Extension MVP に構造化メッセージ署名を含めている（`docs/specifications/product-spec.md:52-67,485-524`）。
- 影響: message signing を v1 の共通能力として Mobile / Relay handoff にも提供するのか、Extension 固有または後続 milestone の能力とするのかが決められない。現状のままでは、`CR-AC-006` と `CR-AC-015` を満たす実装が handoff 仕様の v1 対象外に違反する可能性がある。
- 必要な修正: 次のいずれかを決定する。
  1. message signing を v1 共通能力とする場合、handoff 仕様の対象外記載、milestone 必須範囲、`signData` 契約、Mobile App / Relay の受入条件を更新し、message signing の正本仕様を参照可能にする。
  2. message signing を全 Signer の共通能力としない場合、`CR-007`、`CR-007-MSG`、`CR-AC-006`、`CR-AC-015` を milestone 別または Extension 固有へ縮小し、未対応 operation の安全な失敗を共通要求として残す。

### REQ2-002 — `ERROR` — Profile 全体 backup / restore の共通要件外化が Product Specification の MVP 範囲と未整合

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:85-94,177-183,231-237,347-359,427-433`
- 根拠: `CR-014` は Profile 全体の backup / restore、export / import、migration 等を MosaicLynx v1 の共通 MUST / 共通完了条件に含めず、将来その機能を扱う段階で決定するとしている。しかし Product Specification は MVP 対応範囲に Profile の暗号化 backup export / import を含め（`docs/specifications/product-spec.md:52-67`）、9.1 では実装・復元検証・Mainnet Profile 削除との関係まで要求している（`docs/specifications/product-spec.md:207-215`）。`docs/specifications/profile-account-spec.md:360-424` も Profile 全体 backup / restore を要求する。
- 影響: wallet-core が Profile データの backup / migration を所有しないこと（`_snwc/docs/requirements/requirements.md:83-106`）と、MosaicLynx Product が backup を提供するかは別の論点である。現在の `CR-014` は wallet-core の責任外を理由に、Product Specification が要求する機能まで共通要件から将来扱いへ降格しているように読める。Browser Extension の要件には backup の実装要求がなく、MVP 機能の要件追跡も切れている。
- 必要な修正: Product Specification の MVP を維持するか、backup を将来機能へ変更するかを決定する。維持する場合は、共通要件から外すなら Browser Extension / Mobile 等のどの platform 要件が担当するか、Application が wallet-core の opaque Store と Profile metadata をどう扱うか、受入条件を下流要件へ追跡する。将来機能へ変更する場合は Product Specification、Profile / Account Specification、README 等の MVP / 受入記載を同時に整合させる。`FUTURE-001` は組織向け監査・統制・カストディ保証の事項であり、backup を将来化する根拠としては使用しない。

### REQ2-003 — `WARN` — message signing の具体化先に未存在の文書名・範囲が含まれている

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:165-175`
- 根拠: `CR-007-MSG` は message format、表示・解釈規則、canonicalization、認証用途 protocol を「後続の message signing / SSO / handoff 仕様」で定めるとしている。しかし現在の文書構成には独立した message signing 仕様または SSO 仕様がなく、`_snwc` の要件は認証・SSO 向けクライアントを v1 対象外としている（`_snwc/docs/requirements/requirements.md:93-106`）。
- 影響: message signing の目的が一般的な構造化メッセージ署名なのか、認証 / SSO protocol まで含むのかが拡張解釈される。これはコンセプトの一般ユーザー向け Signer の範囲を越える可能性があり、後続仕様の作成対象も特定できない。
- 必要な修正: 現在の v1 要求として必要な構造化メッセージ署名の範囲だけを記載し、SSO を要求・前提・具体化先に含める根拠がなければ削除する。必要な仕様の文書名と作成時期を `OPEN` または下流工程へ明示する。message signing の共通化を取り下げる場合は REQ2-001 と同時に整理する。

### REQ2-004 — `WARN` — 共通要件の「実装ライブラリを確定しない」と CR-013 の named component 正本化の関係を明記すべき

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:13,34-43,221-229,416-425`
- 根拠: 文書冒頭は「実装ライブラリを確定しない」とする一方、`CR-013` は `symbol-nem-wallet-core` を鍵管理・Wallet Store・秘密情報を使用する暗号処理・raw byte signing の正本として MUST で固定している。CR-OPEN-001 で未決なのは具体的な Binding / FFI / WASM / Native / 移行方式であり、正本範囲自体は確定済みと記載されている。
- 影響: 現状でも意図は読み取れるが、named component の責任契約まで未確定と誤解される余地がある。要件が固定していないのは MosaicLynx 側の実装ライブラリなのか、wallet-core との統合方式だけなのかが不明確になる。
- 必要な修正: 13行目を「MosaicLynx 側の API、データ形式、Binding / 実装方式を確定しない。ただし、承認済み外部コンポーネントである wallet-core の責任範囲は CR-013 で固定する」等に整理するか、CR-013 を外部契約への依存として明示する。実装方式を追加で決める必要はない。

### REQ2-005 — `NIT` — MUST NOT のスコープ除外と機能禁止を明確に区別すると誤読を防げる

- 状態: `OPEN`
- 対象: `docs/requirements/requirements.md:17-20,231-237,347-359`
- 根拠: `MUST NOT` は「対象範囲に含めてはならない要求または扱い」と定義され、`CR-014` は Profile 全体 backup / restore を共通完了条件に含めないことを表す。しかし Product / Mobile の資料には、platform 固有または条件付きで backup / restore を提供する記述が残っている。
- 影響: `CR-014` が「v1 で backup を実装してはならない」という機能禁止として読まれる可能性がある。共通要件から外すというスコープ判断と、Product 全体または platform 固有で提供する可能性を区別できない。
- 必要な修正: `CR-014` の見出しまたは本文を「共通要件・共通完了条件への非包含」と明記し、platform 固有要件で提供できる条件を決める。REQ2-002 の Product 範囲決定後に文言を確定する。

## 確認できた整合事項

- Signer、Relay、dApp の責任主体と、Relay が利用者判断・意味解釈・署名を担わない境界が明確になった。
- Relay milestone の完了を Relay 単体の署名機能ではなく、受け渡しによって Signer の安全条件を迂回させないこととして整理している。
- 要求元・許可範囲、完全性、鮮度、replay / duplicate / late delivery、署名結果対応が、方式を固定せずに共通要求として記録されている。
- wallet-core の正本範囲と Application の表示・承認・orchestration 責任が分離され、具体的 Binding 方式は設計へ委ねられている。
- Mainnet gate は ADR、evidence policy、release operational reference へ追跡され、gate 不成立・判定不能時の fail-closed が明記されている。
- 受け入れ条件に関連要求、適用主体、成功時と失敗時の状態が追加され、前回の要求単位の検証不足は大きく改善した。

## 未決定事項

1. message signing を v1 の全 Signer / Mobile Relay 共通能力とするか。現行 handoff 仕様の「対象外」記載、`signData` API 記載、Product Specification の Extension MVP 記載を同時に整合させる必要がある。
2. Profile 全体 backup / restore を Product MVP として維持するか。維持する場合は共通能力ではなく platform 固有要件へ追跡するのか、共通要件として扱うのかを決める。
3. `CR-007-MSG` が参照する message signing / SSO の具体化先と、SSO を v1 の範囲に含める根拠を決める。
4. `CR-013` の named component 正本化と、13行目の「実装ライブラリを確定しない」の文書上の関係を明確にする。

## 参照資料

- `docs/reviews/requirements/requirements-review-001.md`
- `.agents/project-context.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/specifications/profile-account-spec.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/relay.md`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `docs/adr/0001-mainnet-evidence-lite.md`
- `docs/evidence/evidence-policy.json`
- `docs/release/mainnet-release-evidence.md`

