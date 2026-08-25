# MosaicLynx SDK 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/sdk.md`
- 確認日: 2026-08-25
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: SDK 固有要求 `SDK-FR-*`、`SDK-SEC-*`、`SDK-PRIV-*`、`SDK-PLAT-*`、`SDK-COMP-*`、`SDK-ERR-*`、`SDK-NFR-*`、受け入れ条件、未決事項、共通要件および Web handoff 仕様との整合性
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Browser Extension / Mobile / Relay 要件、Architecture、Product Specification、Chain Compatibility Specification、Web Transaction Handoff Specification、SDK の README・公開型・実装・テスト、Wallet Core の参照資料を照合した。下流仕様・実装・テストは要求の上流根拠ではなく、整合確認または要求からの引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

SDK の責任を Signer、Wallet Core、Relay、外部アプリケーションから分離し、秘密情報を受け取らず、利用者の明示的承認を代替せず、Symbol / NEM と Mainnet / Testnet を混同せず、署名結果を元要求へ対応付ける方向は、Concept Sheet、共通要件および既存の責任境界に概ね整合している。`SDK-AC-001`〜`SDK-AC-012` を要求へ対応付け、Mobile 実装を現在のワークスペースに存在するものとして扱っていない点も適切である。

ただし、現行のままでは仕様化へ進めない。共通要件 `CR-007` / `CR-007-MSG` と `OPEN-003` は各 Signer の v1 message signing を確定 MUST としているのに、SDK 要件は `SDK-OPEN-001` で SDK v1 の message signing 範囲を未決にしている。既存 handoff 仕様の「v1 対象外」との競合を SDK 要件の未決事項として残すだけでは、SDK の v1 完了条件、各 platform の共通接点および正常系受け入れ条件を判定できない。

また、Caller / Origin の検証について SDK と Signer の責任分担が要求間で抽象化されすぎている。さらに、エラー分類の相互区別と、正常な cross-transport 成功を確認する受け入れ条件が「必要な範囲」「意味が保たれる」といった表現に留まり、仕様・契約テストの判定基準を一意に再現しにくい。これらは API や暗号方式を要求書へ追加する問題ではなく、責任主体と外部から観測可能な下限を要求段階で確定する問題である。

## 指摘事項

### RREQ1-001 — `ERROR` — message signing の v1 範囲を未決にできず、共通要件と handoff 仕様が未解消である

- 状態: `OPEN`
- 対象: `docs/requirements/sdk.md:82,159-166,475,487-493`、`docs/requirements/requirements.md:156-183,418-422`、`docs/specifications/web-transaction-handoff-spec.md:13-38`
- 根拠: 共通要件 `CR-007` / `CR-007-MSG` は Browser Extension、Android、iOS の各 Signer が v1 の共通能力として transaction signing と message signing を提供することを MUST としている。共通要件の `OPEN-003` も、未決範囲に `CR-007` の operation 対応可否を含めないと明記している。一方、SDK 要件は `SDK-FR-007` と `SDK-AC-004` の適用を `SDK-OPEN-001` の決定へ委ね、Web handoff 仕様は v1 対象外に message signing を記載している。同仕様には後段で `signData` の契約も存在するため、資料間の競合は実際に残っている。
- 影響: SDK v1 が message signing を必須提供するのか、Extension / Mobile / Relay のどの milestone が正常系を満たすのか、`SDK-AC-004` と共通 `CR-AC-006` / `CR-AC-015` をどの fixture で検証するのかを判定できない。message signing を SDK だけで対象外にすると、各 Signer の共通 MUST と SDK の共通接点が不整合になる。
- 必要な修正: 共通要件を維持するなら、SDK 要件で message signing を v1 の必須 operation として確定し、`SDK-OPEN-001` から範囲の未決を除く。そのうえで handoff 仕様の対象外記載、Provider / Mobile / Relay の operation 契約、milestone 表および受け入れ条件を整合させる。message signing を対象外に戻す判断をするなら、SDK 要件だけでなく `CR-007`、`CR-007-MSG`、共通受け入れ条件および各 platform 要件を同時に改訂する。具体的な API 型や message format はこの修正で固定する必要はない。

### RREQ1-002 — `ERROR` — Caller / Origin 検証の責任主体と保証範囲が外部契約として確定していない

