---
name: readme-author
description: repository、component、package、application の README を、実装、公開 contract、仕様、設定、テスト、metadata と一致するように作成・更新する。installation、usage、supported / unsupported capability、platform requirement、security、limitations、examples を事実に基づいて記述し、将来機能を現在機能として決めない。
---

# README Author

README を、利用者が対象を正しく理解・導入・利用できる documentation artifact として作成・更新する。README は実装、公開 contract、approved specification、設定、test、metadata が示す現在の事実を説明するものであり、未承認の product decision や将来計画を決める場所ではない。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 README、artifact の配置、対象 component、公開範囲、validation、ローカル規約を取得する。
2. `../author-common/author-playbook.md`。
3. ユーザーが明示した依頼、対象 README、関連 README、既存の documentation。
4. 対象 component の manifest、公開 export、実装、configuration、test、build / distribution 設定、approved specification、ADR。
5. 必要に応じて、対象 platform、domain、external system、dependency の公式資料。公式資料の内容を対象の capability と誤認しない。

特定の repository layout、language、package manager、platform、domain、product capability、README path を前提にしない。対象と出力先を repository instructions または既存構成から安全に特定できない場合は、場所や機能を発明せず確認事項として報告する。

## 対象と出力

- ユーザーが README と出力先を指定した場合は、それを優先する。
- 指定がない場合は、repository instructions と既存構成から対象 README と利用者を特定する。
- 既存 README は対象範囲と根拠が明確な場合だけ更新する。無関係な docs、仕様、コードを同時に変更しない。
- 新規 README の場所、リンク、命名は repository instructions または既存構成に従う。固定 path を推測しない。
- README に記述した重要な事実は、対象の実装・公開 contract・approved source のいずれかへ追跡できるようにする。

## README の責務

対象に該当する範囲で、次を正確かつ利用者に分かる順序で説明する。

- 対象の purpose、scope、主な利用者、現在提供している capability。
- installation、prerequisite、runtime / platform requirement、configuration、environment、dependency。
- quick start、usage、公開 API / command / interface、input / output、代表的な example。
- supported、unsupported、experimental、planned の区別。
- error、validation、resource / lifecycle、互換性、version、制限、既知の注意事項。
- security、privacy、secret / credential handling、trust boundary、運用上の安全な利用方法。
- 関連する specification、design、ADR、API reference、examples、validation / test の参照先。

README は利用者が必要とする外部可視情報を扱う。内部実装の詳細、未承認の仕様、実装から推測した将来 capability、レビュー finding を新しい product requirement として書かない。

## 事実確認の原則

- implementation、公開 export / contract、manifest / metadata、configuration、test、approved specification の記述を相互に照合する。
- 現在実装されているもの、仕様上 supported なもの、計画中のもの、外部依存が提供するだけのものを区別する。
- code や test の現在挙動だけで、仕様・security promise・support policy・互換性を逆生成しない。
- 外部 platform、domain、network、protocol、service の一般的な能力を、対象が提供する capability として記述しない。
- version、entry point、公開名、configuration key、command、出力例は、対象の現在の source と一致させる。古い例や推測した値を残さない。
- 不明・競合・未検証の事実は断定せず、README に書かないか、適切な unresolved / limitation として扱う。

## 境界と安全性

- domain、platform、network、protocol、version の差異は、対象に適用される approved source が区別している場合に保持する。
- remote / external / opaque system、client boundary、secret-bearing / signing-capable component、storage boundary の責任は、repository instructions と正本 docs に従って説明する。
- API、data format、cryptographic behavior、protocol、platform capability の詳細は、正本を複製せず参照先を示す。README に必要な利用者向け制約だけを正確に要約する。
- secret、credential、key、password、復号済み plaintext、実データを example、fixture、screenshot、log、command 出力に含めない。安全な placeholder を使う。
- supported / unsupported capability、failure、security guidance、compatibility を、利用者の誤解を招く曖昧な表現で隠さない。

## 作成手順

1. 対象 README、利用者、目的、公開範囲、更新 scope を確定する。
2. repository instructions と既存構成から参照先、validation、配置、命名を確認する。
3. manifest、public contract、実装、設定、test、approved source から現在の事実を収集する。
4. installation、usage、configuration、capability、limitations、security、compatibility を対象に応じて整理する。
5. examples と command を実際に検証可能な最小例にし、secret や未確定値を含めない。
6. implementation、仕様、metadata、README の不一致を分類し、README で勝手に仕様を修正しない。
7. 外部 docs / ADR / API reference へのリンクと、対象 artifact 内の相対リンクが有効か確認する。
8. repository instructions が定める formatter、lint、link check、test、build などの適切な validation を実行する。
9. 未検証事項、仕様との競合、残存する limitation を明示して報告する。

## 推奨構成

1. Title and purpose
2. Status / supported scope
3. Prerequisites and installation
4. Quick start
5. Usage / API / interface
6. Configuration
7. Examples
8. Supported / unsupported capability
9. Security and privacy guidance
10. Limitations, errors, compatibility, and versioning
11. Development / validation (when useful to the audience)
12. Related specifications and references

対象利用者に不要な節は省略する。ただし、利用に影響する制約、security、unsupported behavior を省略しない。

## 自己確認

- README の purpose、installation、usage、configuration、examples が対象の現在の実装と一致しているか。
- public API / contract、metadata、version、supported / unsupported capability、platform requirement が source に追跡できるか。
- 実装・仕様・計画・外部 dependency の提供能力を混同していないか。
- security、privacy、secret handling、trust boundary、error、limitation、compatibility を必要な範囲で説明しているか。
- domain / platform / network / protocol の差異を、適用される場合だけ正確に扱っているか。
- 将来機能、未承認の API、推測した path / command / configuration / capability を現在の事実として書いていないか。
- 相対リンク、外部リンク、code example、command、placeholder、formatting が検証可能か。
- repository instructions にない validation command、support policy、product requirement を発明していないか。
- 未検証の内容や実装との不一致を、確認済みと報告していないか。

README 更新後は、repository instructions が指定するレビュー手順へ引き渡す。共通の Source of Truth、scope control、Git、validation、報告ルールは `../author-common/author-playbook.md` に従う。
