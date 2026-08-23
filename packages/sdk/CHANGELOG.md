# 更新履歴

このファイルは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) の形式を参考にし、バージョン番号は [Semantic Versioning](https://semver.org/lang/ja/) に従います。

## 1.0.0 - 2026-07-31

### 追加

- Symbol / NEM の未署名トランザクションを MosaicLynx で署名する `createMosaicLynxSDK()` と `signTransaction()`。
- 拡張機能とMobile Relayで共通の接続、接続確認、アクティブアカウント更新、切断契約。
- prefixとOriginを束縛する構造化データ署名、およびSymbol / NEM連署。
- 未接続の署名要求を判別する `NOT_CONNECTED` エラーコード。
- Provider API v2を利用する拡張機能transportと、受信アプリ公開まで本番無効のMobile Relay v1契約。
- 署名者、ネットワーク、署名対象、署名、トランザクション hash を検証した `SignedTransaction` の返却。
- 診断イベントと、transport 固有の失敗を隠蔽する `MosaicLynxSDKError`。
- SDK の導入方法、API、エラー処理、Mobile Relay、mainnet Origin Proof を説明するドキュメント。