- 状態: `OPEN`
- 対象: `docs/requirements/sdk.md:141-146,247-253,323-329,331-345,535-541`、`docs/requirements/browser-extension.md` の BR-003〜BR-004、`docs/requirements/mobile-app.md` の MR-002、`docs/specifications/web-transaction-handoff-spec.md:302-339,427-429`
- 根拠: `SDK-FR-005` は Signer が要求元を検証できる形で渡すことを要求し、`SDK-SEC-004` は「SDK と接続先 Signer」が現在の外部アプリケーション、browser context または handoff session への対応を確認できなければならないとする。一方、`SDK-PLAT-002` は Extension の Origin 検証責任を SDK へ移さないとし、`SDK-OPEN-007` は横断方式を未決としている。Mobile / Relay についても、SDK が証明情報を収集・伝達するのか、App / Signer が最終検証するのか、検証不能時に capability / result をどう外部へ見せるのかという保証下限が要求として一つに定まっていない。
- 影響: SDK が自己申告 Origin を渡すだけの実装、Signer の検証結果を SDK が無条件に信頼する実装、または SDK が本来 platform 側の責任である Origin 認証を代替する実装のいずれも、要求だけでは一貫して適合・不適合を判定できない。Mainnet と Testnet で要求元の保証表示が変わる handoff 契約にも、SDK の共通 result / error 境界を追跡できない。
- 必要な修正: 方式や proof の形式は未決のまま、少なくとも (1) browser の実 Origin と要求の対応を誰が観測・検証するか、(2) Mobile / Relay の handoff session と caller の対応を誰が検証するか、(3) 検証不能時に署名成功・接続済み・検証済み Origin と報告しないこと、(4) SDK が外部へ表明できる保証範囲は各 Signer の検証結果を越えないこと、を SDK と platform 要件の責務表および受け入れ条件へ追記する。具体的な Origin proof、browser API、暗号方式を本要件へ固定する必要はない。

### RREQ1-003 — `WARN` — error taxonomy の「相互に区別できる」と受け入れ条件の下限が一致していない

- 状態: `OPEN`
- 対象: `docs/requirements/sdk.md:195-210,391-411,468-483`
- 根拠: `SDK-FR-011` と `SDK-ERR-001` は User rejection、Unavailable、Connection / permission failure、Timeout / expired / cancelled、Invalid request、Unsupported、Mismatch / integrity failure、Relay / transport failure、Internal failure を成功および意味の異なる失敗から区別できる MUST として列挙している。しかし `SDK-AC-008` はこれらを「必要な範囲で相互に区別でき」とだけ記載し、どの分類を外部アプリケーションが再試行・終了・再接続の判断のために必ず区別するかを下限として示していない。`SDK-FR-011` も具体的 error code や retry 条件を未定としているため、分類を一つの安全側エラーへ潰してよい範囲が不明である。
- 影響: 利用者拒否を自動再試行したり、結果不明・期限切れ・検証失敗を再送可能な通信障害として扱ったりしても、受け入れ条件だけでは不適合を明確に判定できない。Provider、Mobile、Relay の異なるエラーを SDK がどこまで同じ分類へ正規化できるかも決まらず、dApp の安全な制御フローを仕様化できない。
- 必要な修正: wire error code、例外型、文言は後続仕様へ委ねたまま、少なくとも「成功と失敗」「利用者拒否」「未接続・許可不足」「未対応・入力不正」「期限切れ・cancel」「完全性 / caller / replay 検証失敗」「結果不明を含む transport failure」「内部 failure」を外部アプリケーションが安全な終了・再接続・新規要求の判断に必要な範囲で区別する下限を明記する。特に拒否・結果不明・検証失敗を自動 fallback / retry の成功代替にしないことを `SDK-AC-007` / `SDK-AC-008` へ追跡する。

### RREQ1-004 — `WARN` — 正常な cross-transport 成功と独立検証の受け入れ条件が安全側失敗中心である

- 状態: `OPEN`
- 対象: `docs/requirements/sdk.md:169-185,429-435,468-483`
- 根拠: `SDK-FR-008`、`SDK-FR-009` および `SDK-NFR-003` は、元要求・署名者・Account・Chain / Network に対応した結果を返し、Browser Extension と提供済み Mobile / Relay で同じ operation の意味を保つことを要求する。しかし `SDK-AC-005` / `SDK-AC-006` は主に不一致・未対応・failure の拒否条件を述べており、正常な transaction signing と、message signing を採用する場合の正常な message signing が各 transport で同じ要求・結果対応を持つことを直接確認する条件がない。Mobile 未実装を報告しない制約はあるが、提供開始後に何をもって cross-transport の正常系合格とするかが未定義である。
- 影響: request / response が往復するだけの実装や、transport ごとに Account、Chain / Network、operation の対応確認を省略する実装でも、異常系テストを通過すれば要件適合と解釈され得る。`CR-AC-005`、`CR-AC-006`、`CR-AC-015` と SDK の milestone 完了条件との追跡も弱い。
- 必要な修正: `SDK-AC-005` / `SDK-AC-006` に、宣言された対応範囲の正常系として、transaction signing（および RREQ1-001 の決定に従う message signing）が元要求、署名者、Account、Chain / Network、operation と対応し、dApp が独立検証できることを追加する。具体的な fixture、wire schema、platform E2E の実施方法は下流仕様へ委ねてよい。

