# Review Playbook

レビュー系 Skill 共通の実行規則。各レビュー Skill は、この文書を読んだうえで、対象種別の reviewers、review-gates、output-format と、適用対象の repository instructions を適用する。

## 目的

レビューの目的は、既存の要求・仕様・実装・公開契約に対する具体的な不備を検出し、次工程へ進める品質を判定することである。新しい機能、設計、互換層、抽象化、運用機能を提案する場ではない。

完璧さや軽微な指摘の解消を目的にレビューを継続しない。定義された品質 gate を満たした時点で終了する。ただし、適用対象の repository instructions が必要な gate や検証を定めている場合、未確認を合格扱いにしない。

## Repository instructions と根拠

作業開始時に、ユーザーが明示した対象・範囲と、対象に適用される repository instructions を確認する。そこからレビュー対象の候補、成果物の配置、Source of Truth、repository 固有の境界、追加 gate、validation、報告規約を取得する。

repository instructions がない、または必要な情報を定義していない場合は、ユーザーが指定した対象と確認できる既存資料だけを使用する。対象、正本、repository 固有 gate、検証結果を推測で補わない。

過去レビュー成果物は、原則として finding ID と状態の追跡にだけ使う。過去レビューの主張を今回の新しい根拠として再利用しない。ただし、対象種別の品質 gate が前段レビューの判定を要求する場合は、公開された判定と指摘状態だけを確認する。

根拠の種別を区別する。主な種別は、対象本文、ユーザー提供資料、承認済み要件、承認済み仕様、ADR、実装コードまたは差分、テストまたは fixture、対象分野の公式仕様、公式実装・schema、package manifest、実行結果である。

資料間に競合がある場合、対象、環境、version、資料の役割、更新時点を分けて記録する。解消できない競合を勝手に採用しない。実装やテストの現在挙動だけで、要求・仕様・設計判断を正当化しない。

## 実行主体

- メインエージェントは Review Board Chair として、対象の確定、根拠の管理、指摘の統合、gate 判定、成果物作成を行う。
- Reviewer A 以降は独立した観点で確認する。サブエージェント機能が利用可能で依頼範囲に適合する場合は観点ごとに委譲してよい。
- サブエージェントを使用しない場合は、メインエージェントが同じ資料を観点ごとに分離して確認する。実施していない起動、並列実行、返答確認を記録しない。
- Phase 1 の観点同士に、他の観点の結論や指摘を先に混ぜない。独立性は、別エージェントまたは別作業パスで確保する。

## 実行フェーズ

### Phase 0: 対象・根拠・境界

1. ユーザーが明示した対象と範囲を優先する。
2. 対象が明示されていない場合は、repository instructions と対象 Skill の候補探索規則を使う。候補が 0 件または複数件なら推測で選ばない。
3. 変更対象、上流資料、補助資料、成果物の出力先、未確認範囲を確定する。
4. レビュー種別の責務を越える資料や対象を、根拠として混ぜない。

### Phase 1: 独立レビュー

各 Reviewer は、自分の担当観点について次を記録する。

- 仮 ID
- 対象箇所
- 確認できた事実
- 既存の要求・制約・契約または品質 gate との関係
- 発生条件または不足条件
- 放置した場合の影響
- 必要な最小修正または確認
- 未確認範囲

指摘を作る前に、次をすべて確認する。

1. 既存の根拠に追跡できるか。
2. 現在のスコープで具体的な影響があるか。
3. 仕様・設計・実装のどの工程で初めて決めてもよい事項ではないか。
4. 新しい要求、機能、制約、方式、将来拡張を追加していないか。

根拠を示せないもの、現在の範囲に影響がないもの、下流工程だけで解消できるもの、または未要求の追加に該当するものは正式指摘にしない。

確認対象に応じて、次の汎用的な品質を評価する。

- scope、責任、trust boundary、データ所有、fail-closed の境界
- 入力検証、malformed / truncated / unsupported input、境界値、重複、改ざん
- 認証、認可、秘密情報、完全性、replay、期限、失敗時の安全性
- deterministic behavior、encoding、serialization、数値精度、外部形式との相互運用性
- 正常系、異常系、回帰、互換性、観測可能な結果、検証可能性

