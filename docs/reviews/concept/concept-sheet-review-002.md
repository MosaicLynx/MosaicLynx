# MosaicLynx Concept Sheet フル再レビュー

## レビュー情報

- 対象ファイル: [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)
- 確認日: 2026-08-27
- 使用した Skill: [`.agents/skills/concept-review/SKILL.md`](../../../.agents/skills/concept-review/SKILL.md)
- 位置付け: 復元後の `concept-review` Skill を適用した、Skill 復元後のフル再レビュー
- 実施方法: `concept-review` Skill と [`.agents/project-context.md`](../../../.agents/project-context.md) を適用した単独レビュー。サブエージェントは使用していない。
- 独立性: 過去レビューの指摘解消確認ではなく、過去の `READY` 判定を前提にしない独立した新規レビューとして、Concept Sheet 全体をゼロベースで評価した。
- 変更範囲: レビュー成果物 [`concept-sheet-review-002.md`](./concept-sheet-review-002.md) の新規作成のみ。Concept Sheet、Requirements、Design、Specification、ADR、実装コードおよび Skill は変更していない。

## 総評

中心価値、第一対象である一般ユーザー、dApp 開発者と運用者の位置付け、Symbol / NEM と Mainnet / Testnet の区別、Signer の責任、Relay の非署名責任、非対象範囲、Mainnet gate、成功条件および OPEN / FUTURE の区分は、Concept として概ね整理されている。API、データ形式、暗号方式、UI、実装方式および詳細な処理手順を要求していない点も、Concept のフェーズ境界に適合している。

ただし、現状のままでは、Web 側 SDK を含む信頼境界と、Relay を含む v1 の製品構成が一読で確定しない。さらに、署名を成立させる利用者の認証・ロック・Account 認可の前提と、backup / restore の v1 範囲も明示不足である。これらは下流の API や暗号の詳細ではなく、署名器としての責任境界とスコープを決める Concept レベルの事項である。

## 指摘一覧

### CSR-001 — MEDIUM: Relay milestone と Signer の製品境界が曖昧