### RREQ1-005 — `NIT` — 受け入れ条件の記述に重複がある

- 状態: `OPEN`
- 対象: `docs/requirements/sdk.md:480`
- 根拠: `SDK-AC-009` は「SDK、Relay および SDK の診断経路」と記載しており、SDK が重複している。また、SDK 要件として SDK 自身の診断経路を指すのか、Relay のログ・診断を含む end-to-end 境界を指すのかが文面だけでは読み取りにくい。
- 影響: 重大な安全性の問題ではないが、秘密情報・credential・full payload の確認対象をテスト計画へ写す際に、SDK と Relay の責任範囲を誤読し得る。
- 必要な修正: 重複を削除し、SDK が管理する診断経路と Relay 要件へ委ねるサーバー側のログ・保持境界を分けて記載する。

## 確認できた整合事項

- SDK は Signer ではなく連携層であり、秘密鍵、Mnemonic、Profile password、Vault plaintext、raw signing および承認 UI を担わないと明記している。
- Browser Extension、Mobile App、Relay、Wallet Core、Symbol / NEM network の責務境界を表形式で示し、Relay の opaque な受け渡しと Mobile 側の最終検証・承認・署名を維持している。
- Symbol / NEM、Mainnet / Testnet、transaction / message を暗黙変換せず、unsupported や解析不能を raw signing 等へ fallback しない要求は共通要件と整合する。
- `SDK-AC-001`〜`SDK-AC-012` に要求 ID を対応付け、Mobile App が未実装の期間を実装済み・検証済みとして扱わない制約を明記している。
- `SDK-OPEN-002`〜`SDK-OPEN-007` は、cosignature、transport 選択、runtime、versioning、caller binding など、仕様化前に判断が必要な論点として影響範囲と決定時期を記録している。
- `_snwc` は現在のワークスペースに存在する submodule であり、Wallet Core の参照資料へのパス自体は解決可能である。ただし、その内容は SDK 要件の上流根拠ではなく、文書が記載するとおり整合確認資料として扱うべきである。

## 未決定事項・引継ぎ

1. `RREQ1-001`: message signing を共通要件どおり SDK / 各 Signer の v1 必須範囲とするか、共通要件・platform 要件・handoff 仕様を改訂して対象外とするかを決定する。
2. `RREQ1-002`: browser、Mobile / Relay ごとの caller / Origin 検証主体、検証不能時の外部可視結果、Mainnet / Testnet の保証表示を責務表と受け入れ条件へ追跡する。
3. `RREQ1-003`: SDK が外部アプリケーションへ保証する失敗分類の最低限と、自動 retry / fallback を禁止する境界を確定する。具体的な error code は下流仕様で決定できる。
4. `RREQ1-004`: Extension と Mobile / Relay の提供開始後に、正常系の共通 operation、結果対応、独立検証を確認する milestone / contract test の受け入れ条件を追加する。
5. `SDK-OPEN-002`〜`SDK-OPEN-007` の決定後、公開 operation、runtime、version、caller binding、transport 選択を SDK specification と各 platform 契約へ反映する。未決のまま仕様化へ進めない。

## Validation

- `pnpm exec prettier --check docs/requirements/sdk.md docs/reviews/requirements/sdk-review-001.md`: 実行予定。成果物作成後に実行する。
- `git diff --check`: 実行予定。成果物作成後に実行する。

## Not validated

- 本レビューは要件・仕様・責務境界の文書レビューであり、SDK、Provider、Relay、Mobile App の実装変更やテスト実行は行っていない。
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
- `packages/sdk/README.md`
- `packages/sdk/package.json`
- `packages/sdk/src/types.ts`
- `packages/sdk/src/sdk.ts`
- `packages/sdk/src/availability.ts`
- `packages/sdk/test/sdk.test.ts`
- `packages/sdk/test/mobile-relay.test.ts`
- `_snwc/docs/requirements/requirements.md`
- `_snwc/docs/specifications/specification.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
