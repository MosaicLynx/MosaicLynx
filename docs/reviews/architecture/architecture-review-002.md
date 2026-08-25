# MosaicLynx Architecture Review 002

## レビュー情報

- 対象: `docs/architecture/architecture.md`
- 前回レビュー: `docs/reviews/architecture/architecture-review-001.md`
- 確認日: 2026-08-25
- 判定: `READY`
- レビュー方針: 前回レビューの `AR-001` / `AR-002` の対応確認を中心に、修正された wallet-core / Binding / Trust Boundary の記述と、指定された回帰範囲だけを確認した。requirements を第一の source of truth とし、採用済み ADR、wallet-core 外部契約、必要な範囲の下流資料を照合した。前回問題なしと判断した領域を全面的に再レビューしていない。変更は本レビュー成果物だけに限定した。

## 総評

前回の `AR-001` と `AR-002` は適切に解消されている。

現行 architecture は、wallet-core v1 の Binding 方式を外部契約として固定し、MosaicLynx 側の未決事項を各 host の adapter / integration、OS 保護との組み合わせ、秘密情報 lifecycle、error mapping、migration 等へ限定している。また、wallet-core の Binding を秘密情報の runtime isolation と同一視せず、WASM が JavaScript と同一 execution context で動作し得ること、page / Content Script へ Binding を公開しないこと、実際の保護が trusted host context・Browser / OS boundary・host lifecycle との組み合わせで成立することを明示している。

この修正によって wallet-core と MosaicLynx の責任分界、Browser Extension の Trust Boundary、Mobile の host responsibility、秘密情報の取扱い、Symbol / NEM の chain-specific responsibility に新たな重大な矛盾は生じていない。全体 architecture は個別コンポーネント設計へ進められる状態である。

## 前回指摘の確認

### AR-001

- Status: `AR-001: RESOLVED`
- 確認結果: wallet-core v1 の Binding 方式そのものは未決扱いされていない。architecture §6.8 と §15 は、WASM を `wasm-bindgen`、Native を `bindings/native` の C ABI とする固定済み外部契約を明記し、Binding の責任を buffer、DTO、error / warning、ownership の変換に限定している。MosaicLynx 側は、固定済み Binding を各 host から呼び出す adapter / integration、React Native 連携、OS protection integration、host lifecycle、error mapping、migration および opaque Store の保存を担当する構成になっている。
- 根拠: architecture §6.8、§15、§17。共通要件 `CR-013`、`CR-OPEN-001`、`CR-OPEN-002` は責任境界を確定し、具体的な Application / platform integration を下流へ委譲している。`_snwc/docs/decisions/binding-implementation.md` §決定および `_snwc/docs/specifications/specification.md` §13 は v1 の `wasm-bindgen` / Native C ABI、byte buffer、DTO、error / warning、ownership の契約を固定している。

確認できた点:

- wallet-core の固定済み外部契約を MosaicLynx が再定義していない。
- MosaicLynx は固定済み Binding の利用側として位置付けられ、鍵導出、暗号、秘密情報処理、raw signing、Binding 内部の ownership 規則を再実装していない。
- wallet-core の Profile / Software Key と MosaicLynx Application の Profile / Account の対応は未決の integration として残されている。
- backup / restore、migration、OS protection、host lifecycle の具体方式を architecture が過剰に確定していない。
- wallet-core v1 の Binding 方式を変更する場合に `_snwc` の決定記録・仕様書を先に更新する制約が明記されている。

### AR-002

- Status: `AR-002: RESOLVED`
- 確認結果: WASM の保証レベルは、portable な Binding / API 実行方式として利用できる一方、秘密情報を JavaScript、host runtime、別 process または hardware から自動隔離する security boundary ではないと明確に整理されている。WASM linear memory、JavaScript input buffer、glue code、runtime copy の完全な隔離・消去を Core の zeroize に期待しないことも明記されている。WASM を危険または不採用とする過剰な結論はなく、固定済み Binding を trusted host context で利用する設計として扱われている。
- 根拠: architecture §6.8、§8、§9、§11、§15、§16。`_snwc/docs/decisions/binding-implementation.md` §WASM / Browser security contract は、WASM が JavaScript と同一 execution context にあり、page context へ Wallet Core を直接公開すべきでないことを定める。Browser Extension 要件 `BR-006`、`BR-011` および共通要件 `CR-NFR-002` の page / extension 分離、未検証入力からの保護、秘密情報の不要な複製・出力禁止と整合する。

