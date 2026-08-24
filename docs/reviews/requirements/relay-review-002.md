# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、Traceability、未決事項、共通要件および下流 handoff 仕様との整合
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Mobile / Browser Extension 要件、Architecture、Product Specification、Web Transaction Handoff Specification、Relay protocol / SDK / Relay 実装・テストおよび既存の `relay-review-001` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

Relay を Signer から分離し、障害、改ざん、差し替え、replay、重複配送、遅延配送、credential 漏えいおよび結果不明を意図しない署名へつなげない責任境界は、前回レビューより明確になっている。`RR-008` の署名秘密情報と transport credential の分離、`RR-NFR-003` の bounded retention、`RR-NFR-005` の安全側失敗分類、受け入れ条件および Traceability の追加も適切である。

ただし、現状は仕様化へ進めない。共通要件が transaction signing と message signing を v1 の確定 MUST としているのに対し、Web Transaction Handoff Specification は message signing を v1 対象外としており、下流文書の不整合が未解消である。また、Relay が E2E の opaque ciphertext だけを扱うべきことが、Relay 要件自身の検証可能な MUST として明示されていない。さらに、Relay の状態消失後に古い request を同じ session / request identity で再登録できないことが、要件として十分に閉じていない。

## 指摘事項

### RREQ2-001 — `ERROR` — message signing の v1 handoff 契約が下流仕様と未整合

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:23-25,52-66,212-217,244-250,261-267`、`docs/requirements/requirements.md:156-183,401,418-423`、`docs/specifications/web-transaction-handoff-spec.md:11-38,102-117`
- 根拠: 共通要件 `CR-007` / `CR-007-MSG` は transaction signing と message signing を各 Signer の v1 共通能力として確定し、Relay に必要な要求・結果の受け渡しを要求している。Relay 要件も `RR-001`、`RR-002`、`RR-AC-007`、`RR-AC-008`、`RR-AC-010` で両 operation を必須としている。一方、Web Transaction Handoff Specification の v1 対象外には「メッセージ署名」が残っている。同仕様の公開 API には `signData()` が存在するため、文書内でも対象範囲が一致していない。Relay 要件がこの不整合を認識し、下流仕様の修正を引き継いでいることは確認できるが、レビュー時点では契約が確定していない。
- 影響: Relay milestone が v1 適合となる operation 範囲、message signing の Mobile handoff、dApp の共通結果・失敗処理および完了判定を一貫して検証できない。transaction signing だけを実装した下流仕様を、現行の Relay 要件と同時に適合扱いできる余地が残る。
- 必要な修正: message signing を Relay v1 の確定必須範囲として維持するなら、Web Transaction Handoff Specification の対象外記載、対応範囲表、受け入れ条件、error / result 契約および関連テストを `CR-007-MSG`、`RR-001`、`RR-002`、`RR-AC-010` に整合させる。message signing を除外する場合は Relay 要件だけでなく共通要件、共通受け入れ条件、Mobile / Product の v1 範囲を同時に変更する必要があり、下流仕様を根拠に本要件を弱めてはならない。

### RREQ2-002 — `WARN` — Relay が E2E の opaque ciphertext を扱う要求と受け入れ条件が不足

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:23-27,38-48,54-58,62-72,184-200,206-217,221-240`、`docs/specifications/product-spec.md:91-95,554`、`docs/specifications/web-transaction-handoff-spec.md:456-498,500-513`
- 根拠: Product Specification は Mobile Relay が transaction を解析せず E2E 暗号文だけを短時間保管し、Relay 侵害への対策を E2E AEAD と capability 分離で行う前提を置いている。下流 handoff 仕様も request / response を暗号化 envelope とし、Relay は暗号文を復号しないと定める。しかし Relay 要件の「意味を解釈、解析、表示しない」「秘密情報を扱わない」は、平文の transaction / message / request / result を受信したうえで解釈だけしない実装も排除しない。`RR-AC-006` は署名秘密情報と credential の保護を確認するが、暗号文のまま扱うこと、平文 payload を Relay の API・storage・log・診断へ出さないことを直接確認しない。
- 影響: Relay が侵害された場合に、署名秘密情報ではない transaction 内容、message 内容、Origin、Account 等の handoff payload が Relay 運用者やログ基盤へ露出する実装でも、Relay 固有要件だけでは不適合と判定しにくい。Relay の責任境界と Product Specification の「E2E Relay」前提が要求段階で閉じない。
- 必要な修正: Relay は request / response の意味内容を復号・解釈せず、暗号化された opaque envelope と必要最小限の安全な metadata だけを扱うことを `MUST` として明記する。平文 payload、復号結果、暗号文の復元可能な記録を API response、active storage、backup、log、diagnostics、analytics / telemetry へ出さないことを要求し、`RR-AC-002`、`RR-AC-006`、`RR-AC-011` 等から確認できる受け入れ条件を追加する。暗号アルゴリズム、nonce、KDF 等の具体方式は本要件で固定する必要はない。

