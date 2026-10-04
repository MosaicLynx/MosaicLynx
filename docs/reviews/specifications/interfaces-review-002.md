# MosaicLynx インターフェース / データモデル仕様再レビュー

## レビュー情報

- 対象: [`docs/specifications/interfaces.md`](../../specifications/interfaces.md)
- 対象リビジョン: `d864d3b`（IS-001 修正コミット）
- 前回レビュー: [`interfaces-review-001.md`](./interfaces-review-001.md)
- 確認日: 2026-08-26
- レビュー種別: 仕様レビュー（再レビュー）
- 使用スキル: `spec-review`
- レビュー範囲: 前回指摘 `IS-001` の修正結果、エラーコード判断権限、修正による回帰、関連するセキュリティ / 信頼境界のみ。
- 変更範囲: 本レビュー成果物のみ。対象仕様、コンセプト、要件、設計、他の仕様、実装および既存レビューは変更していない。

## 総評

前回指摘 `IS-001` は解消されている。`interfaces.md` は `MosaicLynxSDKErrorCode` と `MosaicLynxSDKError` の定義を削除し、[Web トランザクション受け渡し仕様](../../specifications/web-transaction-handoff-spec.md) §10 を判断権限として参照している。`RelayResponse.errorCode` も同じ型を参照し、受け渡し §10 に含まれない値を受け付けないことが明記された。

`INVALID_MESSAGE` と `NONCE_REUSED` はインターフェース仕様の SDK 公開コードとして再定義されていない。受け渡し §10 の既存共用体にも含まれず、対象仕様では非許容値として明示されている。エラー対応付け、機微なエラー詳細非露出、安全側での終了、Relay 内容を解釈しない境界および既存の責任分界に、今回の修正による回帰は確認されなかった。

## 判定

### インターフェース仕様 READY

前回指摘は解消され、新規 `ERROR` / `WARN` はない。次工程へ進められる。

## 前回指摘の確認

| ID     | 前回重要度 | 状態         | 確認結果                                                                                                                                |
| ------ | ---------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| IS-001 | エラー     | **解消済み** | インターフェース仕様の独自エラーコード共用体と `INVALID_MESSAGE` / `NONCE_REUSED` の定義が削除され、受け渡し §10 参照へ変更されている。 |

### 確認根拠

- `interfaces.md` §6.3 は `RelayResponse.errorCode` を受け渡し §10 の `MosaicLynxSDKErrorCode` への参照とし、受け渡しにない値を拒否する。
- `interfaces.md` §10.2 はコード集合、エラー対応付け、エラー型を再定義しないと明記している。
- `interfaces.md` §10.2 は `INVALID_MESSAGE` / `NONCE_REUSED` を公開コードとして扱わないことを明記している。
- `web-transaction-handoff-spec.md` §10 の共用体は `USER_REJECTED`、`UNAVAILABLE`、`NOT_CONNECTED`、`APP_NOT_INSTALLED`、`VAULT_LOCKED`、`REQUEST_EXPIRED`、`INVALID_PARAMS`、`INVALID_TRANSACTION`、`UNSUPPORTED_TRANSACTION`、`CHAIN_MISMATCH`、`NETWORK_MISMATCH`、`SIGNER_MISMATCH`、`CONTEXT_CHANGED`、`INVALID_RESPONSE`、`INTERNAL_ERROR` であり、`INVALID_MESSAGE` / `NONCE_REUSED` を含まない。
- 対象仕様に残る `INVALID_MESSAGE` / `NONCE_REUSED` の記述は、公開コードから除外するための明示であり、型・別名・対応付けの追加定義ではない。

## 新規指摘・回帰

### 新規指摘

新規 `ERROR`、`WARN`、`NIT` は確認されなかった。

### 回帰確認

- **エラーコード判断権限:** 受け渡し §10 に一元化され、インターフェース仕様と受け渡しのコード集合が一致している。
- **重複定義:** `interfaces.md` に `MosaicLynxSDKErrorCode` の型定義、`MosaicLynxSDKError` の型定義、`INVALID_MESSAGE` / `NONCE_REUSED` の別名または追加対応付けはない。
- **分類体系:** 新しいエラーコード、エラー分類、再試行規則は追加されていない。既存の論理的なエラー分類と受け渡しの公開コードの責務分離が維持されている。
- **応答契約:** `rejected` / `failed` の `errorCode` 必須、成功結果との排他的関係、Relay HTTP の `RELAY_REQUEST_REJECTED` と SDK 公開コードの非同一視が維持されている。
- **安全側での終了:** 受け渡しにないコードを受け付けず、不明 / 未対応の値を代替経路しない方針が維持されている。
- **機微なエラー詳細:** HTTP 状態、URL、トークン、暗号ライブラリエラー、内部例外、スタック追跡、パーサーダンプ、Vault 詳細、wallet-core 秘密情報を公開エラーに含めない方針が維持されている。
- **Relay 内容を解釈しない境界:** Relay はエラーコードの判断権限や署名認可にならず、内容を解釈しないエンベロープ、通信経路拒否、クライアント側の意味上の検証の責任分界が変わっていない。
- **セキュリティ / 信頼境界:** オリジン、許可、セッション、アカウント、対象範囲、要求結び付け、承認、wallet-core および `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` の境界に修正による変更はない。

## セキュリティ / 信頼境界評価

適合。今回の変更はエラーコードの参照先を明確化するものに限られ、Web アプリケーション / SDK、ブラウザ拡張機能 / モバイルアプリ、Relay、wallet-core の信頼境界を変更していない。Relay 配送やエラーコードを承認 / 署名認可とみなす経路も追加されていない。

`INVALID_MESSAGE` / `NONCE_REUSED` を独自公開コードとして受け付けないことは、不明コードの安全側拒否と、受け渡しの単一判断権限を補強している。構造化されたメッセージの検証 / リプレイ要件そのものを緩和している記述もない。

## 基本設計粒度・未決事項

前回レビューで確認した共通モデル、検証、シリアライズ、ライフサイクル、コンポーネント責務および追跡可能性は、今回の修正で過度に再定義されていない。受け渡し固有の SDK エラーコードを共通インターフェースが複製せず、参照だけに留めたことで責任分界が明確になった。

今回の修正は、前回から未決事項を追加確定していない。既存の `OPEN-001`〜`OPEN-006` は引き続き対象仕様に保持されている。

## 最終判定

- `IS-001`: **解消済み**
- 新規指摘: なし
- 回帰: なし
- 指摘件数: `ERROR 0 / WARN 0 / NIT 0`
- 最終判定: **READY**
- **インターフェース仕様 READY**

## 検証

- Markdown 整形: 作成後に対象レビュー成果物へ Prettier 確認を実施。
- 相対リンク: 対象仕様、前回レビュー、受け渡し仕様の参照先を確認。
- 指摘 ID: 新規指摘なし。前回 ID `IS-001` の状態を `RESOLVED` として記録。
- 重要度表記: スキルの `ERROR` / `WARN` / `NIT` を使用し、件数はすべて 0。
- エラーコード確認: 受け渡し §10 の共用体とインターフェース仕様の参照関係、`INVALID_MESSAGE` / `NONCE_REUSED` の非許容扱いを確認。
- 対象取り違え: 対象は `docs/specifications/interfaces.md`。対象本文および前回レビューは変更していない。
- 差分: `git diff --check` を実施し、既存の `_nem` / `_symbol` の変更とは分離して確認する。
- リポジトリ全体のフォーマッター / lint / typecheck / テスト / ビルドは、レビュー成果物のみの変更であるため実施対象外。
