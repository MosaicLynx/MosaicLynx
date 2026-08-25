# MosaicLynx 要件定義クリーンアップ後再レビュー

## 1. レビュー情報

- 対象リポジトリ: `MosaicLynx/MosaicLynx`
- 対象修正 commit: `11bbb9a`（`docs: クリーンアップレビュー指摘を反映しました`）
- 前回レビュー対象: `f619146`（`docs: 要件定義をクリーンアップしました`）
- 前回レビュー成果物: `docs/reviews/requirements/requirements-cleanup-review-001.md`
- 差分比較の基点: `4512ed3`（前回レビュー成果物作成後の要件本文）
- 現在の main: `11bbb9a`（対象修正 commit と同一）
- 確認日: 2026-08-25
- 判定: `READY`
- review scope: 前回の `CLN-001` / `CLN-002` の対応確認を主対象とし、`11bbb9a` の差分による新たな要求強度、責務境界、クリーンアップ品質またはスコープ逸脱だけを確認した。要件定義をゼロから再レビューしていない。
- 対象ファイル: `docs/requirements/sdk.md`、`docs/requirements/relay.md`

## 2. 対象ファイル・対象コミット

`4512ed3` から `11bbb9a` への差分は、次の 2 ファイルに限定されている。

- `docs/requirements/sdk.md`: `SDK-NFR-003` の 1 箇所
- `docs/requirements/relay.md`: `RR-006` の 1 箇所

差分は各 1 行の置換であり、Requirement ID、AC、OPEN、traceability、仕様書、SNIF、コードその他のファイルは変更されていない。現在の main は `11bbb9a` と一致している。

## 3. 前回指摘への対応確認

### CLN-001

- 判定: **RESOLVED**
- 対象: `docs/requirements/sdk.md:437-443`、`SDK-NFR-003`
- 修正前: Mobile / Relay の提供開始前に cross-transport 対応を完了扱いにしてはならない、という下限のみだった。
- 修正後: `Mobile / Relay の提供開始前は、実装済み検証結果が存在するものとして報告してはならない。検証が完了していない状態で、検証済み、確認済み、保証済みまたは対応済みであるかのように報告してはならない。`

修正後は、`SDK-NFR-003` の `MUST` 要求の文脈に、未検証の結果を検証済み・確認済み・保証済み・対応済みとして報告することを禁止する明確な normative requirement がある。単なる `SHOULD`、注意事項または運用助言への弱体化ではない。`SDK-AC-006` の「E2E 済み、contract test 済みまたは対応済みと報告しない」という既存条件とも整合する。

復元内容は報告禁止の要求に限定されており、test framework、E2E 手順、証跡形式、実装状態管理などの新しい設計詳細は追加されていない。前回 cleanup 前の禁止範囲を回復したものであり、要求強度の弱体化は解消された。

### CLN-002

- 判定: **RESOLVED**
- 対象: `docs/requirements/relay.md:107-119`、`RR-006`
- 修正前: retry の fresh generation、identity、encrypted envelope および承認は残っていたが、transport authorization context の扱いが本文から失われていた。
- 修正後: retry は `必要な新しい transport authorization context` を伴い、`transport authorization context は retry によって暗黙に別の認可境界へ置き換えず、必要な場合は維持または再検証しなければならない` と明記された。

修正後は、retry / reconnect により認可境界を暗黙に変更・迂回しないこと、transport authorization context を無条件に別のものへ置換しないこと、必要な場合に維持または再検証することが要求本文から判定できる。`RR-AC-011` の transport credential 再利用禁止および generation / replay の安全側条件とも整合する。

追加されたのは既存の認可境界の意図を復元する抽象的な要求だけであり、token 形式、session ID、transport protocol、retry algorithm、reconnect 実装、認証プロトコルの具体方式は固定していない。要件定義の粒度を逸脱していない。

## 4. 新規指摘

新規の `ERROR`、`WARN`、`NIT` は確認されなかった。

## 5. 要求強度の確認

- `SDK-NFR-003` は、提供開始前の未検証結果を検証済み等として報告しない `MUST` 相当の禁止を復元している。
- `RR-006` は、旧 generation、旧 identity、旧 ciphertext の再利用禁止に加え、retry 時の authorization context の維持・必要時の再検証と暗黙の認可境界変更禁止を復元している。
- `11bbb9a` の差分に、既存の `MUST` / `MUST NOT` の弱体化または不要な新規義務の追加はない。
- transaction signing、message signing、caller / Origin、request / result correlation、replay、result unknown、Signer / Relay の安全境界および SDK-AC / RR-AC は変更されていない。

今回の追加は、前回 cleanup で失われた意味の復元に限定されている。

## 6. SDK / Relay / Signer / SNIF の責務境界確認

- **SDK**: 外部アプリケーションとの連携、要求・結果の対応および失敗の伝達を担う。Signer の表示・承認・署名、Wallet Core の秘密情報処理、Relay server の内部実装を代替していない。
- **Relay**: opaque handoff の transport / structural boundary を担う。今回の authorization context 要求によって、Relay が transaction / message の意味解釈、利用者承認、署名または caller identity の最終検証主体になる変更はない。
- **Signer**: 利用者確認・承認、transaction / message の意味確認、署名および安全側失敗の責任を維持している。
- **SNIF**: `_sns` の requirements、spec-format、spec-api と照合した。SNIF は format と `id` / `replyTo` 等の correlation 情報を搬送する資料であり、authentication、authorization、replay prevention、freshness、session state、利用者承認、signing generation、署名検証または transaction semantic validation を担わない。この責務境界は今回の修正で変更されていない。SNIF は MosaicLynx の上位要求として扱われておらず、SDK が SNIF を使用することも確定されていない。

## 7. クリーンアップ品質の確認

前回 cleanup の目的は維持されている。`CLN-001` は禁止条件を 1 文で復元し、`CLN-002` は retry の認可境界を 1 文で明示している。いずれも、冗長な provenance、重複する注釈、API / schema / protocol / token / state machine の設計詳細を再導入していない。

要件本文と参考情報の分離、SDK / Relay / Signer / SNIF の責務分離、後続仕様へ委ねる範囲も維持されている。

## 8. Validation

- `pnpm exec prettier --check docs/requirements docs/reviews/requirements/requirements-cleanup-review-002.md`: 成功。
- `git diff --check`: 成功。
- `git diff --name-status 4512ed3 11bbb9a`: `docs/requirements/sdk.md`、`docs/requirements/relay.md` の 2 ファイルのみを確認。
- 作業中の変更範囲: レビュー成果物作成前は clean。成果物作成後は `docs/reviews/requirements/requirements-cleanup-review-002.md` のみが新規変更となることを確認する。

## 9. 総評

`11bbb9a` は前回レビューの `CLN-001` と `CLN-002` を、要件定義の粒度を保ったまま解消している。未検証結果の誤った保証報告禁止、retry 時の transport authorization context と認可境界の維持・再検証、暗黙の認可境界変更禁止が明確になった。新たな要求強度の回帰、責務境界の変更、SNIF への責務逆流、過剰な設計詳細の追加は確認されなかった。

## 10. 最終判定

`READY`

REQUIREMENTS PHASE READY TO CLOSE
