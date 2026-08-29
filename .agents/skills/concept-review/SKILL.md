---
name: concept-review
description: concept / product concept / concept sheet を、根拠、problem、value、user / stakeholder、scope / non-goal、責任、成功条件、前提、未決定事項の観点でレビューし、requirements へ進める品質を判定する。requirements、design、API、implementation はレビューしない。
---

# Concept Review

concept artifact を設計・実装・書き直しの代わりにせず、requirements を安全に開始できる品質かを判定する。レビューの対象は、何を解決するのか、誰のためか、どんな value を仮説とするのか、どこまでを扱うのか、何が未決定かである。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 artifact、review artifact の配置、Source of Truth、repository-specific gate、validation、報告規約を取得する。
2. `../review-common/review-playbook.md`。
3. `reviewers.md`、`review-gates.md`、`output-format.md`。
4. ユーザーが明示した対象、範囲、参照資料。

特定の見出し名、directory、命名、finding prefix が存在することを前提にしない。repository instructions が定める repository-specific policy と、approved product / domain docs を別の根拠として扱う。

## 対象と成果物

- ユーザーが明示した concept artifact 1件を優先する。
- 未指定の場合は、repository instructions の候補探索規則と既存 artifact 構成から対象を特定する。固定 path、ファイル名、package / application 構成を推測しない。
- 候補が 0 件または複数件、対象範囲が不明、または対象を一意に決められない場合は、自動選択せず、insufficient evidence と確認事項を報告する。
- concept 以外の requirements、design、specification、implementation、過去レビューは候補から除外する。ただし上流・下流との追跡確認に必要な範囲で参照する。
- review artifact の保存場所、命名、連番、finding prefix は repository instructions が定義する場合だけ使用する。定義がなければ固定形式を発明せず、必要な形式を未決定として報告する。
- 既存レビュー成果物を移動、削除、上書きしない。

## 根拠の範囲

主な根拠は concept 本文、ユーザーが明示した資料、承認済みの product / domain context、適用可能な ADR と repository instructions である。

code、詳細仕様、API、test、公式資料は、concept の成立性、既存の明示的な境界、外部制約の事実を確認する必要がある場合だけ参照する。下流資料との違いだけを欠陥とせず、concept の責務を越える論点は downstream へ委譲する。

repository-specific security、responsibility、platform、protocol、network、release policy は、repository instructions または approved source に明記されている場合だけ判定へ反映する。資料がないことを慣例で補わない。

## レビュー観点

- background、problem、purpose、target user / stakeholder、利用場面、value hypothesis の因果。
- scope、v1 boundary、non-goal、milestone、将来構想、外部責任の分離。
- success criteria、assumption、risk、verified fact、unresolved / undecided item の区別。
- 用語、主張、対象範囲、責任、本文内の一貫性と traceability。
- concept 自体を成立不能にする明白な前提矛盾、承認済み制約との衝突、対象範囲に直接関係する外部制約。
- repository-defined security、privacy、trust boundary、責任が concept の範囲で欠落していないか（根拠がある場合）。

API、data format、暗号方式、処理順序、component architecture、具体的な acceptance test、class / function などの下流詳細は、concept にないことだけで finding にしない。

## Phase boundary と finding

各候補について、concept で解消すべき問題か、requirements / design / specification / implementation へ委譲すべき問題かを確認する。

finding は、本文または approved source に直接追跡でき、現在の concept の解釈・成立・境界に具体的な影響がある場合だけ採用する。一般的な value 提案、未要求の capability、詳細方式の要求、下流で初めて決める事項は採用しない。

review finding は新しい product requirement の根拠ではない。不足する判断は、欠陥と断定せず、unresolved または requirements への handoff として記録する。

## 実行と判定

`review-common/review-playbook.md` の Phase 0〜3 と、`reviewers.md` の独立観点を適用する。サブエージェントを使わない場合は、実施した自己レビューの観点別パスだけを記録する。

`review-gates.md` の generic phase gate を適用した後、repository instructions が定める追加 mandatory gate、required evidence、review policy を適用する。repository-specific gate が不明、または必要な evidence を確認できない場合は、合格や READY とせず、未確認として記録する。

generic gate と finding の判定は `../review-common/review-playbook.md` の `Severity と Gate の共通定義` に従う。blocking 条件がある場合は `REVISE CONCEPT`、mandatory evidence / context が不足して確認が必要な場合は `CONCEPT CONFIRMATION REQUIRED`、それ以外は `READY` とする。Major は generic gate では原則 blocking、Minor は通常 non-blocking だが、件数・組合せや repository-specific mandatory policy による例外を記録する。

レビュー中に concept、requirements、specification、design、code、test、README、repository policy を変更しない。未確認事項、未実行の validation、過去 finding の状態を成功扱いにしない。

## 自己確認

- problem、target、value、scope、non-goal、success criteria が一貫しているか。
- verified fact、assumption、risk、unresolved issue、future plan が区別されているか。
- 固定 path、component、platform、protocol、network、責任、security policy を推測していないか。
- API、仕様、設計、実装、テストの詳細を phase boundary を越えて要求していないか。
- finding ごとに対象箇所、根拠、影響、最小の必要条件、完了条件があるか。
- repository-specific gate、evidence、命名規約が不明な場合に PASS としていないか。
- review artifact の形式と相対参照が適用資料に従っているか。

レビュー成果物だけを、repository instructions が定める方法で作成する。共通の finding、severity、evidence、regression、Git、validation ルールは `../review-common/review-playbook.md` に従う。
