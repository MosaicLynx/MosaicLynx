# MosaicLynx 共通データモデル・インターフェース基本設計 再レビュー 002

## 1. レビュー情報

- 対象: [`docs/design/interfaces.md`](../../design/interfaces.md)
- 前回レビュー: [`interfaces-review-001.md`](./interfaces-review-001.md)
- レビュー種別: 前回指摘 IF-001〜IF-003 の解消確認
- レビュー範囲: 修正による回帰と、今回の修正で新たに生じた重大な問題の有無
- 参照資料: [`security-design.md`](../../design/security-design.md)、[`signing-flow.md`](../../design/signing-flow.md)

前回レビューの Issue / Rationale / Recommendation と、修正後の設計本文を比較した。基本設計全体の全面再レビューや、詳細仕様の不足を新規指摘するレビューは行っていない。

## 2. 総評

IF-001〜IF-003 は、いずれも前回の指摘内容を満たす形で解消されている。公開 Account identity と Signer 内部の account reference、署名結果と配送状態、Network context と Relay / node の役割が、それぞれ基本設計上の概念として区別された。

修正後も、秘密情報を共通モデルへ含めない原則、Signer を最終的な署名 authority とする境界、外部入力を untrusted とする扱い、TransactionSummary を署名対象の authority としない原則、および Chain / Network の分離は維持されている。今回の修正による新たな BLOCKER / HIGH または下位設計を妨げる問題は確認されなかった。

## 3. 前回指摘の解消状況

| ID     | 判定         | 確認結果                                                                                                                    |
| ------ | ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| IF-001 | **RESOLVED** | Public account identity と Internal account reference が分離され、内部 reference の解決・検証と外部公開範囲が明確化された。 |
| IF-002 | **RESOLVED** | `FAILED`、`RESULT_UNKNOWN`、`DELIVERY_UNKNOWN` の意味と後続処理上の安全境界が区別された。                                   |
| IF-003 | **RESOLVED** | Relay / node は Network context の authority ではなく untrusted な情報源に限定され、Signer 側の検証責任が明確化された。     |

### IF-001: Public account identity と Internal account reference

- **判定:** `RESOLVED`
- **Location:** [`interfaces.md` §6.2](../../design/interfaces.md)（Account、公開 identity と内部 reference、特に lines 135–170）、§6.3（SigningRequest、lines 172–192）
- **前回の Issue:** 公開 Account identity と Application / Signer 内部の account reference が同じ共通モデル内で区別されず、外部 requester が内部参照を鍵選択へ利用できる余地があった。
- **Rationale:** `Account` は Chain、Network、address、public key、display information を持つ Public account identity と定義され、Internal account reference は Profile、permission、wallet-core の key slot 等を Signer 内部で解決する内部 context と明記された。内部 reference は秘密鍵そのものでも導出秘密でもなく、Signer trust boundary 内で Profile、permission、Account identity、signing context と照合して解決・検証される。外部 Web App / dApp / requester が任意に指定して鍵を直接選択する capability ではなく、公開 API、Relay、dApp、Web App へ不要に出さない原則も示されている。
- **Recommendation 対応確認:** 内部 reference の形式や保存方式を未確定のまま下位設計へ委譲しつつ、外部 requester から提供された reference は補助情報にとどまり、Signer の選択・認可 authority にならない契約が追加されている。private key、mnemonic、seed、decrypted secret 等を `Account` に含めない原則も維持されている。

### IF-002: 署名結果不明と配送不明の共通結果モデル