確認できた点:

- wallet-core の Binding は秘密情報処理の正本・論理 / API 境界であり、runtime isolation そのものではないと区別されている。
- Web page、injected Provider、Content Script および Relay から wallet-core Binding へ直接到達させない Trust Boundary が維持されている。
- Browser では approval UI / trusted host から fixed wallet-core Binding を利用し、Service Worker の寿命や unlocked session の保持を秘密情報保護の前提にしていない。
- Mobile では OS protection、host lifecycle、認証および Binding integration の保証範囲を Mobile Application / platform の責任として残している。
- WASM engine、browser sandbox、TEE 等の実装詳細を architecture の必須設計へ過剰に持ち込んでいない。

## 回帰確認

- wallet-core / MosaicLynx の責任分界: wallet-core は Wallet Store、鍵導出、秘密情報を使用する暗号処理、public identity および raw signing を担い、MosaicLynx は Profile / Account の Application 管理、Permission、transaction / message の意味解析、表示、承認、host / Relay integration および orchestration を担う。この分界は `CR-013` と一致する。
- Browser Extension の Trust Boundary: page / Provider / Content Script は搬送・公開境界に留まり、privileged layer が browser context、Permission、要求完全性、承認および lifecycle を検証する。fixed Binding は approval UI / trusted host 側で利用され、page / Content Script へ公開されない。`BR-002`、`BR-006`、`BR-007`、`BR-009` との矛盾はない。
- Mobile の host responsibility: Mobile は固定済み Binding の利用側として、外部 handoff、Application Profile / Account、承認 UI、認証、OS protection、lifecycle、backup / migration の提供範囲を管理する。wallet-core が OS secure storage や Profile 全体 backup を担うという逆転は生じていない。`MR-005`〜`MR-009` と整合する。
- Secret handling boundary: wallet-core の Core が管理する一時 buffer と、host 側の input / output buffer、runtime copy、保存、lifecycle を分離している。Relay、SDK、page、Provider、Content Script、URL、ログ等へ秘密情報を不要に渡さない方針も維持されている。
- Binding / migration / lifecycle: Binding 方式は固定済み、各 host の利用方式・lifecycle・error mapping・migration は未決として残されている。Profile 全体 backup / restore も共通必須化されていない。
- Symbol / NEM: 共通化は request / approval / lifecycle 等に限定され、transaction / message semantics、address、network、署名対象 bytes、chain-specific inspection は固有責務として維持されている。Binding の明確化による chain responsibility の逆転はない。

## 新規指摘

新規指摘: なし

今回の修正によって `BLOCKER`、`HIGH` または `MEDIUM` 相当の新規問題は確認されなかった。`LOW` / `NIT` レベルの表現上の改善も、今回の再レビューでは指摘しない。

## 未決事項の評価

- `CR-OPEN-001` / `CR-OPEN-002` は、固定済み Binding を各 host から利用する adapter / integration、OS protection integration、秘密情報 lifecycle、error mapping、Profile / Account 対応および migration を扱う未決事項として適切である。Binding 方式そのものを再決定する未決事項にはなっていない。
- Mobile の handoff、OS protection、認証、lifecycle、backup / migration および release の詳細は、architecture が必要な責任境界だけを示し、具体方式を後続設計へ送っている。requirements 上の未決事項を勝手に確定していない。
- SDK の transport 選択、transaction construction、runtime / distribution、versioning、caller binding、Relay の wire / milestone 詳細は、前回レビューで妥当とした未決範囲から変更されていない。
- Message signing の具体 format、Symbol / NEM の対応 type、aggregate / multisig / cosignature の範囲、Profile 全体 backup / restore の platform 分担は、v1 の共通能力・安全境界を維持したまま下流仕様へ委譲されている。

## 最終判定

`READY`

AR-001 / AR-002 は解消され、wallet-core の固定済み外部契約と MosaicLynx の host integration の責任分界、WASM の保証レベル、Browser / Mobile の秘密情報境界が architecture 上で判断可能になった。新規の重大指摘もないため、個別コンポーネント設計へ進んでよい。