対象分野固有の protocol、platform、network、SDK、暗号、データ形式、責務境界は、repository instructions または承認済み docs / ADR / 公式資料から取得する。固有の前提を Skill の既定値として補わない。

### Phase 2: 反証・統合

Chair は Phase 1 の候補を重複排除し、各候補へ次の反証を行う。

- 根拠は対象本文、差分、承認済み資料、公式資料のどれかへ直接追跡できるか。
- 問題と影響が、現在の対象範囲で再現または説明できるか。
- 修正内容は必要条件に留まり、特定の方式を押し付けていないか。
- 既存仕様が未決定で正否を判定できないだけではないか。
- 過去指摘の重複、解消、再発、後工程委譲を正しく扱っているか。

必要な場合は、各候補を採用、条件付き採用、却下、重大度変更のいずれかにする。Chair は根拠不足の指摘を推測で補完しない。

### Phase 3: Gate 判定と成果物

1. 対象種別の review-gates を適用する。
2. repository instructions が追加する gate と必須 validation を確認する。
3. gate の不合格、finding の severity、未確認の evidence / context を、以下の共通定義に照らして分類する。すべての gate failure を同じ severity の finding に変換しない。
4. 採用指摘へ正式 ID と状態を付ける。
5. 共通 output-format と対象 Skill の output-format に従って新規成果物を作成する。既存成果物は移動、削除、上書きしない。
6. 実行していない検証、未確認の repository gate、環境依存の確認を成功扱いにしない。

## Severity と Gate の共通定義

`severity` は個々の finding の impact を表し、`gate` はレビュー対象全体を次工程、利用開始、または release へ進めてよいかを表す。severity は gate 判定の主要な入力だが、gate は severity の単純な別名でも、`gate = max severity` のモデルでもない。

### 共通 severity mapping

次の影響ベースの意味を、全 review phase の横断比較に使用する。phase 固有のラベルや例は維持してよいが、同じ影響に対して phase を理由に強さを逆転させない。

- `Critical`: 対象を安全または正しく進めることができない重大問題。security boundary の重大破綻、secret exposure、correctness の根本破綻、irreversible data loss / corruption、重大な contract violation、release artifact integrity compromise など。
- `Major`: 次フェーズへ進む前に修正すべき重要問題。requirement / design / specification の重大欠落、responsibility contradiction、interoperability failure、major compatibility regression、required validation failure、重要な traceability failure など。
- `Minor`: 全体の成立性を壊さないが、品質・明確性・保守性・整合性のため修正が望ましい問題。限定的な ambiguity、non-blocking inconsistency、低影響の documentation / metadata defect、軽微な traceability gap など。
- `Nit`: 意味・安全性・correctness に実質影響しない editorial / cosmetic issue。

phase-specific severity は、次の既定 mapping で比較する。

| phase-specific model    | 共通 severity への既定 mapping                                                     |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `Critical` / `CRITICAL` | `Critical`                                                                         |
| `Major` / `HIGH`        | `Major`                                                                            |
| `Minor` / `MEDIUM`      | `Minor`                                                                            |
| `Nit` / `NIT`           | `Nit`                                                                              |
| README の `ERROR`       | `Critical`                                                                         |
| README の `WARN`        | `Major`                                                                            |
| implementation の `LOW` | `Nit`（editorial / cosmetic に限る）。実質的な品質欠陥は `MEDIUM` / `Minor` とする |

この mapping は phase 固有の impact を置き換えない。phase-specific な例が共通定義より強い影響を示す場合は、影響に対応する上位の共通 severity として扱う。repository instructions が明示的に severity model を override する場合は、その policy を優先する。

### Gate disposition

