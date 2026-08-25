# MosaicLynx 要件定義クリーンアップ後レビュー

## レビュー情報

- 対象 commit: `f619146412673f9c8a35c7e75be81203e1c0f227`（`docs: 要件定義をクリーンアップしました`）
- 親 commit: `6900abaf5b49a218811820f2f6681aae7e9ed89a`
- 対象ファイル: `docs/requirements/browser-extension.md`、`docs/requirements/mobile-app.md`、`docs/requirements/mosaiclynx-requirements.md`、`docs/requirements/relay.md`、`docs/requirements/requirements.md`、`docs/requirements/sdk.md`
- 確認日: 2026-08-25
- 判定: `REVISE CLEANUP`
- review scope: 親 commit から対象 commit への cleanup 差分だけを比較し、要求の意味、強度、責務境界、受け入れ条件、traceability および OPEN 管理の変化を確認した。新しい製品要求や下流仕様の適合性はレビュー対象としない。
- 変更範囲: 正式要件 6 ファイル。レビュー成果物以外のファイルは変更していない。

## 総評

クリーンアップの大部分は semantic-preserving である。要求 ID、v1 の transaction / message signing 範囲、Mainnet gate、Signer / SDK / Relay / Wallet Core の責務境界、受け入れ条件の ID と本文、OPEN の集合および上流 traceability は維持されている。表の圧縮、仕様レベルの詳細、レビュー経緯および重複するメタ説明の削除も、原則として要求の意味を変えていない。

ただし、`SDK-NFR-003` では提供開始前の検証結果を存在するものとして報告してはならないという禁止条件が、「cross-transport 対応を完了扱いにしてはならない」へ弱まっている。さらに `RR-006` では retry 時に新しい transport authorization context を伴うという明示が削除され、受け入れ条件には残るものの要求本文からは判定しにくくなった。前者は要求強度の回帰、後者は安全境界の明示性低下であり、cleanup の修正が必要である。

## Cleanup 差分確認

- **requirement ID**: 6 ファイルについて親 commit と現行 commit の ID 集合を比較した。ID の欠落、再利用、renumbering、本文との入れ替えは確認されなかった。`SDK-OPEN-001` も復活していない。
- **MUST / SHOULD / MAY**: normative keyword の要求本文における意味は、上記 2 件を除き維持されている。Browser Extension の `MUST` 件数差は、削除された provenance 文中の語を含むメタ説明の差であり、要求本文の弱体化ではない。Mobile、Relay、共通要件および SDK の他の keyword の適用主体・条件は維持されている。
- **scope**: Browser Extension、Android / iOS、Relay の v1 milestone、SDK の Browser Extension 優先と将来 Mobile / Relay 連携、Mainnet gate、transaction signing / message signing の必須範囲は維持されている。Mobile 未提供時の完了扱い禁止も `SDK-AC-006` に残っている。
- **security boundary**: blind signing 防止、未解析・未対応時の安全側失敗、Chain / Network / Account mismatch、request / result correspondence、freshness / replay、stale approval、user rejection、result unknown、secret leakage および Mainnet fail-closed の要求と AC は維持されている。`SDK-NFR-003` と `RR-006` の本文については、下記 Finding のとおり明示性または強度が低下した。
- **responsibility**: Browser Extension が browser-observed Origin / context を検証し、Mobile / platform が handoff caller binding を最終検証し、Relay が最終 caller 検証・承認・署名を担わず、SDK が Signer / Wallet Core を代替しない責務分担は維持されている。Relay server の logging、retention、diagnostics、credential handling は SDK の直接保証から移されていない。
- **AC**: 6 ファイルの acceptance criteria の ID と本文は cleanup 前後で維持されている。圧縮された traceability 表からも、各要求と AC の対応は追跡できる。`SDK-AC-006` は提供前の E2E / contract test / 対応済み報告禁止を、`RR-AC-011` は transport credential の再利用禁止を、それぞれ維持している。
- **OPEN**: cleanup による誤削除、解決済み OPEN の復活、参照先の破壊は確認されなかった。現行の一覧は下記のとおりである。
- **traceability**: Concept、共通要件、platform 要件および確定済み ADR を上流根拠とする構造は維持され、architecture、specification、Wallet Core、SNIF、実装および review は整合確認または下流引継ぎに留まっている。長い provenance の削除により、必要な上流 ID と AC 対応が失われた箇所は確認されなかった。

## 指摘事項

### CLN-001

- ID: `CLN-001`
- severity: `ERROR`
- 状態: 未解消
- 対象: `docs/requirements/sdk.md:437-443`（`SDK-NFR-003`）
- cleanup 前: `Mobile App が未実装の期間は、Mobile / Relay の実装済み検証結果が存在するものとして報告してはならない。`
- cleanup 後: `Mobile / Relay の提供開始前は、その cross-transport 対応を完了扱いにしてはならない。`
- 影響: 現行の MUST 本文では、Mobile / Relay の提供開始前に E2E または contract test の検証結果が存在するものとして報告しても、「対応完了」と表示しなければ適合し得る。cleanup 前にあった検証結果の存在・報告そのものに対する禁止条件が失われている。`SDK-AC-006` には旧来の禁止条件が残るが、要求本文と AC の下限が一致せず、要求単体の適合判定では強度が弱くなる。
- 必要な修正: `SDK-NFR-003` に、Mobile / Relay の提供開始前は実装済み検証結果が存在するものとして報告してはならないという同等の MUST 条件を復元する。具体的な test framework や E2E 手順は追加しない。

