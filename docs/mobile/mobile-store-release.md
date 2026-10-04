# MosaicLynx Testnet モバイルアプリのリリース

一般公開するモバイルビルドは Testnet 専用とする。ストアの説明文とスクリーンショットには、実資産向けではないことを明記しなければならない。残高表示、チェーンノードへの接続、トランザクションのアナウンス、Mainnet 対応は提供しない。

## 外部公開の前提条件

1. Apple Developer と Google Play Console に `app.mosaiclynx.mobile` を登録する。
2. `apps/link-fallback/public/.well-known` にある二つの関連付けテンプレートを、実際の Apple Team ID と Play App Signing の SHA-256 証明書フィンガープリントを含む配布用ファイルに置き換える。テンプレートをそのまま配置してはならない。
3. 関連付けファイルとフォールバックページを、リダイレクトなしで `https://link.mosaiclynx.app` から配信する。HSTS、フォールバック HTML の `Cache-Control: no-store`、および静的ページが示す CSP・リファラーヘッダーを設定する。
4. リリース責任者が管理するプライバシー通知とサポートの URL を公開する。プライバシー通知には、Relay の暗号文の保持期間が最長5分であることと、アプリに利用状況分析用 SDK がないことを明記しなければならない。
5. 本番配布の前に、実機で TestFlight と Play のクローズドテストを完了する。実際にストア署名されたアプリで普遍的な Links / App Links を検証する。
6. `docs/mobile/mobile-privacy.md` と `docs/mobile/mobile-support.md` のプライバシー、サポート、セキュリティ連絡先の記載を確認し、両ストアの掲載情報で使用する、責任者管理下の HTTPS URL で公開する。

本番環境の OTA 更新は無効とする。JavaScript またはネイティブコードを変更するたびに、新しいストア配布物、SBOM、テスト報告書、成果物のダイジェストを用意しなければならない。アプリの設定とリリース対応能力の報告書では、Mainnet を無効に保たなければならない。