- unresolved `Critical` は blocking とする。
- unresolved `Major` は generic gate では原則 blocking とする。repository-specific policy が明示的に別の扱いを定める場合だけ、その policy に従う。
- unresolved `Minor` は generic gate では通常 blocking ではない。ただし、件数・組合せ、または repository-specific mandatory policy により blocking / confirmation required になる場合がある。
- unresolved `Nit` は blocking にしない。
- severity finding がなくても、missing mandatory evidence、insufficient context、unresolved scope violation、repository-specific mandatory gate failure、required validation failure は gate を blocking または confirmation required にできる。evidence / context が不足して判定できない場合は confirmation required、失敗が確認できて修正が必要な場合は blocking として記録する。repository-specific policy がその分類を定める場合は優先する。
- すべての applicable gate が評価済みで blocking failure または confirmation required の条件がない場合だけ `READY` 相当とする。non-blocking な `Minor` / `Nit` は、phase-specific output の `Optional Improvements` や条件付き ready として残せる。

各 phase の `review-gates.md` と `SKILL.md` は、この定義を参照して phase 固有の判定名へ変換する。phase 固有の gate 名が異なること自体は問題ではない。

## 成果物の整形と検証

- formatter と format check は、repository instructions が指定するものを、今回作成・更新するレビュー成果物の明示的なパスに対して実行する。
- レビュー対象の package や repository 全体を、formatter のためだけに走査しない。
- repository 全体を走査する format check は、ユーザーが明示した場合または repository の release / quality gate が対象に含める場合だけ実行する。
- 実行結果にはコマンド、成否、未実行理由を記録する。

## 根拠の扱い

対象本文や承認済み資料にない機能、API、field、error、fallback、互換性、監査、監視、backup、抽象化、将来拡張を、レビュー finding として要求しない。

レビュー finding は product requirement を直接追加する根拠ではない。必要な要求や設計判断が不足している場合は、欠陥と断定せず未決定事項または適切な後工程への委譲として分離する。

## Finding の境界

次だけを採用する。

- 現在の対象範囲に直接関係する問題
- 対象本文または承認済み資料に既存の根拠がある問題
- 問題、影響、必要条件を第三者が確認できる問題

次は採用しない。

- 一般論、個人的好み、より良い設計というだけの提案
- 将来の利用者、環境、domain、network、攻撃モデルだけを対象にした問題
- 具体的な解決方式を決めるだけの提案
- 対象外のリファクタリング、性能改善、任意の coverage 数値目標

## Finding の状態と重大度

正式 ID の接頭辞は対象 Skill または repository instructions に従う。今回初めて採用した指摘は New、過去から継続する指摘は Open、対応確認できた過去指摘は Resolved、後工程へ明示的に委譲する指摘は Deferred、Resolved または Deferred 後に再確認した指摘は Reopened とする。

Finding Status には今回確認した正式指摘を一覧化する。Required Changes と Optional Improvements には現在対応が必要なものだけを置き、Resolved Findings と Deferred Findings には状態に対応する過去指摘を置く。

文書レビューでは原則として `Critical`、`Major`、`Minor` を使用し、実装レビューでは対象 Skill が指定する phase-specific severity を使用する。影響の意味、横断 mapping、gate への反映は、上記の共通定義に従う。

対象 Skill がより細かい phase-specific の例を持つ場合も、共通 severity の意味と gate disposition を逆転させない。repository instructions が明示的に severity model または mandatory gate を override する場合は、その policy を優先する。

## 機密情報と安全性

秘密情報、credential、復号データ、実運用の秘密値を、成果物、例外、ログ、テスト出力へ含めない。具体的な秘密情報の種類と信頼境界は、repository instructions と正本資料に従う。

入力、認証、完全性、serialization、外部形式、deterministic behavior の失敗を、根拠なく成功扱いにしない。検証失敗、unknown、unsupported、結果不明を安全側へ扱うという要求が既存資料にある場合は、その適合性を確認する。

## Git 運用

Git の変更、commit、push はユーザーの依頼と repository instructions の範囲で行う。既存のユーザー変更や unrelated change を混ぜず、repository が定める commit message、確認、push 前の手順があれば従う。レビュー対象のファイルを、修正依頼なしに変更しない。
