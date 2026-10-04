# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、追跡可能性、未決事項、共通要件および下流 Web 受け渡し仕様との整合
- 実施方法: `requirements-review` スキルと `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。コンセプトシート、共通要件、モバイル / ブラウザ拡張機能要件、アーキテクチャ、プロダクト仕様、Web トランザクション受け渡し仕様、Relay プロトコル / SDK / Relay 実装・テストおよび既存の `relay-review-001`〜`relay-review-003` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

前回レビューの内容を解釈しないエンベロープ検証境界と古いメッセージ署名注記は修正されている。Relay が平文要求 / 応答を復号・意味解釈せず、外形・サイズ・期限・認証情報認可等の通信経路 / 構造上の検証だけを担う整理、状態消失後の旧識別情報再利用禁止、メッセージ署名の v1 受け渡し範囲、MAY の扱いおよびマイルストーンの最低条件は、要件・下流仕様間で概ね整合している。

ただし、現状は仕様化へ進めない。`RR-008` はセッション秘密情報を通信経路認証情報として列挙し、生の値の URL 照会 / フラグメントへの露出を禁止している一方、Web トランザクション受け渡し仕様は App Link の URL フラグメントに `sessionSecret` と `appToken` を含める。このままでは、セッション秘密情報が Relay に扱われる認証情報なのか、SDK とアプリの間だけで一時的に渡される鍵素材なのか、また App Link フラグメントが禁止対象か許容される一時的受け渡しかを要求段階で判定できない。

## 指摘事項

### RREQ4-001 — `ERROR` — セッション秘密情報 / 通信経路認証情報の URL と Relay 境界が要件・下流仕様で矛盾

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:121-127,223`、`docs/requirements/requirements.md:185-191,257-261,392-395`、`docs/specifications/web-transaction-handoff-spec.md:426-437,480-490,546-558,696-704`
- 根拠: Relay 要件 `RR-008` は bearer 認証情報、対応能力トークン、セッション秘密情報、要求 / 応答アクセス認証情報、導出鍵を通信経路認証情報として列挙し、生の値、セッション秘密情報または導出鍵を URL の照会 / フラグメント、ログ、診断、エラー、利用状況分析、遠隔計測データまたは不要な継続保存へ露出・出力してはならないと定める。また `RR-AC-006` は Relay が内容を解釈しないエンベロープと必要最小限のメタデータだけを扱い、平文を復号しないことを要求する。ところが下流 Web トランザクション受け渡し仕様は、App Link を `https://link.mosaiclynx.app/v1/handoff/{sessionId}#s={sessionSecret}&a={appToken}` とし、SDK が生の `sessionSecret` と `appToken` を URL フラグメントに載せてアプリへ渡すと定めている。同仕様はフラグメントが HTTP 要求 / Referer / サーバーログに送られないことを根拠にしているが、Relay 要件は URL フラグメントへの露出自体を禁止しており、両文書の境界は一致しない。さらに、Relay 要件はセッション秘密情報を通信経路認証情報として Relay が扱う可能性を残しているが、下流 API はセッション秘密情報のハッシュや生の値を Relay へ渡さず、Relay がこれを取得してはならないことを要求段階で明確にしていない。
- 影響: App Link フラグメントを仕様どおり実装すると `RR-008` / `CR-NFR-002` 違反となり、フラグメントを禁止すると現行のモバイル受け渡しが成立しない。Relay がセッション秘密情報または導出された要求 / 応答鍵を受信・処理できる実装を許すと、Relay 侵害時に E2E 内容を解釈しないエンベロープを復号でき、`RR-003` の信頼しない境界を破壊する。逆に、必要なエンドポイント認可用の bearer トークンまで一律に禁止すると、Relay のアクセス制御要求と両立しない。
- 必要な修正: 「署名秘密情報」「Relay エンドポイント認可に必要な対応能力 / アクセス認証情報」「SDK と正規アプリの間だけで使うセッション秘密情報 / 導出された暗号化鍵」を定義上分離する。Relay はセッション秘密情報、要求 / 応答鍵、その導出に必要な秘密値を受信・復号・保持せず、必要なら対応能力トークンの検証用表現だけを扱うことを `MUST` として明記する。そのうえで、生の認証情報を App Link フラグメントで渡す方式を許容するのか禁止するのかを、共通要件・Relay 要件・Web 受け渡し仕様で統一する。許容する場合は、URL 照会 / フラグメントへの一般禁止との適用範囲、正規 App Link 以外への露出、代替経路 / 履歴 / クリップボード / 診断情報への残存防止を明示する。禁止する場合は、セッション秘密情報 / アプリトークンを URL に載せない別の受け渡しを下流仕様で定義する。具体方式の選択は後続設計へ委ねてよいが、Relay が復号鍵を持たない責任境界は未決にしてはならない。

