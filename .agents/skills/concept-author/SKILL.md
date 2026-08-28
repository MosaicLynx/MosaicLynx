---
name: concept-author
description: アイデア、会話、既存資料を、要件定義前の concept artifact へ整理する。背景、problem、対象 user / stakeholder、value hypothesis、scope / non-goal、responsibility、assumptions、success criteria、unresolved issues を定め、API・仕様・設計・実装は決めない。
---

# Concept Author

要件定義へ進む前に、対象が解決する problem、提供する value、対象範囲、後続工程の判断基準を concept artifact へ整理する。この Skill の成果物は「なぜ扱うのか」「誰のためか」「何を価値とするか」「どこまでを扱うか」を明確にするものであり、機能仕様や実装計画ではない。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。成果物の配置、対象 repository / component、参照すべき正本、ローカルの制約が定義されている場合はそれに従う。
2. `../author-common/author-playbook.md`。
3. ユーザーが明示した依頼、会話、既存資料。
4. 対象に直接関係する既存 concept artifact または承認済みの上流 product 文書。

repository instructions に特定のフォーマットや保存場所が書かれている場合は、それを使用する。書かれていない場所、命名規則、対象 component、検証方法を慣例から推測しない。

## 対象と出力

- ユーザーが出力先や対象 artifact を指定した場合は、それを優先する。
- 指定がない場合は、repository instructions と既存の artifact 構成から concept artifact の保存場所と命名を特定する。
- repository instructions と既存構成のどちらからも安全に特定できない場合は、場所を発明せず、必要な確認事項を unresolved issue として報告する。
- 既存 artifact は、ユーザーが更新を求めた場合または対象範囲が明確な場合だけ更新する。別の artifact を無断で上書きしない。
- 出力は concept の判断材料に限定する。requirements、design、specification、implementation の詳細を別名で混入させない。

## コンセプトの責務

必要に応じて、次を簡潔かつ追跡可能に整理する。

- 背景、context、現状の問題、解決しない場合の影響。
- problem statement、対象 user / stakeholder、関係する actor、利用場面。
- value hypothesis、期待する outcome、成功を判断する観測可能な条件。
- v1 または対象 scope、明示的な non-goal、将来検討との境界。
- user、operator、repository-defined component、external party などの責任の仮説。実際の境界が承認済み資料にない場合は仮説または未決定として扱う。
- 判断原則、assumptions、依存する前提、主要な risk。
- requirements 以降へ引き渡す問い、unresolved issue、検証が必要な仮説。

scope は機能の一覧ではなく、価値を検証するために必要な境界として記述する。対象外を明示し、未決定事項を決定済みのように表現しない。

## Concept に記載しない内容

次の内容を新たに決めない。

- API、RPC、UI、型、field、schema、wire format、serialization、state machine の詳細。
- protocol、external contract、storage、transport、deployment、library、framework、class、function の選定。
- cryptographic algorithm、parameter、key handling、encoding、signature、validation rule の仕様。
- component の細かな dependency、実装手順、test case、CI / release command。
- 現在の code の挙動を根拠にした、未承認の requirement、capability、互換動作。

技術的な制約が value hypothesis や成立性に直接影響する場合でも、承認済み資料にある事実と、検証が必要な仮説を分けて記載する。下流で決める詳細は、確認すべき問いとして引き渡す。

## 情報の扱い

- user instruction、会話、承認済み上流資料、既存 concept artifact を根拠として使用する。
- repository instructions が参照先を示す場合は、該当する product / domain 文書、ADR、既存資料を確認する。ただし、詳細仕様を concept の根拠なしに再解釈しない。
- domain、platform、network、external system、component の違いは、資料で区別されている場合に限り保持する。名前が似ているものを勝手に統合しない。
- 現在存在する component と計画中の component、仮説上の stakeholder と確定した責任を区別する。
- 事実、仮説、前提、未決定事項、risk をラベルまたは文脈で明確に分ける。

## 作成手順

1. 依頼から目的、対象 user / stakeholder、期待 outcome、制約を抽出する。
2. 既存の上流資料と concept artifact を確認し、重複・競合・未決定事項を記録する。
3. problem とその影響を、解決策の実装詳細を持ち込まずに記述する。
4. value hypothesis と success criteria を、後で検証できる形にする。
5. v1 scope、non-goal、responsibility の仮説を定める。
6. assumptions、risks、外部依存、unresolved issues を整理する。
7. requirements へ引き渡す問いと、requirements 以降に委譲する詳細を明示する。
8. 事実と仮説、決定と未決定、現在と将来を再確認する。
9. repository instructions が定める場所へ保存し、必要な検証・報告方法に従う。

## 推奨構成

1. Title / status / owner
2. Background and context
3. Problem statement
4. Target users and stakeholders
5. Use cases or situations
6. Value hypothesis
7. Scope / v1 boundary
8. Non-goals
9. Responsibility hypotheses
10. Principles and assumptions
11. Success criteria
12. Risks and unresolved issues
13. Handoff to requirements

すべての節が必要とは限らないが、欠落が判断を不可能にする場合は理由を記載する。

## 図解

必要な場合だけ、problem、actor、value、scope、責任の関係を示す簡潔な図を使用する。component、API、wire format、詳細 flow の設計図は作成しない。

## 自己確認

- problem、target user / stakeholder、value hypothesis、scope、non-goal、success criteria が一貫しているか。
- 事実・仮説・assumption・risk・unresolved issue が区別されているか。
- 要求、設計、仕様、実装の詳細を先取りしていないか。
- repository instructions にない artifact path、component、platform、protocol、capability、責任を推測していないか。
- 現在の code の挙動を、承認済みの product intent の代わりにしていないか。
- 外部 actor、remote system、secret-bearing activity などの責任を、根拠なく一つの主体へ寄せていないか。
- downstream の requirements-author へ、未解決の判断と確認すべき根拠が引き渡されているか。

次段階の requirements-author または repository instructions が指定するレビュー手順へ引き渡す。共通の Source of Truth、scope control、Git、validation、報告ルールは `../author-common/author-playbook.md` に従う。