- **判定:** `RESOLVED`
- **Location:** [`interfaces.md` §6.4](../../design/interfaces.md)（SigningResponse の結果の状態、lines 194–217）、§6.6（Error、lines 238–255）、§9（Security Considerations、lines 323–334）
- **前回の Issue:** `RESULT_UNKNOWN` と `DELIVERY_UNKNOWN` が共通結果モデルに明示されず、`failed` への畳み込みや、二重署名・危険な再試行を防ぐ契約が不十分だった。
- **Rationale:** `failed` は処理失敗が確定した状態、`RESULT_UNKNOWN` は success / user rejected / failed のいずれも安全に確定できない処理結果、`DELIVERY_UNKNOWN` は request / response の配送状態を確定できない disposition として定義されている。`RESULT_UNKNOWN` は成功として返さず同一 request の自動再署名を行わない。署名生成済みで配送だけ不明な場合は概念上 `success + DELIVERY_UNKNOWN` とし、同じ target の再署名ではなく既存 result の再送・照会だけを候補とする。request の配送不明についても、未送信・失敗と推測した同一 request の自動再送を禁止している。
- **Recommendation 対応確認:** `RESULT_UNKNOWN` / `DELIVERY_UNKNOWN` を `USER_REJECTED`、`SIGNING_FAILED`、`RELAY_ERROR` または相互の別状態へ自動変換しないことが Error と Security Considerations にも反映されている。retry 回数、timeout、ACK、idempotency、wire protocol の詳細は下位 protocol design へ委譲されており、基本設計として必要な安全上の区別は成立している。既存の [`signing-flow.md` §7.3–§7.4](../../design/signing-flow.md) および §20.3 の責務とも整合する。

### IF-003: Network context と Relay / node の semantic authority

- **判定:** `RESOLVED`
- **Location:** [`interfaces.md` §4.1–§4.2](../../design/interfaces.md)（lines 75–100）、§6.1（Network、lines 122–133）
- **前回の Issue:** Network の producer に Relay / node を含める表現が、opaque transport と Network の semantic authority の境界を曖昧にしていた。
- **Rationale:** Network context を要求へ申告・transport する producer と、payload・Profile・Account・対象 Chain と照合して Signer-local な trusted context を導出・確定する Signer / chain-specific integration が明示的に分けられた。Relay と blockchain node は Network metadata の untrusted な搬送元・観測元・候補提供元にとどまり、Network model を生成・確定・上書きする authority ではない。未確定、wrong network、または Chain / Network 不一致は署名へ進めないため、Relay が Signer の validation を代替する構造にもなっていない。
- **Recommendation 対応確認:** node discovery、node selection、chain verification、network fingerprinting などの方式をこの基本設計へ過剰に追加せず、検証の最終責任を Signer / chain-specific integration に置く整理ができている。[`security-design.md` §11.1–§11.2](../../design/security-design.md) および [`signing-flow.md` §2.4–§2.5](../../design/signing-flow.md) の Relay / node trust model とも矛盾しない。

## 4. 回帰確認

| 確認項目                               | 判定     | 確認結果                                                                                                                             |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Secret isolation                       | 回帰なし | `Account`、`SigningRequest`、`SigningResponse` 等に private key、mnemonic、seed、decrypted secret 等を含めない原則が維持されている。 |
| Fail-closed                            | 回帰なし | unknown / 不一致の Chain・Network、未検証の内部 reference、結果不明・配送不明を成功として扱わない。                                  |
| Signer が最終 signing authority        | 回帰なし | 内部 Account 解決、Network validation、署名結果の確定は Signer / chain-specific integration 側に残っている。                         |
| Relay が security authority にならない | 回帰なし | Relay は opaque / untrusted な通信仲介であり、署名判断・Network 確定・利用者承認を代替しない。                                       |
| External input は untrusted            | 回帰なし | 外部 requester、Relay、node 由来の reference・metadata・summary は無条件に trusted とされない。                                      |
| TransactionSummary の位置付け          | 回帰なし | Summary は表示・確認用の derived information であり、実 signing target の authority ではない。                                       |
| Chain / Network の概念分離             | 回帰なし | Symbol / NEM と各 Network を別概念として扱い、不一致は署名前に拒否する。                                                             |
| 基本設計と詳細設計の責務分離           | 回帰なし | retry、idempotency、wire protocol、node verification 等の詳細は下位設計へ委譲されている。                                            |

## 5. 新規指摘

なし。今回の修正によって新たに生じた SECURITY 上の重大な問題、Trust Boundary の破綻、requirements / security design との明確な矛盾、または下位設計を妨げる欠落は確認されなかった。

新規指摘件数: 0（BLOCKER 0 / HIGH 0 / MEDIUM 0 / LOW 0 / NIT 0）

## 6. 最終判定

IF-001〜IF-003 はすべて `RESOLVED` であり、新たな BLOCKER / HIGH はない。共通データモデル・インターフェース基本設計として、下位設計へ進めてよい。

**READY**

> INTERFACES DESIGN READY
