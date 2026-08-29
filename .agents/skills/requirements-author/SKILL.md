---
name: requirements-author
description: アイデア、concept、会話、既存資料を、設計・仕様へ引き渡せる requirements artifact へ整理する。actor、責任、機能・非機能・security・相互運用性の要求、制約、受け入れ条件、failure、未決定事項を明確にし、APIや実装詳細は決めない。
---

# Requirements Author

concept やユーザー依頼を、設計・仕様・実装が検証可能な requirements artifact へ整理する。成果物は「何を満たす必要があるか」「誰が何に責任を持つか」「どう確認できるか」を定義し、具体的な実現方法を決めない。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 artifact の場所、対象 repository / component、Source of Truth、参照先、validation、ローカル制約を取得する。
2. `../author-common/author-playbook.md`。
3. `scope-boundary.md`。
4. ユーザーが明示した依頼、既存 concept、承認済みの product / domain 文書。
5. 対象に直接関係する既存 requirements、ADR、上流・関連 artifact。

特定の見出し名やファイル path の存在を前提にしない。repository instructions と既存構成から安全に判断できない配置・対象・正本は、推測せず確認事項として扱う。

## 対象と出力

- ユーザーが対象 artifact または出力先を指定した場合は、それを優先する。
- 指定がない場合は、repository instructions と既存 artifact 構成から requirements artifact の場所と命名を特定する。
- 場所を安全に特定できない場合は、固定 path を発明せず、必要な確認事項を報告する。
- 既存 artifact は、更新対象と根拠が明確な場合だけ更新する。無関係な仕様、設計、実装、レビュー成果物を上書きしない。
- 各 requirement は、根拠、対象 actor、責任、観測可能な結果、検証方法、未決定事項を追跡できる形にする。

## 要件の責務

必要に応じて、次を明確にする。

- purpose、対象 user / stakeholder、actor、利用場面、外部システムとの関係。
- scope、non-goal、対象環境、前提、制約、依存関係。
- actor / component / operator ごとの responsibility と、責任を越えて期待してはいけないこと。
- functional requirement、non-functional requirement、security / privacy / integrity requirement。
- 外部から観測できる input、output、状態、結果、互換性、相互運用性の要求。ただし field、schema、wire format の詳細は仕様へ委譲する。
- validation、acceptance criteria、failure / error 時の安全な結果、再試行・重複・期限などの要求（対象に関係する場合）。
- performance、capacity、lifecycle、operational、observability / operability、deployment / environment、compliance / policy などの要求・制約（対象に適用され、承認済み資料または applicable repository instructions に根拠がある場合）。
- availability / reliability requirement と interoperability requirement（対象に適用され、根拠がある場合）。
- assumptions、trade-off、risk、依存先、unresolved / undecided item。

要求は、必要性と達成状態が明確で、検証可能な粒度にする。実装手段、ライブラリ、class、function、具体的なデータ構造を要求文へ紛れ込ませない。

## フェーズ境界

requirements で決めるのは、目的、外部から観測できる結果、責任、制約、品質、受け入れ条件である。次の内容は、承認済み資料にすでに決定がある場合を除き、design / specification / implementation へ委譲する。

- component の分割、dependency direction、内部 flow、storage、deployment、runtime 構成。
- API の field / type / schema、wire format、serialization、canonicalization の具体形。
- protocol の message、version、algorithm、cryptographic parameter、key / nonce / encoding の具体値。
- framework、library、package、class、function、テスト fixture、CI command の選定。

技術的な制約が要求に影響する場合は、制約または検証可能な品質要求として記載し、実現方法の決定と分離する。

## domain / platform / external system の扱い

- domain、platform、network、external system、component の差異は、対象に適用される場合だけ要求へ反映する。
- 複数の domain / protocol / network / environment がある場合、それぞれの責任、互換性、validation、failure を根拠に基づいて区別する。名前や現在の実装だけから共通仕様を作らない。
- secret-bearing または signing-capable な component、remote system、opaque data を扱う component の責任は、承認済み資料に従って明示する。資料に境界がなければ、境界を発明せず未決定として残す。
- 現在実装されている capability と、計画中・候補の capability を混同しない。

## 情報の扱い

- user instruction、承認済み concept / product / domain 文書、適用可能な ADR、既存 requirements を根拠にする。
- code、test、既存 API の現在挙動は implementation evidence として扱う。そこから未承認の requirement や product intent を逆生成しない。
- approved source が競合する場合は、対象範囲、版、役割、更新時点を確認し、解消できない場合は影響範囲とともに undecided として報告する。
- review finding、実装上の都合、一般的な慣例だけを根拠に、新しい product requirement を追加しない。

## 作成手順

1. 依頼、concept、関連資料から目的、actor、scope、制約、未決定事項を抽出する。
2. applicable repository instructions が示す artifact と Source of Truth を確認する。
3. requirement を functional、quality、security、availability / reliability、operational、observability / operability、deployment / environment、compliance / policy、interoperability などの観点に分類する（適用され、根拠がある場合）。
4. actor、責任、外部から観測できる結果、acceptance criteria を記述する。
5. failure、invalid / unsupported input、認証・認可、整合性、可用性、境界条件を対象に応じて記述する。
6. 各 requirement に根拠、検証方法、依存、assumption、未決定事項を付与する。
7. scope creep、実装詳細の混入、重複、矛盾、過剰な要求を確認する。
8. design / specification / implementation へ委譲する事項を明記する。
9. repository instructions が定める場所へ保存し、必要な validation と報告を行う。

## 推奨構成

1. Title / status / owner
2. Background / purpose
3. Actors and stakeholders
4. Scope / non-goals
5. Context and assumptions
6. Responsibility boundaries
7. Functional requirements
8. Non-functional / security / privacy requirements
9. External, platform, domain, deployment / environment, or interoperability requirements (when applicable)
10. Operational, observability / operability, availability / reliability, or compliance / policy constraints (when applicable)
11. Constraints and dependencies
12. Failure / error / recovery requirements
13. Acceptance criteria and validation approach
14. Traceability and evidence
15. Risks and unresolved decisions
16. Handoff to design / specification

## 自己確認

- 各 requirement が目的、actor、責任、観測可能な結果、検証方法へ追跡できるか。
- requirement と design / specification / implementation detail が分離されているか。
- scope、non-goal、assumption、constraint、undecided が混同されていないか。
- invalid / unsupported / malformed input、失敗時の結果、security、privacy、availability / reliability、interoperability、operational / observability / operability、deployment / environment、compliance / policy を、適用される根拠の範囲で扱っているか。
- domain / platform / network / external system の差異を、適用される場合だけ根拠に基づいて扱っているか。
- current implementation、review finding、repository 慣例から新しい要求を推測していないか。
- repository instructions にない path、component、toolchain、protocol、capability、validation command を発明していないか。
- 下流の design-author / spec-author へ、未解決事項と参照すべき根拠が引き渡されているか。

次段階の design-author または spec-author、ならびに repository instructions が指定するレビュー手順へ引き渡す。共通の Source of Truth、scope control、Git、validation、報告ルールは `../author-common/author-playbook.md` に従う。
