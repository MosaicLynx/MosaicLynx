---
name: design-review
description: design / architecture artifact を、上流要求との traceability、component responsibility、dependency direction、trust boundary、secret boundary、data ownership、lifecycle、failure、concurrency、運用責任、security invariant の観点でレビューする。APIや詳細実装そのものはレビューしない。
---

# Design Review

design artifact を実装・仕様・書き直しの代わりにせず、下位 specification と implementation へ安全に進める品質かを判定する。レビューの対象は、どの責務をどの境界に配置し、どの dependency、ownership、flow、lifecycle、security invariant で構成するかである。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 artifact、review artifact の配置、対象 component、Source of Truth、repository-specific gate、validation、報告規約を取得する。
2. `../review-common/review-playbook.md`。
3. `reviewers.md`、`review-gates.md`、`output-format.md`。
4. ユーザーが明示した対象、範囲、参照資料。

特定の見出し名、directory、命名、finding prefix、component 構成を前提にしない。具体的な責務の正否は repository instructions、approved requirements / specification、ADR、既存設計から取得する。

## 対象と成果物

- ユーザーが明示した design artifact、component、機能の範囲を優先する。
- 未指定の場合は、repository instructions の候補探索規則と既存 artifact 構成から対象を特定する。固定 path やファイル名を推測しない。
- 候補が 0 件または複数件、対象 component や出力先が不明な場合は、自動選択せず、insufficient evidence と確認事項を報告する。
- review artifact の保存場所、命名、連番、finding prefix は repository instructions が定義する場合だけ使用する。定義がなければ固定形式を発明しない。
- 既存成果物を移動、削除、上書きしない。

## 根拠の範囲

design 本文、approved concept / requirements / specification、ADR、ユーザー提供資料、repository instructions を主な根拠とする。code、test、公式資料は、設計の成立性、外部事実、既存の境界を確認する必要な範囲だけ参照する。

下位 specification に委譲された API、field、schema、wire format、serialization、cryptographic parameter、protocol detail が design にないことだけで finding にしない。上流要求と矛盾する設計、責務・境界・委譲の不足を具体的に指摘する。

repository-specific component、security policy、platform / protocol / network variation、persistence / shared-state policy は、適用可能な instructions、docs、ADR に定義されている場合だけ正否を判定する。記載がないものを既定値で補わない。

## レビュー観点

- purpose、scope、non-goal、assumption、上流 requirements / specification / ADR への traceability。
- system context、external actor、component responsibility、dependency direction、循環依存、変更境界。
- trust boundary、untrusted input、secret-bearing / signing-capable activity、remote / external / opaque system、secret boundary。
- data ownership、source of truth、state、retention、更新、破棄、アクセス権、data flow。
- 主要 flow、lifecycle、初期化、終了、再起動、failure、retry、timeout、duplicate、concurrency、cancel。
- security invariant、privacy、integrity、authentication / authorization、availability、audit、operational responsibility。
- domain、platform、network、protocol、version の差異を扱う必要がある場合の設計上の分離。
- 下位 specification、implementation、test、運用へ必要な判断を推測なしに引き渡せるか。

## Phase boundary と finding

各候補について、design で決めるべき responsibility、boundary、dependency、ownership、lifecycle、invariant なのか、specification / implementation で初めて決める詳細なのかを確認する。

finding は、本文または approved source に直接追跡でき、現在の design の責務、整合性、security、実装可能性に具体的な影響がある場合だけ採用する。具体的な function signature、API field、schema、暗号 parameter、好みの framework、未要求の将来機能は採用しない。

design review の finding は新しい requirement や方式の決定ではない。設計判断が不足している場合は、必要な判断と根拠を示し、方式を勝手に選ばず unresolved として記録する。

## 実行と判定

`review-common/review-playbook.md` の Phase 0〜3 と、`reviewers.md` の独立観点を適用する。サブエージェントを使わない場合は、実施した自己レビューの観点別パスだけを記録する。

`review-gates.md` の generic phase gate を適用した後、repository instructions が定める追加 mandatory gate、required evidence、review policy を適用する。repository-specific gate が不明、または必要な evidence を確認できない場合は、合格や READY とせず、未確認として記録する。

generic gate の結果は `READY` または `REVISE DESIGN` とする。Critical の unresolved issue、責務・trust boundary・data ownership の重大な不備、上流整合性や下流引継ぎの失敗がある場合は後者とする。Major / Minor を下流へ安全に引き継げる場合は、repository policy に反しない限り READY として Deferred / Optional に整理する。

レビュー中に design、requirements、specification、ADR、code、test、README、repository policy を変更しない。未確認事項、未実行の validation、過去 finding の状態を成功扱いにしない。

## 自己確認

- design の判断が requirements、specification、ADR、repository instructions へ trace できるか。
- component responsibility、dependency direction、trust boundary、secret boundary、data ownership が明確か。
- lifecycle、failure、concurrency、retry、timeout、operational responsibility が対象に応じて扱われているか。
- API、schema、wire format、cryptographic parameter、具体的 function / class を根拠なく要求していないか。
- repository-defined component、platform、protocol、network、persistence policy を推測していないか。
- finding ごとに対象箇所、根拠、影響、最小の必要条件、完了条件があるか。
- repository-specific gate、evidence、命名規約が不明な場合に PASS としていないか。

レビュー成果物だけを、repository instructions が定める方法で作成する。共通の finding、severity、evidence、regression、Git、validation ルールは `../review-common/review-playbook.md` に従う。
