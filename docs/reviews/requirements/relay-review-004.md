# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、Traceability、未決事項、共通要件および下流 Web handoff 仕様との整合
- 実施方法: `requirements-review` Skill と `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。Concept Sheet、共通要件、Mobile / Browser Extension 要件、Architecture、Product Specification、Web Transaction Handoff Specification、Relay protocol / SDK / Relay 実装・テストおよび既存の `relay-review-001`〜`relay-review-003` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

前回レビューの opaque envelope 検証境界と古い message signing 注記は修正されている。Relay が平文 request / response を復号・意味解釈せず、外形・サイズ・期限・credential authorization 等の transport / structural validation だけを担う整理、state loss 後の旧 identity 再利用禁止、message signing の v1 handoff 範囲、MAY の扱いおよび milestone の最低条件は、要件・下流仕様間で概ね整合している。

ただし、現状は仕様化へ進めない。`RR-008` は session secret を transport credential として列挙し、raw 値の URL query / fragment への露出を禁止している一方、Web Transaction Handoff Specification は App Link の URL fragment に `sessionSecret` と `appToken` を含める。このままでは、session secret が Relay に扱われる credential なのか、SDK と App の間だけで一時的に渡される鍵素材なのか、また App Link fragment が禁止対象か許容される一時的 handoff かを要求段階で判定できない。

## 指摘事項

### RREQ4-001 — `ERROR` — session secret / transport credential の URL と Relay 境界が要件・下流仕様で矛盾

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:121-127,223`、`docs/requirements/requirements.md:185-191,257-261,392-395`、`docs/specifications/web-transaction-handoff-spec.md:426-437,480-490,546-558,696-704`
- 根拠: Relay 要件 `RR-008` は bearer credential、capability token、session secret、request / response access credential、導出鍵を transport credential として列挙し、raw 値、session secret または導出鍵を URL の query / fragment、ログ、診断、error、analytics、telemetry または不要な継続保存へ露出・出力してはならないと定める。また `RR-AC-006` は Relay が opaque envelope と必要最小限の metadata だけを扱い、平文を復号しないことを要求する。ところが下流 Web Transaction Handoff Specification は、App Link を `https://link.mosaiclynx.app/v1/handoff/{sessionId}#s={sessionSecret}&a={appToken}` とし、SDK が raw `sessionSecret` と `appToken` を URL fragment に載せて App へ渡すと定めている。同仕様は fragment が HTTP request / Referer / server log に送られないことを根拠にしているが、Relay 要件は URL fragment への露出自体を禁止しており、両文書の境界は一致しない。さらに、Relay 要件は session secret を transport credential として Relay が扱う可能性を残しているが、下流 API は session secret の hash や raw 値を Relay へ渡さず、Relay がこれを取得してはならないことを要求段階で明確にしていない。
- 影響: App Link fragment を仕様どおり実装すると `RR-008` / `CR-NFR-002` 違反となり、fragment を禁止すると現行の Mobile handoff が成立しない。Relay が session secret または derived request / response key を受信・処理できる実装を許すと、Relay 侵害時に E2E opaque envelope を復号でき、`RR-003` の信頼しない境界を破壊する。逆に、必要な endpoint authorization 用の bearer token まで一律に禁止すると、Relay の access control 要求と両立しない。
- 必要な修正: 「署名秘密情報」「Relay endpoint authorization に必要な capability / access credential」「SDK と正規 App の間だけで使う session secret / derived encryption key」を定義上分離する。Relay は session secret、request / response key、その導出に必要な秘密値を受信・復号・保持せず、必要なら capability token の検証用表現だけを扱うことを `MUST` として明記する。そのうえで、raw credential を App Link fragment で渡す方式を許容するのか禁止するのかを、共通要件・Relay 要件・Web handoff 仕様で統一する。許容する場合は、URL query / fragment への一般禁止との適用範囲、正規 App Link 以外への露出、fallback / history / clipboard / diagnostics への残存防止を明示する。禁止する場合は、session secret / app token を URL に載せない別の handoff を下流仕様で定義する。具体方式の選択は後続設計へ委ねてよいが、Relay が復号鍵を持たない責任境界は未決にしてはならない。

### RREQ4-002 — `WARN` — transport / structural validation の失敗を Relay 固有受け入れ条件で直接確認できない

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:70-78,178-194,214-229`
- 根拠: `RR-003` は envelope 外形、size、expiry / lifetime、protocol / version、credential authorization、state transition、duplicate / replay / stale state の transport / structural validation を許容し、`RR-NFR-005` と `RR-AC-012` は validation failure を成功と区別することを要求する。しかし `RR-AC-001`〜`RR-AC-012` に、malformed envelope、未知 protocol / version、過大 body、期限不正、未許可 lifecycle または credential authorization 失敗を Relay が受理せず、平文を扱わず、安全側の結果へ分類する具体的な正常 / 拒否条件が独立していない。下流 Web handoff 仕様と現行 Relay テストには外形・期限・body size の検証があるが、要件レビューでは下流実装の存在を上流要求の代替にはできない。
- 影響: Relay が structural validation を実装していても、どの入力を拒否し、どの失敗を dApp / App が成功と区別すべきかを要件適合性から直接判定しにくい。逆に、外形不正を受理して後段へ渡す実装も、`RR-003` の「検証できる」と `RR-NFR-005` の分類だけでは一貫して不適合と判定しにくい。
- 必要な修正: `RR-AC-006` または新しい受け入れ条件で、構造不正・期限不正・未許可 metadata / authorization・過大入力・不正 lifecycle を Relay が平文復号なしに拒否し、秘密情報や内部状態を漏らさず、署名成功へ変換しないことを追跡する。具体的な HTTP status、error code、schema、サイズ値は下流仕様へ委ねてよい。

## 確認できた整合事項

- `RR-003` は前回指摘を反映し、plaintext の復号・意味解釈と、envelope 外形・サイズ・期限等の transport / structural validation を区別している。
- 共通要件 `CR-007` / `CR-007-MSG` と `RR-001` / `RR-002` / `RR-AC-009` / `RR-AC-010` の transaction signing / message signing 範囲が一致している。
- E2E opaque envelope、平文 payload の API / storage / log 等への非露出、state loss 後の旧 identity / ciphertext 再利用禁止、MAY の非緩和、Relay milestone 最低条件が要件へ追跡されている。
- transport credential と署名秘密情報の分離、bounded retention、安全側失敗分類、正常系 handoff、要求・結果の対応および Traceability は前回レビューから維持されている。

## 未決事項

- session secret / derived key を Relay、SDK、正規 App、App Link、fallback のどの境界で扱うか。
- URL fragment による一時的 credential handoff を許容するか、禁止するか。
- structural validation の拒否結果を、Relay 固有受け入れ条件へどの粒度で追跡するか。
- 上記を反映した後、Relay milestone の最低条件と Web handoff / implementation evidence の再確認を行うこと。

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
- `docs/reviews/requirements/relay-review-002.md`
- `docs/reviews/requirements/relay-review-003.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
