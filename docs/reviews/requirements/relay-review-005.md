# MosaicLynx Relay 要件定義書レビュー

## レビュー情報

- 対象: `docs/requirements/relay.md`
- 確認日: 2026-08-25
- 判定: `REVISE REQUIREMENTS`
- 対象範囲: `RR-001`〜`RR-011`、`RR-NFR-001`〜`RR-NFR-005`、`RR-AC-001`〜`RR-AC-012`、追跡可能性、未決事項、共通要件、アーキテクチャ、Web トランザクション受け渡し仕様および Relay 実装との整合
- 実施方法: `requirements-review` スキルと `.agents/project-context.md` を適用した単独レビュー。サブエージェントは使用していない。コンセプトシート、共通要件、モバイル / ブラウザ拡張機能要件、アーキテクチャ、プロダクト仕様、Web トランザクション受け渡し仕様、Relay プロトコル / SDK / Relay 実装・テストおよび既存の `relay-review-001`〜`relay-review-004` を照合した。下流仕様・実装・テストは上流根拠ではなく、整合確認または引継ぎ資料として扱った。
- 変更範囲: 本レビュー成果物のみを新規作成した。要件本文、仕様書、ADR、コードは変更していない。

## 総評

前回レビューまでの指摘である、内容を解釈しないエンベロープの構造検証境界、メッセージ署名の v1 対象化、状態消失後の旧識別情報再利用禁止、通信経路認証情報と E2E セッション秘密情報の分類、上限のある保持、安全側失敗分類、正常系受け入れ条件および追跡可能性は現行要件へ反映されている。Relay が署名対象を意味解釈・表示・承認・署名せず、モバイルが復号・検証・承認・署名し、dApp が結果を独立検証する責任境界も概ね適切である。

ただし、現状は仕様化へ進めない。下流 Web 受け渡し仕様では `appToken` が Relay エンドポイント認可認証情報として App Link の URL フラグメントに渡される一方、現行要件は URL フラグメントへの生の認可認証情報の露出を禁止する書き方になっている。E2E セッション秘密情報の一時受け渡しだけを許容する補足では `appToken` を解決できない。また、Relay 状態消失後の旧識別情報 / 暗号文の再登録禁止を MUST としているが、下流仕様と現行 Redis 実装は揮発性状態の消失後に同じ識別情報を判別できる仕組みを示していない。

## 指摘事項

### RREQ5-001 — `ERROR` — `appToken` の分類と App Link フラグメントの許否が要件・下流仕様で未整合

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:125-131,227`、`docs/specifications/web-transaction-handoff-spec.md:426-437,531-537,562-580,698-705`、`docs/design/architecture.md:209`
- 根拠: Relay 要件 `RR-008` は Relay エンドポイント認可認証情報を生の値の URL 照会 / フラグメント、ログ、診断等へ露出しないと定める。続く記述は URL フラグメント等の一時受け渡しを E2E セッション秘密情報のためのクライアント側の受け渡しとして扱い、「Relay 認証情報通信経路ではない」としている。しかし下流仕様は App Link を `#s={sessionSecret}&a={appToken}` とし、`appToken` を `Authorization: Bearer {appToken}` として要求取得・応答登録に使用する Relay エンドポイント認可認証情報と定義している。アーキテクチャも App Link フラグメントからセッション秘密情報とアプリ対応能力を受け取ると記載している。
- 影響: 現行 App Link を実装すると、`appToken` を URL フラグメントへ載せることが `RR-008` の禁止対象か、E2E 秘密情報受け渡しの例外として許容されるのかを判定できない。Relay 認証情報をフラグメントに渡す場合の代替経路、ブラウザ文脈、DOM、履歴、クリップボード、診断情報への残存条件も、E2E セッション秘密情報の条件だけでは閉じない。逆にフラグメントを禁止すると現行 Web 受け渡しのアプリによる Relay 要求取得が成立しない。
- 必要な修正: `appToken` を Relay エンドポイント認可認証情報と明示し、E2E セッション秘密情報 / 導出された暗号化資料と区別する。そのうえで、(1) App Link フラグメントに生の `appToken` を載せない方式へ下流仕様を変更するか、(2) 検証済み App Link への一時的なクライアント側の認証情報受け渡しとして明示的に許容し、Relay 認証情報通信経路ではないと扱える根拠、正規アプリ以外・代替経路・ブラウザ履歴・DOM・クリップボード・診断情報への非露出、処理後の除去および継続保持禁止を要件・共通要件・下流仕様で統一する。どちらを選ぶ場合も、`RR-AC-006` で `appToken` の扱いを判定できるようにする。具体的なトークン形式や暗号方式は本要件で固定する必要はない。