### RREQ2-003 — `WARN` — Relay 状態消失後の古い request identity 再登録に対する保証が不十分

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:74-86,99-109,150-158,206-217,252-257`、`docs/requirements/requirements.md:397-400`、`docs/specifications/web-transaction-handoff-spec.md:534-545,579-594`
- 根拠: `RR-004`、`RR-006`、`RR-NFR-003` は再起動・内部状態消失後の古い pending request、replay、再利用および追加署名を禁止し、`RR-AC-003`、`RR-AC-011` も再起動後の古い状態の再出現・再利用不能を受け入れ条件にしている。しかし、状態消失後に同じ `session ID`、`request ID`、credential または暗号化 request を新規作成 APIへ再送した場合に、それを新しい handoff として受理してよいのか、また参加者側が必ず新しい署名要求として扱えるのかは明記されていない。下流仕様の session 作成時の一意性拒否は、active state が消失した後の再登録を単独では防がない。
- 影響: Relay 再起動・Redis state loss の直後に、古い暗号化 request が同じ identity で再登録され、Mobile 側の状態や利用者の意図に依存して再処理される余地が残る。`RR-004` の「新しい署名要求として扱う」と `RR-006` の「古い要求の再利用禁止」を、実装・fault injection test で一貫して判定できない。
- 必要な修正: Relay または dApp / Mobile が、状態消失後に旧 identity を再利用できないこと、再試行時は新しい request identity と新しい署名承認を必要とすることを、方式非依存の MUST として明記する。状態を失った Relay が旧 session を受理しない、または参加者が旧 session を署名対象として再承認しないことを含む受け入れ条件を追加し、再起動・state loss 後の再登録、遅延配送、同一暗号文の再送を fault injection / race test で確認できるようにする。具体的な epoch、tombstone、nonce、永続 storage の方式は後続仕様へ委ねてよい。

### RREQ2-004 — `NIT` — `MAY` の適用主体と Relay milestone の完了判定の関係が曖昧

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:13-17,242-267`
- 根拠: `MAY` は「v1 の成立条件ではないが許容される事項」と定義されているが、Relay の対象範囲、運用者、Mobile / dApp の実装上の任意事項のいずれに適用されるかが明示されていない。また `RR-OPEN-001` は Relay milestone の個別完了条件を後続判断へ委ねている。
- 影響: `MAY` の事項を Relay の適合条件に含めるのか、許容される実装差異として扱うのかをレビュー・release 判定で再現しにくい。
- 必要な修正: `MAY` は適用主体の要求を緩和せず、追加機能・実装選択に限ることを明記するか、Relay 要件では `MUST` / `SHOULD` のみを使用する。`RR-OPEN-001` では、少なくとも `RR-AC-001`〜`RR-AC-012` と共通 `CR-AC-004`〜`CR-AC-016` を満たすことが Relay milestone 完了の下限であると追跡する。

## 確認できた整合事項

- `RR-008` は署名秘密情報と transport credential を分離し、credential の raw 値・session secret・導出鍵の露出禁止を明示している。
- `RR-NFR-003` と `RR-AC-011` は、長期履歴化を避け、終端後の request / result / credential / metadata の再利用を禁止する方向で整合している。
- `RR-NFR-005` と `RR-AC-012` は、利用者拒否、unsupported、要求元・内容不一致、expiry、replay、Chain / Network / Account mismatch、validation failure、result unknown 等を成功と区別する最低保証を追跡している。
- `RR-AC-009` と `RR-AC-010` により、transaction signing と message signing の正常 handoff と、署名者・Account・Chain・Network・operation の対応を受け入れ条件へ追加している。
- Traceability 表は上流根拠、適用主体、整合確認資料、下流引継ぎ、受け入れ条件を要求単位で追跡できる構成になっている。
- Relay の署名、意味解釈、利用者承認、announce、node 選択および長期履歴サービスを対象外とする責任境界は、共通要件と概ね整合している。

## 未決事項

- message signing を v1 必須とする共通要件と Web handoff 仕様の対象外記載を、下流仕様の修正としていつ閉じるか。
- opaque envelope の最低限の外部観測条件（Relay が扱える metadata と禁止される平文情報の境界）。
- Relay state loss 後の旧 session / request identity の再利用不能を、Relay 単体・SDK・Mobile のどの責任主体で保証するか。
- Relay milestone の個別完了条件と Mainnet release gate への接続。具体的な API、暗号方式、storage 方式を本要件で固定する必要はない。

## 参照資料

- `docs/concept/concept-sheet.md`
- `docs/requirements/requirements.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/relay.md`
- `docs/architecture/architecture.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `apps/relay/README.md`
- `apps/relay/src/app.ts`
- `apps/relay/src/types.ts`
- `apps/relay/src/memory-store.ts`
- `apps/relay/src/redis-store.ts`
- `apps/relay/test/app.test.ts`
- `apps/relay/test/redis.integration.test.ts`
- `packages/relay-protocol/src/index.ts`
- `packages/relay-protocol/test/protocol.test.ts`
- `packages/sdk/src/mobile-relay.ts`
- `packages/sdk/test/mobile-relay.test.ts`
- `docs/reviews/requirements/relay-review-001.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
