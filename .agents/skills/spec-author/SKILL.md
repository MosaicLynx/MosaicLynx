---
name: spec-author
description: 承認済み requirements、design、ADR を、実装・検証・相互運用が可能な external specification artifact へ具体化する。API契約、input / output、validation、serialization、error、state、security、compatibility を定義するが、新しい要求や製品仕様は発明しない。
---

# Specification Author

承認済みの requirements、design、ADR、上位 specification を、実装者と利用者が同じ解釈で実装・検証できる external specification artifact へ具体化する。成果物は契約、境界、入力、出力、validation、error、状態、security、互換性、相互運用性を明確にする。requirements や design にない目的・責任・capability を追加しない。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 component、specification artifact の場所、Source of Truth、参照先、validation、ローカル制約を取得する。
2. `../author-common/author-playbook.md`。
3. ユーザーが明示した依頼、承認済み requirements、design、concept、ADR。
4. 対象に直接関係する既存 specification、公開 API / contract、実装、テスト、fixture、公式資料。
5. 必要に応じて、既存のレビュー結果や conformance / interoperability の evidence。

特定の見出し名、保存場所、language、framework、protocol、SDK、network の存在を前提にしない。repository instructions と既存構成から安全に特定できない内容は推測せず、unresolved / undecided として扱う。

## 対象と出力

- ユーザーが対象 specification、component、出力先を指定した場合は、それを優先する。
- 指定がない場合は、repository instructions と既存 artifact 構成から対象 specification の場所と命名を特定する。
- 場所を特定できない場合は、固定 path を発明せず、必要な確認事項を報告する。
- 既存 specification は、更新対象、承認済み根拠、互換性への影響が明確な場合だけ更新する。
- 外部から観測できる契約を、実装依存の説明と区別する。implementation が現在そう動くというだけでは、仕様の根拠にならない。

## Specification の責務

対象に該当する範囲で、次を一貫した用語と normative な記述で定義する。

- scope、対象 actor / component、external contract、前提、version、互換性。
- input、output、field、type、range、size、encoding、presence、ordering、default、normalization。
- validation、canonicalization、serialization、deterministic representation、byte / text の表現。
- 成功、failure、error、exception、timeout、retry、duplicate、replay、partial result、unknown / unsupported input の挙動。
- state、state transition、lifecycle、ownership、concurrency、idempotency、resource limit。
- authentication / authorization、privacy、integrity、availability、secret handling、trust boundary。
- domain、platform、network、external system、protocol、version の差異と相互運用規則（対象に適用される場合）。
- test vector、fixture、example、conformance criteria、検証可能な acceptance condition。

仕様の各決定は、承認済み requirements、design、ADR、上位 specification、適用可能な公式資料へ trace できるようにする。根拠がない選択は、最も自然に見えても採用せず undecided として残す。

## Security-sensitive behavior と cryptography

cryptography、署名、鍵、認証、secret、integrity protection などが対象仕様に存在する場合は、次を曖昧にしない。

- algorithm / primitive、parameter、key source / size、salt、nonce、AAD、tag、encoding、serialization、byte order、canonicalization。
- input の前提、生成・検証・復号・署名の境界、failure behavior、再利用・再試行・replay の扱い。
- secret の lifecycle、公開してよい値、ログ・例外・fixture・example に含めてはいけない値。
- interoperability、version、互換性、test vector、固定 fixture、実装間で一致すべき deterministic result。

これらは上流の approved source が定める範囲で具体化する。source にない algorithm、parameter、例外、fallback を便利さだけで補完しない。詳細が別の正本にある場合はその参照先を明示し、複数の正本を作らない。

## 外部 system と opaque data

remote / external system、opaque data、transport、provider、secret-bearing / signing-capable component などの境界がある場合は、どの主体が何を解釈・検証・保存・変更できるかを specification source に基づいて定義する。仕様が opaque とする data を、意味がありそうだからという理由で解釈・改変する契約を追加しない。責任境界が不明な場合は、推測せず未決定として報告する。

## Specification に記載しない内容

次を、承認済み上流 source に根拠なく新たに追加しない。

- 新しい user、product capability、責任、scope、fallback、互換モード、release gate。
- 特定の framework、library、SDK、class、function、module、database、deployment の選択。
- 実装内部の最適化、private helper、テスト実装、CI command。ただし external behavior、conformance、validation 条件として必要な場合を除く。
- 現在の code、test、fixture の挙動を根拠にした未承認の仕様。

仕様として必要な実装非依存の algorithm、serialization、validation、error、security contract は記載してよいが、実装手段と混同しない。

## 作成手順

1. 対象 scope、上流 source、適用 component / actor、既存 specification を確定する。
2. 上流 requirements / design / ADR と、既存 contract・実装・test evidence の差異を確認する。
3. external contract、input / output、validation、success / failure behavior を定義する。
4. serialization、canonicalization、encoding、determinism、state transition、lifecycle を対象に応じて定義する。
5. security、trust boundary、secret handling、authentication / authorization、malformed / unsupported input を確認する。
6. domain / platform / network / protocol / version の差異と interoperability を、適用される source に基づき記述する。
7. cryptography が対象に含まれる場合は、algorithm、parameters、encoding、failure、vector を完全な契約として確認する。
8. compatibility、conformance、fixture、acceptance、validation evidence を整理する。
9. undecided item、矛盾、根拠のない補完を分離し、下流実装が推測しなくて済むようにする。
10. repository instructions が定める場所へ保存し、必要な validation と報告を行う。

## 推奨構成

1. Title / status / scope / owner
2. Normative language and terminology
3. Actors, components, trust boundaries
4. Preconditions and assumptions
5. External contract
6. Input / output and data representation
7. Validation and normalization
8. Serialization / canonicalization / deterministic behavior
9. State and lifecycle
10. Success, error, failure, retry, duplicate, and unsupported behavior
11. Security and secret handling
12. Domain / platform / network / external interoperability (when applicable)
13. Compatibility and versioning
14. Test vectors, fixtures, examples, and acceptance criteria
15. Traceability, evidence, and unresolved decisions

## 自己確認

- requirements、design、ADR、上位 specification の各決定へ trace できるか。
- external contract、input / output、validation、error、state、lifecycle、compatibility が実装・検証可能な粒度か。
- malformed、truncated、duplicate、unknown、unsupported、tampered、unauthorized input の扱いが必要な範囲で定義されているか。
- canonicalization、serialization、encoding、deterministic behavior、numeric / byte 表現が曖昧でないか。
- cryptography が対象にある場合、algorithm、parameters、encoding、failure、interoperability、test vector が source に基づき完全か。
- trust boundary、external / remote / opaque data、secret handling、fail-closed behavior が明確か。
- domain / platform / network / protocol / version の差異を、適用される場合だけ根拠に基づいて扱っているか。
- current implementation、review finding、一般慣例から product requirement や仕様を逆生成していないか。
- repository instructions にない path、toolchain、component、protocol、SDK、validation command を発明していないか。
- design / implementation へ委譲する事項、undecided、互換性への影響が明示されているか。

次段階の implement-author または repository instructions が指定するレビュー手順へ引き渡す。共通の Source of Truth、scope control、Git、validation、報告ルールは `../author-common/author-playbook.md` に従う。