- 対象箇所: [Concept Sheet §1](../../concept/concept-sheet.md#1-概要) 5〜20行、[§6.5](../../concept/concept-sheet.md#65-提供形態を段階的に広げる) 95〜97行、[§8](../../concept/concept-sheet.md#8-コンセプト上の主要機能) 112〜124行、[§9](../../concept/concept-sheet.md#9-対象範囲) 126〜137行、[§14](../../concept/concept-sheet.md#14-成功条件) 216〜229行
- 問題: MosaicLynx 自体を Signer と定義しながら、Browser Extension、Android、iOS、Relay を同列の4 milestone として「同じ中核価値を広げる」と記述している。別の箇所では Relay が意味解釈・承認・署名を担わないと定めているため、Relay が Signer の提供形態なのか、Mobile Signer を支える非署名基盤なのかが本文だけでは一貫して読めない。
- 理由: Relay milestone の完了が全体 v1 の完了条件であるため、Relay の完了が利用者向け Signer 価値の完了を意味するのか、受け渡し境界の完了を意味するのかを誤ると、対象範囲、成功条件、責任主体および後続 milestone の判定がずれる。既存の共通要件は Relay を Signer ではない受け渡し基盤として扱っている（[`docs/requirements/requirements.md` §1・§3](../../requirements/requirements.md#1-文書の目的と位置付け)）。
- Concept レベルで必要な修正方針: 「Signer は Browser Extension / Android / iOS の利用者向け署名主体、Relay は Mobile Signer を接続する非署名の受け渡し基盤」と製品構成を明記する。Relay milestone の完了は、Relay 自身が署名価値を提供することではなく、Mobile Signer の承認・認証・署名責任を迂回しない受け渡し境界が成立することとして整理する。個別完了条件、transport、状態遷移および protocol は下位フェーズへ委譲する。
- 下位フェーズへの委譲: Relay の API、暗号化、保存、期限、失敗分類および milestone の具体的受け入れ条件は Requirements / Design / Specification で定める。

### CSR-002 — HIGH: Web 側 SDK の信頼境界と責任が Concept に現れていない

- 対象箇所: [Concept Sheet §2](../../concept/concept-sheet.md#2-背景) 23〜27行、[§4](../../concept/concept-sheet.md#4-コンセプト) 51〜55行、[§5](../../concept/concept-sheet.md#5-想定利用者) 65〜67行、[§8](../../concept/concept-sheet.md#8-コンセプト上の主要機能) 110〜124行、[§13](../../concept/concept-sheet.md#13-セキュリティプライバシー) 197〜214行
- 問題: SDK は「異なる責任を持つもの」および「共通の署名接点」として登場するが、想定主体、対象範囲、信頼しないもの、秘密情報を扱わない責任のいずれにも位置付けられていない。Web page 上で dApp とともに動く SDK が、Signer 本体または信頼できる署名・承認主体と誤解される余地がある。
- 理由: 「秘密情報を dApp / Web page / Relay に公開しない」という原則だけでは、Web 側 SDK がその Web 境界に含まれるのか、SDK が秘密情報や承認判断を担うのかが明確にならない。これは transport の API 詳細ではなく、秘密情報分離と利用者承認の Trust Boundary に関わる。既存の SDK 要件は SDK を連携・受け渡しの責任主体とし、秘密情報、承認 UI、Signer 本体および Wallet Core を責任外としている（[`docs/requirements/sdk.md` §2〜§3](../../requirements/sdk.md#22-対象利用者と責任主体)）。
- Concept レベルで必要な修正方針: SDK を dApp 側の連携・要求／結果受け渡しの接点とし、Signer ではなく、秘密情報の保管・復号・署名および利用者の最終承認を担わないことを明記する。SDK を含む Web 側の入力は信頼境界の外側として扱う、という概念レベルの整理で足りる。API 名、transport、暗号方式および caller binding の詳細は追加しない。
- 下位フェーズへの委譲: SDK の公開契約、Provider / Mobile handoff、Origin 検証、結果検証および具体的な threat model は Requirements / Design / Specification で定める。

### CSR-003 — MEDIUM: 署名を成立させる認証・ロック・Account 認可の前提が暗黙的

- 対象箇所: [Concept Sheet §6.3](../../concept/concept-sheet.md#63-一般ユーザーが承認または拒否する) 87〜89行、[§8](../../concept/concept-sheet.md#8-コンセプト上の主要機能) 110〜124行、[§11](../../concept/concept-sheet.md#11-基本原則) 155〜183行、[§13](../../concept/concept-sheet.md#13-セキュリティプライバシー) 197〜214行
- 問題: 本文は「明示的な承認」を要求し、認証を安全側に倒す条件の一つとして挙げるが、Signer が秘密情報へアクセスして署名できるための利用者認証・ロック解除・選択 Account の認可が、署名の前提条件として整理されていない。dApp の要求と利用者の承認だけで署名が成立するようにも読める。
- 理由: 明示的な承認は中心価値だが、それだけでは、ロック中の署名、認証状態を欠く署名、未許可 Account の利用、または Web 側主体による署名可能状態の確立を排除できない。認証方式や再認証頻度を決める必要はないが、「誰がどの境界で署名を許可するか」は Concept の security / responsibility boundary として必要である。既存要件も、認証・対象確認等の失敗時は署名結果を返さず終了する前提を採用している（[`docs/requirements/requirements.md` CR-010](../../requirements/requirements.md#cr-010-共通の安全側失敗signer--end-to-end)）。
- Concept レベルで必要な修正方針: Signer は、利用者が管理する認証・ロック状態および署名 Account の認可条件を満たした場合にだけ秘密情報を使用して署名でき、dApp / SDK / Relay はその条件を確立・迂回できない、と概念レベルで明記する。認証手段、保存、session、画面および失敗コードは下位フェーズへ委譲する。
- 下位フェーズへの委譲: password、PIN、生体認証、OS 保護、ロック lifecycle、Account permission の具体方式と UI は Requirements / Design / Specification で定める。

### CSR-004 — MEDIUM: backup / restore が v1 の範囲か保護対象の条件か不明確

- 対象箇所: [Concept Sheet §11](../../concept/concept-sheet.md#11-基本原則) 181〜183行、[§13](../../concept/concept-sheet.md#13-セキュリティプライバシー) 197〜214行、[§15](../../concept/concept-sheet.md#15-未決事項) 231〜267行
- 問題: `backup の平文` を保護対象とし、「認証、復元」に確信がない場合は進めないと記載している一方、backup / restore は対象範囲、非対象範囲、v1 milestone、OPEN または FUTURE のいずれにも分類されていない。
- 理由: 読者は backup / restore を v1 の Signer 能力と受け取る可能性がある。これは、backup を v1 全体の共通必須能力・完了条件に含めないという下流の整理（[`docs/requirements/requirements.md` CR-014](../../requirements/requirements.md#cr-014-profile-全体-backup--restore-の共通要件への非包含)）と、Concept のスコープ追跡を不明確にする。保護対象として挙げること自体は、機能が将来存在する場合の security 前提として妥当だが、提供を決めたこととは区別する必要がある。
- Concept レベルで必要な修正方針: backup / restore を現行 v1 の共通能力・完了条件に含めないのか、特定 milestone の別判断または将来検討とするのかを明記する。含めない場合も、将来提供する可能性がある秘密情報として条件付きで保護対象に挙げる、という書き方にする。backup format、暗号、復元手順および wallet-core の責任分担は追加せず下位フェーズへ委譲する。
- 下位フェーズへの委譲: 個別 platform / release で提供する場合の復元対象、互換性、保管方式および責任分担は、その release の Requirements / Design / Specification で定める。

### CSR-005 — MEDIUM: 「安全」「公開されない」という security 成功条件の保証境界が広すぎる

- 対象箇所: [Concept Sheet §1](../../concept/concept-sheet.md#1-概要) 3〜9行、[§4](../../concept/concept-sheet.md#4-コンセプト) 51〜55行、[§7](../../concept/concept-sheet.md#7-提供価値) 99〜108行、[§8](../../concept/concept-sheet.md#8-コンセプト上の主要機能) 110〜124行、[§11](../../concept/concept-sheet.md#11-基本原則) 155〜183行、[§13〜§14](../../concept/concept-sheet.md#13-セキュリティプライバシー) 197〜229行
- 問題: Concept は「安全に署名できる」「秘密情報が dApp、Web page、Relay へ公開されない」と成功状態を置いているが、どの信頼済み Signer 境界の通常動作に対する主張なのか、侵害された dApp / Web page / OS / 配布 artifact まで保証するのかが区別されていない。
- 理由: Concept §13 は具体的 threat model を下位へ委譲するとしているため、詳細な攻撃分類を追加する必要はない。しかし保証境界を限定しない成功条件は、MosaicLynx が外部環境の侵害や利用者端末全体まで防ぐという過大な期待を生み得る。既存仕様は Browser Extension の software signer の保証範囲を OS、browser、extension process、配布 artifact の侵害まで拡張しないと明記している（[`docs/specifications/product-spec.md` §17.1.1](../../specifications/product-spec.md#1711-保証レベルと脅威モデル)）。
- Concept レベルで必要な修正方針: 成功条件と価値を、MosaicLynx が管理する Signer / 承認境界における秘密情報分離と明示承認の保証として表現し、外部 dApp、Web page、OS、端末および正規配布物の侵害まで保証するものではないことを短く明記する。攻撃シナリオ、暗号、保存および platform capability は下位フェーズへ委譲する。
- 下位フェーズへの委譲: 詳細な脅威モデル、保証対象、残余リスク、platform ごとの保護能力および release gate は Design / Specification / release 文書で定める。

### CSR-006 — LOW: Concept に下流工程への作業指示と repository 運用情報が混在している

- 対象箇所: [Concept Sheet §12](../../concept/concept-sheet.md#12-制約) 185〜195行、[§13](../../concept/concept-sheet.md#13-セキュリティプライバシー) 197〜214行、[§16](../../concept/concept-sheet.md#16-次フェーズ) 269〜289行
- 問題: 「既存仕様書を本方針に整合させる」「要件定義で API 等を独断で追加しない」「既存実装・SDK 利便 API・テスト結果をプロトコル正しさの根拠にしない」といった文、および `AGENTS.md` / `.agents/project-context.md` を根拠資料に含める構成が、製品 Concept と repository の作業指針を混在させている。
- 理由: Concept の責務は「何を・なぜ作るか」と製品境界を示すことであり、下流文書の編集方針、検証方法、正本管理または repository の現在状態を製品判断として持たせることではない。特に既存仕様を後続工程で Concept に合わせるという記述は、文書の役割と変更責任を曖昧にし、Concept にない新しい設計判断を誘発する。
- Concept レベルで必要な修正方針: 製品上の制約（Mainnet gate、Relay が署名しない等）は残し、文書作成・検証・下流資料の整合方法に関する指示は削除または `AGENTS.md` / review 記録へ移す。参照資料は製品判断の根拠と作業上の補助資料を分ける。
- 下位フェーズへの委譲: API、データ、暗号、実装およびテストの詳細を定めないというフェーズ境界自体は、Requirements / Design の文書方針として維持する。

### CSR-007 — NIT: OPEN 番号の欠番を明示していない

- 対象箇所: [Concept Sheet §15](../../concept/concept-sheet.md#15-未決事項) 231〜257行
- 問題: OPEN-001、OPEN-002、OPEN-003 の次が OPEN-005 になっているが、OPEN-004 を廃止・予約した理由が本文にない。
- 理由: 欠番そのものは Concept の成立性を損なわないが、Requirements や review から OPEN を追跡すると、未記載の論点を見落としたのか、意図的に欠番としたのかを判断できない。
- Concept レベルで必要な修正方針: OPEN-004 が不要になったなら廃止済みであることを短く記録し、未決事項なら内容を追加する。単なる連番整理であり、新機能や下位仕様を追加する要求ではない。
- 下位フェーズへの委譲: OPEN の具体的な要求化、受け入れ条件および decision log は Requirements / Design で管理する。

## 既存レビューとの関係

既存の [`concept-sheet-review-001.md`](./concept-sheet-review-001.md) は `READY` と判定していたが、本レビューではその判定を前提にしていない。

| 過去指摘                              | 今回の確認                                                                                                                                    | 判定上の扱い                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 旧 CS-001: 中心課題の実証が未完了     | `OPEN-001` は現在も未解決だが、課題を仮説として明示し、未確認のまま扱わない方針も記載されている。                                             | Concept の欠陥としての再発ではない。ただし、Requirements で仮説と根拠の状態を追跡する条件は継続する。 |
| 旧 CS-002: 成功条件の判定単位が未定義 | 数値目標、観測範囲、合否判定を下流へ委譲していることは Concept の粒度として妥当である。                                                       | 再発なし。Requirements で観測行動・判定主体・合否を定めるべき事項として引き継ぐ。                     |
| 旧 CS-003: milestone と中心価値の関係 | `OPEN-003` は現在も個別完了条件を保留している。一方、今回の `CSR-001` は、完了条件以前に Relay 自体の製品主体が曖昧である点を新たに指摘する。 | 旧指摘の未決事項は継続。`CSR-001` は同一指摘の単純な再掲ではない。                                    |
| 旧 CS-004: dApp と dApp 開発者の役割  | §5、§6.4、§14 で、開発者と dApp の役割は概ね分けられている。                                                                                  | 再発なし。                                                                                            |

## フェーズ境界確認

### Concept に不足しているもの

- Signer（Browser Extension / Mobile）と非署名の Relay を分けた製品構成。
- SDK を Web 側の連携接点として扱い、Signer・承認主体・秘密情報保管主体ではないとする Trust Boundary。
- 利用者認証、ロック状態、署名 Account 認可が署名の前提であり、Web 側や Relay が迂回できないという概念前提。
- backup / restore の v1 共通範囲への包含・非包含の分類。
- 「安全」「秘密情報が公開されない」という主張の保証境界。

### Concept に入り込みすぎている下位フェーズ詳細

- 製品価値と無関係な、下流文書の編集・整合、プロトコル正しさの根拠、要件定義での追加禁止に関する作業指示（CSR-006）。
- それ以外の API、データ形式、暗号方式、状態遷移、実装ライブラリ、テスト手順を対象外として扱う記述は、Concept のフェーズ境界を示すための範囲に留まっており、過剰な仕様化とは判定しない。

### Requirements / Design / Specification へ委譲すべき事項

- SDK の API、Provider、transport、Origin / caller binding、Relay protocol、暗号、保存、期限、状態遷移およびエラー分類。
- 認証方式、lock / unlock lifecycle、OS 保護、Account permission、秘密情報の保存・復号・memory lifecycle。
- backup / restore を個別 release で提供する場合の形式、復元対象、互換性および wallet-core との責任分担。
- Symbol / NEM の transaction schema、canonicalization、署名 byte、表示項目、UI、受け入れ条件および詳細 threat model。
- `wallet-core` の Binding、API、鍵導出、Wallet Store および raw signing の具体的な実装方式。Concept でこれらを決める必要はなく、現状の Concept にそれ自体の矛盾はない。

## 最終判定

**REVISE CONCEPT**

次回レビューまでに解決すべき指摘 ID は `CSR-001`、`CSR-002`、`CSR-003`、`CSR-004`、`CSR-005` である。`CSR-006` と `CSR-007` は、再レビュー前に整理することを推奨するが、これら単独では Concept の成立性を阻害しない。

## Validation

- Markdown format: `pnpm exec prettier --check docs/reviews/concept/concept-sheet-review-002.md` は通過した。
- repository 内リンク: 対象・参照資料への47個の repository 内リンクと見出しアンカーを確認し、欠落はなかった。
- 指摘 ID の重複: `CSR-001`〜`CSR-007` が一意であることを確認した。
- 既存レビューの上書きがないこと: `concept-sheet-review-001.md` を保持し、新規 `concept-sheet-review-002.md` を作成した。
- Source 非変更: Concept Sheet、Requirements、Design、Specification、ADR、実装コード、Skill の差分はなく、作業開始前から存在する `_nem` と `_symbol` の変更も保持している。
- `git diff --check`: tracked diff と新規レビュー成果物の whitespace check を通過した。
- repository 全体の formatter: `pnpm format:check` は完了前に大量の既存 warning と、`_nem` および `_sns` 配下の既存 HTML 構文エラーを検出したため、今回の成果物単体の成功とは分けて扱う。対象外サブツリーの既存エラーであり、今回のレビュー成果物によるものではない。全体結果は完了まで取得できなかったため、repository 全体については `Not validated` とする。

## 参照資料

- [`docs/concept/concept-sheet.md`](../../concept/concept-sheet.md)
- [`docs/reviews/concept/concept-sheet-review-001.md`](./concept-sheet-review-001.md)
- [`docs/requirements/requirements.md`](../../requirements/requirements.md)
- [`docs/requirements/sdk.md`](../../requirements/sdk.md)
- [`docs/design/architecture.md`](../../design/architecture.md)
- [`docs/specifications/product-spec.md`](../../specifications/product-spec.md)
- [`docs/specifications/profile-account-spec.md`](../../specifications/profile-account-spec.md)
- [`docs/specifications/web-transaction-handoff-spec.md`](../../specifications/web-transaction-handoff-spec.md)
- [`docs/release/mainnet-release-evidence.md`](../../release/mainnet-release-evidence.md)
- [`.agents/project-context.md`](../../../.agents/project-context.md)