### RREQ5-002 — `ERROR` — 状態消失後の旧識別情報 / 暗号文再登録禁止を実現する責任と状態保持が下流設計で未解決

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:109-113,170-174,224,232`、`docs/specifications/web-transaction-handoff-spec.md:603-620,739-748`、`apps/relay/src/redis-store.ts:6-20,107-115`、`apps/relay/src/memory-store.ts:31-37`
- 根拠: `RR-006`、`RR-NFR-003` および `RR-AC-003` は、Relay 再起動、状態消失または保存領域消失の後に旧要求識別情報、旧セッション識別情報または同一暗号文を新しい受け渡しとして再登録・再処理してはならないと定める。下流仕様は削除記録の保持を必要に応じて最大24時間許容する一方、自己ホスト MVP では RDB / AOF / volume / バックアップを無効にした非永続 Redis を使用し、再起動時に進行中セッションを失うとしており、リプレイ防止方式は後続設計へ委ねている。現行の Redis `create` 処理とメモリストアはセッション鍵が存在しなければ作成するだけで、状態消失後の旧識別情報 / 暗号文を識別する削除記録、世代または同等の外部状態を示していない。
- 影響: Relay 状態が完全に失われた直後、旧作成要求を同じセッション識別情報で再送すると、現行の保存モデルでは新規セッションとして登録できる。旧暗号文が再処理される経路も要求上は禁止されているため、単に SDK が通常再試行で新しい識別情報を生成するだけでは `RR-006` と `RR-AC-003` の保証を満たしたことにならない。再起動・障害時の安全側タイムアウトと、攻撃者による旧要求の再登録拒否の責任主体も未確定である。
- 必要な修正: 状態消失後にも旧識別情報 / 暗号文を拒否できる永続的な削除記録、世代 / 鍵ローテーションまたは同等の仕組みを設けるのか、Relay が保持しない場合に SDK / アプリ側の認証済み通信経路文脈がどのように旧要求を再登録不能にするのかを確定する。少なくとも「正規再試行は新しい識別情報と承認を使う」だけでなく、障害注入で Relay 再起動、Redis 状態消失、旧作成要求の再送、同一暗号文の再送、遅延配送を確認できる責任境界を下流仕様へ定義する。非永続 Redis を維持するなら、要求を満たすための状態を Redis 外で持つか、要件の適用対象・脅威モデルを明確に変更する必要がある。

### RREQ5-003 — `WARN` — Relay v1 の操作範囲が下流受け渡し契約と完全には対応していない

- 状態: `OPEN`
- 対象: `docs/requirements/relay.md:23-25,56-68,228-231,260-266`、`docs/specifications/web-transaction-handoff-spec.md:13-21,42-51`、`docs/design/architecture.md:198-209`
- 根拠: Relay 要件はトランザクション署名とメッセージ署名の要求 / 結果を v1 の必須範囲として定め、正常系受け入れ条件もこの二つの操作に限定している。一方、Web 受け渡し仕様の v1 操作対応表は `connect`、`refreshActiveAccount`、`disconnect`、`signTransaction`、`signData`、`cosignTransaction` を対象とし、アーキテクチャも Relay セッションと App Link をこれらの SDK / モバイル受け渡しに使用する責務を記載している。
- 影響: `connect` 等の非署名操作と `cosignTransaction` が Relay マイルストーンの対象なのか、別のモバイル / SDK 要件でのみ保証するのかを、Relay マイルストーンの完了判定から再現できない。対象である場合は、正常な受け渡し、結果の対応、利用者拒否・切断・未対応・結果不明の安全側失敗を Relay 固有受け入れで確認できない。対象外である場合は、下流仕様が Relay v1 の提供物として記載する範囲と衝突する。
- 必要な修正: Relay v1 が通信経路として保証する操作の境界を明示する。非署名操作を含めるなら、署名操作と混同しない結果 / 失敗、要求元・アカウント・セッションの対応および正常系・安全側失敗の受け入れ条件を追加し、`RR-OPEN-001` と追跡可能性に追跡する。含めないなら、Web 受け渡し仕様・アーキテクチャ・マイルストーン表で Relay の対象外または別責任であることを明記する。`CR-007` のトランザクション署名 / メッセージ署名の必須範囲を弱める変更は行わない。

## 確認できた整合事項

- `RR-003` は平文の復号・意味解釈と、エンベロープ外形・サイズ・期限・認可・ライフサイクル等の通信経路 / 構造上の検証を区別している。
- `RR-008` は署名秘密情報、Relay エンドポイント認可認証情報、E2E セッション秘密情報 / 導出された暗号化資料を別分類し、Relay が E2E エンベロープを復号できない境界を定めている。ただし `appToken` の URL 受け渡しについては RREQ5-001 の未解決が残る。
- `RR-NFR-003`、`RR-AC-011` は終端後の上限のある保持、再利用不能、履歴・分析・ユーザーアカウントサービス化の禁止を MUST として追跡している。
- `RR-AC-006` は不正な形式のエンベロープ、サイズ超過の入力、無効な有効期間、未対応のプロトコル / バージョン、unauthorized 認証情報、対応付け / ライフサイクル不正、重複 / リプレイ / 古くなった状態を、平文復号なしに安全側へ拒否する条件へ具体化している。
- `RR-AC-009` / `RR-AC-010` はトランザクション署名とメッセージ署名の正常受け渡しを、要求、Signer、アカウント、チェーン、ネットワークおよび操作の対応まで確認する。
- 現在のワークスペースにはモバイルアプリ実装は存在しない。下流モバイル受け渡しの記述を実装済み機能や検証済みの受け入れ結果として扱っていない。

## 未決事項・引継ぎ

1. `RREQ5-001`: `appToken` の Relay エンドポイント認可認証情報としての分類、App Link フラグメントの許否、代替経路 / ブラウザ文脈の非露出条件を要件・共通要件・Web 受け渡し仕様で統一する。
2. `RREQ5-002`: volatile Relay 状態消失後の旧識別情報 / 暗号文再登録を、どの主体のどの状態で拒否するかを確定し、障害注入の受け入れ条件へ引き継ぐ。
3. `RREQ5-003`: `connect`、`refreshActiveAccount`、`disconnect`、`cosignTransaction` を Relay マイルストーンの対象に含めるか、含めない場合の責任主体と下流文書の境界を確定する。
4. 上記が解決した後、Relay マイルストーンの最低条件、Web 受け渡し、アーキテクチャ、Relay プロトコル / SDK / サーバー実装および統合テストの整合を再確認する。

## 検証

- `pnpm exec prettier --check docs/requirements/relay.md docs/reviews/requirements/relay-review-005.md`: 成功。
- `git diff --check`: 成功。未追跡の本レビュー成果物についても `git diff --no-index --check /dev/null docs/reviews/requirements/relay-review-005.md` を実行し、空白エラー出力がないことを確認した（差分があるため終了コードは1）。

## 未検証

- 要件レビューのため、モバイルアプリ、Relay 本番環境配置、iOS / Android App Link、wallet-core バインディング、Mainnet リリース証跡の生成・署名・検証は実行していない。
- Redis 統合テストは要件の整合判定に不要なため実行していない。
- 本成果物では要件本文、下流仕様、アーキテクチャ、実装およびテストを修正していない。

## 参照資料

- `docs/requirements/relay.md`
- `docs/requirements/requirements.md`
- `docs/requirements/mobile-app.md`
- `docs/requirements/browser-extension.md`
- `docs/concept/concept-sheet.md`
- `docs/specifications/product-spec.md`
- `docs/specifications/web-transaction-handoff-spec.md`
- `docs/design/architecture.md`
- `apps/relay/src/redis-store.ts`
- `apps/relay/src/memory-store.ts`
- `apps/relay/test/app.test.ts`
- `apps/relay/test/redis.integration.test.ts`
- `packages/relay-protocol/src/index.ts`
- `packages/sdk/src/mobile-relay.ts`
- `docs/reviews/requirements/relay-review-001.md`
- `docs/reviews/requirements/relay-review-002.md`
- `docs/reviews/requirements/relay-review-003.md`
- `docs/reviews/requirements/relay-review-004.md`
- `.agents/project-context.md`
- `.agents/skills/requirements-review/SKILL.md`
