---
name: design-author
description: 承認済み requirements、仕様、concept、ADR を、責務境界、component、依存方向、trust boundary、data ownership、主要 flow、lifecycle、failure handling、運用前提を含む基本設計 artifact へ整理する。API・wire format・暗号パラメータ・実装コードは新たに決めない。
---

# Design Author

承認済みの requirements、上位仕様、ADR を、実装と下位仕様へ引き渡せる design artifact へ整理する。成果物は責務の配置、境界、依存方向、データ所有、主要な flow、lifecycle、failure、security invariant、運用上の責任を明確にするものであり、外部契約の細部や実装コードではない。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 component、design artifact の場所、Source of Truth、参照先、validation、ローカル制約を取得する。
2. `../author-common/author-playbook.md`。
3. `output-format.md`。
4. ユーザーが明示した依頼、承認済み requirements、上流 concept、既存 design。
5. 対象に直接関係する specification、ADR、公開 contract、実装、テスト、運用資料、必要な公式資料。

特定の見出し名や固定 path を必須としない。repository instructions と既存構成から安全に特定できない artifact の配置、component、toolchain、外部仕様は推測せず、unresolved item として扱う。

## 対象と出力

- ユーザーが対象 artifact、component、出力先を指定した場合は、それを優先する。
- 指定がない場合は、repository instructions と既存 artifact 構成から design artifact の場所と命名を特定する。
- 場所を特定できない場合は、固定 path を発明しない。
- 既存 design は対象と根拠が明確な場合だけ更新し、無関係な仕様・実装・レビュー成果物を上書きしない。
- design で決定する内容と、下位の specification / implementation へ委譲する内容を明記する。

## Design の責務

必要に応じて、次を責務と根拠が追跡できる形で整理する。

- system context、user / operator / external actor、外部 system、対象 environment。
- logical component、責任、提供・利用する interface の役割、責任を越えて期待しないこと。
- dependency direction、ownership、変更境界、置き換え可能性、循環依存の防止。
- trust boundary、untrusted input、secret-bearing / signing-capable activity、remote / opaque system の境界。
- data ownership、source of truth、lifecycle、retention、移動経路、アクセス権。
- 主要 flow、state、初期化・終了・再起動、failure、retry、timeout、duplicate、concurrency。
- security invariant、privacy、integrity、authentication / authorization、availability、audit の責任。
- operational responsibility、observability、capacity、rollout、migration、recovery（対象に関係する場合）。
- domain、platform、network、protocol、version の差異を扱う必要がある場合の設計上の分離。
- 下位 specification で固定すべき external contract、serialization、validation、error、compatibility、security detail。

設計上の決定は、上流要求・承認済み仕様・ADR・既存の repository context へ追跡できるようにする。根拠のない component、責任、依存、性能目標、互換性を追加しない。

## Design に記載しない内容

承認済みの下位決定を参照する場合を除き、次を新たに固定しない。

- API field / type / schema、wire format、serialization、canonical representation、具体的な error payload。
- algorithm、cryptographic parameter、KDF、nonce、key encoding、signature bytes、protocol message の具体値。
- class、function、module、package、framework、library、database schema、UI layout、テスト fixture の具体実装。
- 仕様にない新しい capability、fallback、互換動作、release gate、運用手順。

下位仕様で必須となる事項は「何を、どの source に基づき、どの artifact で定義するか」として委譲する。設計で必要な invariant や境界は、実現方法を先取りせず記述してよい。

## 情報の扱い

- user instruction、承認済み requirements、approved specification、ADR、適用可能な repository instructions を primary source とする。
- code、test、公開 contract、設定、公式資料は、実装状態や外部事実を確認する evidence として使う。現在の挙動だけで未承認の design intent を逆生成しない。
- 異なる domain / platform / network / protocol / version は、適用される source が区別している限り独立に確認する。
- 仕様・設計・実装の競合、責任境界の欠落、解消できない OPEN item は、勝手に補完せず影響範囲とともに unresolved として報告する。

## 作成手順

1. 対象範囲、上流要求、approved source、変更対象 component を確定する。
2. system context、actor、external system、trust boundary、secret / sensitive data の境界を整理する。
3. component の責任、ownership、interface の役割、dependency direction を定義する。
4. 主要 flow、state、lifecycle、failure、concurrency、retry / timeout を対象に応じて整理する。
5. security invariant、privacy、integrity、availability、operational responsibility を明示する。
6. domain / platform / network / protocol / version の差異を、必要な場合だけ設計へ反映する。
7. 下位 specification / implementation へ委譲する詳細、unresolved decision、assumption、risk を記録する。
8. traceability、過剰設計、責務の重複、循環依存、trust boundary の抜けを確認する。
9. repository instructions が定める場所へ保存し、必要な validation と報告を行う。

## 自己確認

- 上流の requirements、仕様、ADR から design の判断へ追跡できるか。
- component、responsibility、ownership、dependency direction、trust boundary が明確か。
- data lifecycle、主要 flow、failure、concurrency、operational responsibility が対象に応じて扱われているか。
- security invariant、secret / sensitive data、untrusted input、remote / opaque system の境界が曖昧でないか。
- API、wire format、cryptographic parameter、具体的 protocol、class / function などを新たに発明していないか。
- repository instructions にない component、path、toolchain、platform、protocol、compatibility、validation command を推測していないか。
- current implementation を design の正当化に使っていないか。design と実装の差異は別途明示されているか。
- specification と implementation へ委譲する事項、未決定事項、risk が明確か。

次段階の spec-author / implement-author または repository instructions が指定するレビュー手順へ引き渡す。共通の Source of Truth、scope control、Git、validation、報告ルールは `../author-common/author-playbook.md` に従う。
