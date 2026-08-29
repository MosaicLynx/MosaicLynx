---
name: requirements-review
description: requirements artifact を、根拠追跡、scope、actor / responsibility、外部可視性、acceptance criteria、security、相互運用性、failure、未決定事項の観点でレビューし、design / specification へ進める品質を判定する。新しい要求は発明しない。
---

# Requirements Review

requirements artifact を design、specification、実装、書き直しの代わりにせず、次工程を安全に開始できる品質かを判定する。レビューの対象は、何を満たす必要があるか、誰が何に責任を持つか、どう検証できるか、何が未決定かである。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 artifact、review artifact の配置、Source of Truth、repository-specific gate、validation、報告規約を取得する。
2. `../review-common/review-playbook.md`。
3. `reviewers.md`、`review-gates.md`、`output-format.md`。
4. ユーザーが明示した対象、範囲、参照資料。

特定の見出し名、directory、命名、finding prefix、product document のファイル名を前提にしない。repository instructions が示す正本と approved product / domain docs を区別して確認する。

## 対象と上流資料

- ユーザーが明示した requirements artifact 1件を優先する。
- 未指定の場合は、repository instructions の候補探索規則と既存 artifact 構成から対象を特定する。固定 directory、ファイル名、package / application 構成を推測しない。
- 候補が 0 件または複数件、対象範囲が不明、または対象を一意に決められない場合は、自動選択せず、insufficient evidence と確認事項を報告する。
- 対応する concept、前段レビュー、approved specification / design / ADR は、repository instructions が示す範囲で確認する。候補が複数の場合は自動選択しない。
- review artifact の保存場所、命名、連番、finding prefix は repository instructions が定義する場合だけ使用する。定義がなければ固定形式を発明しない。
- 既存レビュー成果物を移動、削除、上書きしない。

## 根拠の範囲

requirements 本文、対応する上流 concept、ユーザー提供資料、承認済み product / domain docs、ADR、repository instructions を主な根拠とする。

API、schema、algorithm、cryptographic parameter、library、database、UI、実装手順の欠落は、requirements として必要な品質・制約・責任の不足を示す場合に限り扱う。下流で決める詳細を、レビューの好みとして要求しない。

code、test、公式資料は、現在の実装状態、成立性、外部事実、既存の明示的な contract を確認する補助 evidence とする。実装がそう動くことだけで requirement を正当化しない。

## レビュー観点

- 各 requirement が purpose、problem、actor、stakeholder、上流資料へ trace できるか。
- scope、non-goal、environment、domain、platform、network、external system、責任、前提、制約、未決定事項が明確か（適用される場合）。
- MUST / SHOULD、外部から観測可能な結果、acceptance criteria、validation evidence が明確か。
- functional、non-functional、security、privacy、integrity、authentication / authorization、availability / reliability、interoperability、operational、observability / operability、deployment / environment、compliance / policy の要求・制約が、適用される根拠の範囲で抜けていないか。
- failure、invalid / malformed / unsupported input、recovery、retry、duplicate、timeout、resource limit を必要な範囲で扱っているか。
- requirement 本文、上流 concept、関連資料との用語・目的・scope の矛盾がないか。
- secret-bearing / signing-capable component、remote / external system、trust boundary、責任の要求が approved source に反していないか。

## 要件レベル境界

各候補について、requirements で決めるべき purpose、責任、品質、外部契約、互換性、制約なのか、design / specification / implementation で初めて決める詳細なのかを確認する。

finding は、approved source と矛盾する、requirement 自身が不完全・曖昧・検証不能である、または scope / responsibility が現在の対象で判定不能になる場合だけ採用する。一般的に必要そうな security、将来の利用者、追加の capability、具体的方式を、新しい要求として要求しない。

requirements の欠落と、単に reviewer が望む追加要求を区別する。必要な判断の根拠が存在しない場合は、要求を発明せず unresolved として記録する。

## 実行と判定

`review-common/review-playbook.md` の Phase 0〜3 と、`reviewers.md` の独立観点を適用する。各候補を根拠、現在の影響、最小の完了条件で反証してから採用する。

`review-gates.md` の generic phase gate を適用した後、repository instructions が定める追加 mandatory gate、required evidence、review policy を適用する。repository-specific gate が不明、または必要な evidence を確認できない場合は、合格や READY とせず、未確認として記録する。

generic gate と finding の判定は `../review-common/review-playbook.md` の `Severity と Gate の共通定義` に従う。blocking 条件がある場合は `REVISE REQUIREMENTS`、mandatory evidence / context が不足して確認が必要な場合は `REQUIREMENTS CONFIRMATION REQUIRED`、それ以外は `READY` とする。Major は generic gate では原則 blocking、Minor は通常 non-blocking だが、件数・組合せや repository-specific mandatory policy による例外を記録する。

レビュー中に requirements、concept、specification、design、code、test、README、repository policy を変更しない。未確認事項、未実行の validation、前段 finding の状態を成功扱いにしない。

## 自己確認

- requirement ごとに根拠、actor、責任、外部結果、acceptance、validation へ追跡できるか。
- purpose、scope、non-goal、constraint、assumption、undecided が一貫しているか。
- security、privacy、integrity、availability / reliability、interoperability、operational / observability / operability、deployment / environment、compliance / policy、failure、malformed / unsupported input を、適用される根拠の範囲で確認したか。
- design / specification detail を要求していないか。欠落と未要求の追加を区別しているか。
- current code、test、一般慣例だけで新しい requirement を発明していないか。
- domain / platform / network / external system の差異を、approved source が必要とする場合だけ扱っているか。
- finding ごとに対象箇所、根拠、影響、必要条件、完了条件があるか。
- repository-specific gate、evidence、命名規約が不明な場合に PASS としていないか。

レビュー成果物だけを、repository instructions が定める方法で作成する。共通の finding、severity、evidence、regression、Git、validation ルールは `../review-common/review-playbook.md` に従う。
