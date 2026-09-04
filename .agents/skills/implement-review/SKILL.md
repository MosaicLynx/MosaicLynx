---
name: implement-review
description: >-
  MosaicLynx の TypeScript 実装、Extension、SDK、Relay、chain adapter、backup / protocol package、
  テスト、fixture、差分を、仕様適合、security、Symbol / NEM 相互運用性、責務境界、異常系、
  テスト品質の観点でレビューする。コードは修正しない。
---

# Implementation Review Board

承認済み仕様、要件、設計および既存の安全性境界を、実装が実際に満たしているかを判定する。
source code、テスト、fixture、依存、公開 export、Extension / Provider / Relay の境界まで確認するが、
レビュー中にコード、仕様、テスト、fixture、README、設定を修正しない。設計の好みや仕様外の
機能追加を指摘へ変換しない。

Implementation Review は、`Specification: what exact behavior must be observed` に対して、
`Implementation Review: does the actual code satisfy that contract safely?` を確認する。既存の
security invariant、protected asset の機密性・完全性、trust boundary、cryptographic primitive の
安全条件、TypeScript / JavaScript / Binding 境界の安全条件を破る具体的な defect は、仕様に個別の
防御手段が列挙されていなくても指摘する。これは新しい要求ではなく、既存の安全性を破る実装欠陥の確認である。

## 作業開始時に読む資料

1. `AGENTS.md`
2. `../review-common/review-playbook.md`
3. `reviewers.md`、`review-gates.md`、`output-format.md`、`security-checklist.md`
4. 対象の差分、対象 app / package の `package.json`、`tsconfig.json`、公開 export、`src/`、テスト、fixture、build script
5. 対応する `docs/specifications/`、`docs/requirements/`、`docs/design/`、適用可能な ADR
6. `docs/specifications/chain-compatibility-spec.md` と必要な公式 protocol / schema / SDK 資料
7. 外部 wallet-core / Binding が差分または契約対象に含まれる場合だけ、その外部 repository instructions と契約

`AGENTS.md` に対象フェーズの Phase Context が登録されている場合だけ、初期探索と共通前提の把握に
利用する。Context は正式資料の代替や単独の finding 根拠にせず、正式資料と競合した場合は正式資料を優先する。

## 対象と成果物

- ユーザーが明示した app、package、ファイル、機能、差分、commitだけを対象にする。
- MosaicLynx の実装対象は `apps/*` と `packages/*`。`_snwc` は外部 wallet-core であり、対象に明示されない限り root の差分として扱わない。
- 対象が曖昧なら範囲を推測で広げず、対象確認で終了する。
- 変更範囲、直接の依存、対応仕様・要件・設計、関連テストを確定する。
- 成果物は `docs/reviews/implementation/<ベース名>-review-NNN.md` に新規作成する。既存成果物や仕様フィードバックを移動・削除・上書きしない。正式 ID は IR 接頭辞で連番にする。

## 根拠の範囲

差分、実装、テスト、fixture、承認済み仕様、要件、`docs/design/`、適用可能な ADR、必要な公式資料を
照合する。既存コードやテストがそうなっていることだけを、仕様や protocol の根拠にしない。
未確認の external node、network、registry、長時間テスト、Browser runtime、外部 Binding runtime は
成功扱いにしない。秘密情報、復号データ、credential を成果物や出力へ含めない。

## レビュー観点

- 承認済み仕様・要件・設計への適合と外部可視動作
- 入力検証、validation、error、warning、atomicity、replacement Store、failure path
- `security-checklist.md` に基づく、対象変更に適用可能な protected asset、secret lifecycle、secret ownership、暗号、乱数、署名、Wallet Store、parser、Extension / Provider、Relay、外部 Binding、failure atomicity、依存、テスト、known vector の確認
- 秘密情報のログ・例外・error・warning・不要なコピーへの漏えい、JavaScript runtime 上の boundary、具体的な cryptographic misuse
- 暗号、KDF、AEAD、AAD、nonce、salt、署名対象、canonical bytes、serialization、および custom cryptographic arithmetic
- Symbol / NEM、Mainnet / Testnet、SDK と protocol、address / key / signature の表現
- TypeScript の型・公開互換性・依存、Extension の privileged boundary、Provider / dApp origin、Relay の opaque payload、外部 Binding の型・ownership境界
- 正常、malformed、boundary、wrong password / chain / network、truncated、duplicate、tamper、unknown version、deterministic、interop のテスト

仕様にない API、設定、error、fallback、互換動作、将来拡張、一般論だけの防御、任意の hardening は
指摘しない。private key / Mnemonic の漏えい、不要な secret copy、nonce reuse、RNG failure、AEAD
認証結果の無視、仕様と違う signing bytes、攻撃者入力による例外・resource exhaustion、Extension / SDK /
Relay / 外部 wallet-core の境界違反、Symbol / NEM または Mainnet / Testnet の混同による誤署名など、
既存の security property を具体的に破る defect は指摘する。仕様が曖昧で正否を決められない場合は、
実装欠陥と `Specification ambiguity` / `Specification gap` / `Implementation → Specification feedback` を分離する。

## 実行と検証

`../review-common/review-playbook.md` の Phase 0〜3 を適用する。Reviewer A〜D を別パスで確認し、
各候補を根拠・影響・完了条件で反証してからゲートを適用する。Reviewer B は secret、crypto、
JavaScript runtime、attack surface を深く確認し、変更から attack surface と secret path を先に特定して
`security-checklist.md` の該当項目だけを適用する。Reviewer C は canonical bytes、chain / network、
Symbol / NEM、protocol interoperability、Reviewer D は negative test、differential、known vector、
独立 oracle、fixture 品質で重複確認してよい。重複 finding は Chair が統合する。

仕様・設計・要件の不足や曖昧さは、発生源に応じた `Implementation Review → Specification / Design / Requirements`
の `Upstream Feedback` に記録し、`Deferred Findings` と混在させない。サブエージェントを使った場合だけ
実際の識別子と完了状態を監査情報へ記録し、使わない場合は自己レビューの4パスを記録する。

必要な非破壊検証は、ルート `AGENTS.md` の `## 検証` と対象の実際の script に従う。変更分類または
ユーザーが明示した検証範囲に該当する場合だけ、対象 package の test / typecheck、Extension build、
Relay integration、release evidence などを実行する。docs-only または agent / skill-only の差分では、
実装テストを自動実行せず、文書・Skill の構造、参照、Markdown、必要な validator、差分・状態を確認する。
対象変更がない検証は `NOT APPLICABLE / SKIPPED (no relevant change)` とし、レビューの failure とは扱わない。

## 判定

判定は `READY` または `REVISE IMPLEMENTATION` とする。

- `CRITICAL` / `HIGH` の New / Open / Reopened finding が1件以上ある場合は `Required Change` とし、`REVISE IMPLEMENTATION` とする。
- `MEDIUM` / `LOW` のみ、または解決済み・Deferred のみの場合は `Optional / non-blocking` とし、`READY` とできる。

重大度は、exploitability、reachability、protected asset への影響、precondition、trust boundary、recovery、
downstream effect を総合して判断する。単に暗号、秘密情報、外部 Binding を含むことだけを理由に
`CRITICAL` / `HIGH` としない。固定スコア方式や任意の coverage 数値目標を新設しない。

## 作業完了後の Git 運用

`../review-common/review-playbook.md` の「成果物と Git」を適用する。