### CLN-002

- ID: `CLN-002`
- severity: `WARN`
- 状態: 未解消
- 対象: `docs/requirements/relay.md:107-119`（`RR-006`）および `RR-AC-011`
- cleanup 前: retry は `fresh generation context`、`new request identity`、`new session identity`、`必要な新しい transport authorization context`、`fresh encrypted envelope` および新しい利用者承認を伴う。
- cleanup 後: retry は `fresh generation context`、`新しい identity`、`fresh encrypted envelope` および新しい利用者承認を伴う。`transport authorization context` の明示がない。
- 影響: `RR-AC-011` には古い transport credential を有効な handoff として再利用しない条件が残るため、受け入れ条件の安全下限は直ちには失われていない。しかし `RR-006` 本文だけでは、state loss 後の新しい handoff が新しい transport authorization context に結び付くことを独立に判定できず、generation / freshness と transport authorization の境界を仕様へ引き継ぐ際に旧 credential の再利用を許す読み方が生じる。
- 必要な修正: `RR-006` の retry 条件に、新しい transport authorization context を伴うこと、または同じ保証を明示する抽象表現を復元する。credential の形式、生成方式、binding 方式は本要件で固定しない。

未解決の NIT は確認されなかった。

## 残存 OPEN

cleanup 後の OPEN は次のとおりであり、親 commit から意味変更されていない。

- 共通: `OPEN-001`、`OPEN-002`、`OPEN-003`、`OPEN-005`、`CR-OPEN-001`、`CR-OPEN-002`
- Mobile: `MR-OPEN-001`〜`MR-OPEN-008`
- Relay: `RR-OPEN-001`、`RR-OPEN-002`
- SDK: `SDK-OPEN-002`〜`SDK-OPEN-007`

`SDK-OPEN-001` は復活していない。`FUTURE-001` は OPEN ではなく、組織向け監査・統制・カストディ保証を v1 外に置く将来保留事項として維持されている。今回、新しい OPEN は追加していない。

## 確認できた事項

- semantic change: 大部分は確認されなかったが、`CLN-001` は要求強度の変更、`CLN-002` は要求本文の明示性低下である。
- normative keyword: ID に紐づく keyword の大半は維持され、`MUST` の対象条件が上記 2 箇所で圧縮された。
- requirement ID: 欠落、再利用、renumbering なし。
- AC: ID・本文は維持され、正常系・安全側失敗・外部判定可能性の主要条件も維持されている。ただし `SDK-NFR-003` と `SDK-AC-006` の本文下限を一致させる必要がある。
- responsibility: Browser Extension / Mobile App / Relay / SDK / Wallet Core / Signer / dApp の責任境界は維持された。
- security boundary: 主要な fail-safe、caller / Origin、correlation、replay、secret、Mainnet gate は維持された。`RR-006` の transport authorization context は復元が必要である。
- traceability: 上流根拠、platform 要件、AC、下流引継ぎの主要な対応は維持された。
- specification-level detail の整理: API、schema、storage、暗号方式、DB / Redis、protocol、実装方式などの削除は、要件適合の最低保証を残した範囲で妥当である。
- meta information の削除: provenance の詳細、レビュー経緯、既存実装状況の重複説明、外部資料が上流根拠でないことの反復説明は原則妥当である。Mobile の未決定事項節も、正式要求・MR-OPEN-*・traceability に意味が残っているため、削除自体は回帰と判定しない。

## SNIF 整合確認

`_sns/packages/symbol-nem-interchange-format/doc/requirements.md`、`doc/spec-format.md`、`doc/spec-api.md` を整合確認資料として参照した。SNIF は transport 非依存の format / interchange として `id` / `replyTo`、Chain / Network、connection、transaction signing request / response 等を搬送できるが、次を担わない境界が維持されている。

- correlation の搬送は SDK / Signer / platform の request existence、freshness、replay、使用済み管理および session binding を代替しない。
- dApp / connection information の存在は caller authenticity、Origin verification、authentication / authorization を成立させない。
- SNIF の transport 非依存性は Browser Provider、Deep Link / App Link、Relay の安全境界を消去しない。
- signing request / response の format は、利用者承認、署名生成、署名検証、Signer verification および transaction semantic validation を代替しない。

SDK 要件は SNIF を上位要求として扱わず、SNIF の使用自体も本 cleanup で確定していない。

## Validation

- `pnpm exec prettier --check docs/requirements docs/reviews/requirements/requirements-cleanup-review-001.md`: 成功。対象文書は Prettier code style に適合している。
- `git diff --check`: 成功。空白エラーなし。

判定は `REVISE CLEANUP` であり、上記 2 件の修正確認後に requirements phase の close readiness を再判定する。