### RREQ4-002 — `WARN` — 通信経路 / 構造上の検証の失敗を Relay 固有受け入れ条件で直接確認できない

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:70-78,178-194,214-229`
- 根拠: `RR-003` はエンベロープ外形、サイズ、期限切れ / 有効期間、プロトコル / バージョン、認証情報認可、状態遷移、重複 / リプレイ / 古くなった状態の通信経路 / 構造上の検証を許容し、`RR-NFR-005` と `RR-AC-012` は検証失敗を成功と区別することを要求する。しかし `RR-AC-001`〜`RR-AC-012` に、不正な形式のエンベロープ、未知プロトコル / バージョン、過大本文、期限不正、未許可ライフサイクルまたは認証情報認可失敗を Relay が受理せず、平文を扱わず、安全側の結果へ分類する具体的な正常 / 拒否条件が独立していない。下流 Web 受け渡し仕様と現行 Relay テストには外形・期限・本文サイズの検証があるが、要件レビューでは下流実装の存在を上流要求の代替にはできない。
- 影響: Relay が構造上の検証を実装していても、どの入力を拒否し、どの失敗を dApp / アプリが成功と区別すべきかを要件適合性から直接判定しにくい。逆に、外形不正を受理して後段へ渡す実装も、`RR-003` の「検証できる」と `RR-NFR-005` の分類だけでは一貫して不適合と判定しにくい。
- 必要な修正: `RR-AC-006` または新しい受け入れ条件で、構造不正・期限不正・未許可メタデータ / 認可・過大入力・不正ライフサイクルを Relay が平文復号なしに拒否し、秘密情報や内部状態を漏らさず、署名成功へ変換しないことを追跡する。具体的な HTTP 状態、エラーコード、スキーマ、サイズ値は下流仕様へ委ねてよい。

## 確認できた整合事項

- `RR-003` は前回指摘を反映し、平文の復号・意味解釈と、エンベロープ外形・サイズ・期限等の通信経路 / 構造上の検証を区別している。
- 共通要件 `CR-007` / `CR-007-MSG` と `RR-001` / `RR-002` / `RR-AC-009` / `RR-AC-010` のトランザクション署名 / メッセージ署名範囲が一致している。
- E2E 内容を解釈しないエンベロープ、平文ペイロードの API / 保存領域 / ログ等への非露出、状態消失後の旧識別情報 / 暗号文再利用禁止、MAY の非緩和、Relay マイルストーン最低条件が要件へ追跡されている。
- 通信経路認証情報と署名秘密情報の分離、上限のある保持、安全側失敗分類、正常系受け渡し、要求・結果の対応および追跡可能性は前回レビューから維持されている。

## 未決事項

- セッション秘密情報 / 導出された鍵を Relay、SDK、正規アプリ、App Link、代替経路のどの境界で扱うか。
- URL フラグメントによる一時的認証情報受け渡しを許容するか、禁止するか。
- 構造上の検証の拒否結果を、Relay 固有受け入れ条件へどの粒度で追跡するか。
- 上記を反映した後、Relay マイルストーンの最低条件と Web 受け渡し / 実装根拠の再確認を行うこと。

## 参照資料

- `docs/concept/concept-sheet.md`
- `docs/requirements/requirements.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/browser-extension.md`
- `docs/requirements/relay.md`
- `docs/design/architecture.md`
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
