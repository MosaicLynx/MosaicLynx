---
name: release-readiness-review
description: package、library、SDK、distributable artifact、registry-published component の release readiness を、version、metadata、public contract、dependencies、build artifact、documentation、security、validation evidence、repository release policy の観点で確認する。publish、tag、registry、source code は変更しない。
---

# Release Readiness Review

software package または distributable artifact が、意図した version と公開先に対して正しく、安全に、再現可能な形で配布できるかを判定する。通常の implementation review の代わりにコード品質全体を評価するのではなく、release candidate、publication metadata、配布物、公開 contract、release evidence に焦点を当てる。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。release target、versioning、publication target、release policy、required evidence、validation、review artifact の配置、報告規約を取得する。
2. `../review-common/review-playbook.md`。
3. `reviewers.md`、`review-gates.md`、`output-format.md`。
4. ユーザーが明示した target、intended version、publication / distribution target、範囲、参照資料。
5. repository の manifest、build / packaging configuration、release docs、CI configuration、approved product / release policy、既存の release evidence。

特定の ecosystem、manifest filename、directory、registry、branch、tag、evidence format、命名、finding prefix が存在することを前提にしない。repository instructions と既存構成から確認できない release policy は推測しない。

## 対象と release scope

- 主対象は package、library、SDK、distributable artifact、registry-published component など、利用者へ配布される software release である。
- repository instructions が適用範囲を定める場合に限り、application、binary、bundle、container などの distribution target に拡張する。
- ユーザーが target、version、差分、release candidate を明示した場合は、それだけを対象にする。
- 未指定の場合は、repository instructions、既存 release configuration、manifest、release candidate、変更範囲から候補を特定する。特定の directory pattern や package 構成を既定値にしない。
- 候補が 0 件、複数件、intended version が不明、publication target が不明、または scope が一意に定まらない場合は、packaging、publish、registry、release 判定を進めず、`TARGET CONFIRMATION REQUIRED` として確認事項を報告する。
- release scope 外の package、artifact、generated file、debug / test output、secret、unintended dependency が candidate に混入していないか確認する。
- review artifact の保存場所、命名、連番、finding prefix は repository instructions が定義する場合だけ使用する。未定義なら固定形式を発明しない。

## 根拠の範囲

release request、applicable repository instructions、approved release policy / docs / ADR、manifest、公開 contract、source、test、build output、package archive / bundle、CI result、validation result、既存 evidence を根拠として区別する。

manifest、code、test、archive の現在状態は release evidence である。現在そう動くことだけで、supported capability、version policy、release approval、security promise を発明しない。product contract、protocol、platform、compatibility の正否は approved source へ追跡する。

外部 ecosystem、registry、dependency、platform の公式資料は、repository instructions または approved source が必要とする場合に、外部事実を確認するために使う。未確認の環境、registry、長時間 validation、外部サービス、生成物を成功扱いにしない。

## Versioning と compatibility

- intended version、manifest version、release note、tag / publication metadata、artifact metadata の一貫性を確認する。
- repository-defined versioning policy を優先する。SemVer を採用している場合は、breaking change、backward-compatible feature、bug fix、prerelease / stable の compatibility と version increment を確認する。
- SemVer を採用していない場合は、その repository-defined rule、ordering、compatibility、prerelease distinction を検証し、SemVer の慣例を勝手に適用しない。
- public API、exported name、型、data format、error contract、default behavior、configuration、runtime / platform support、dependency contract の変更が version policy と整合するか確認する。
- version の根拠が曖昧な場合は、version を変更せず、候補、影響、未決定理由を記録する。

## Package と distribution metadata

対象 ecosystem に存在する場合だけ、次の metadata を確認する。

- package / artifact name、version、description、license、repository / source metadata、homepage、support metadata。
- entry point、export surface、module / type metadata、runtime / platform requirement、configuration、publication setting。
- files / inclusion rule、generated output、source map、license / notice、required documentation。
- runtime、development、peer、optional、bundled などの dependency classification と、publication 後の解決可能性。

特定の manifest field、package manager、registry、archive command をすべての repository に要求しない。対象 ecosystem が npm の場合は、利用可能な manifest、exports、files、package archive、dependency metadata を確認してよいが、npm 固有の field や scope を普遍的前提にしない。

## Public API と external contract

- candidate の public API、export、command、configuration、data / error contract が、intended version と approved source に一致するか確認する。
- declared support range、runtime / platform compatibility、dependency compatibility、backward compatibility、deprecation / migration information を確認する。
- package metadata が示す入口と実際の artifact の入口、export、型、resource が一致するか確認する。
- release candidate が意図しない public name、internal file、debug interface、unsupported capability を公開していないか確認する。
- compatibility regression は、対象範囲、既存利用者、version policy、approved contract に基づき影響を評価する。一般的な「より良い API」提案は finding にしない。

## Build と distributable artifact

- repository instructions が定める build、package generation、archive / bundle inspection、reproducibility check を使用する。
- build が成功し、intended artifact が生成され、manifest と artifact の metadata が一致するか確認する。
- required runtime file、public entry、型、license、notice、README、release note、生成 file が含まれているか確認する（対象に該当する場合）。
- source-only file、test fixture、debug output、source map、credential、secret、environment data、不要な executable / archive が意図せず含まれていないか確認する。
- generated artifact と source / configuration / version の consistency、archive / bundle の内容、ファイル権限・実行性を、対象 ecosystem と policy に応じて確認する。

具体的な packaging command を固定しない。未生成、未検査、検査範囲不明の artifact を配布可能と扱わない。

## Dependencies

- dependency の runtime / development / peer / optional / bundled 分類が publication model と一致するか確認する。
- version range、lock / manifest consistency、workspace / local dependency の release 時解決性、transitive dependency、unsupported runtime を確認する（対象に該当する場合）。
- repository instructions / approved release policy が定める prohibited dependency、vulnerability threshold、license、integrity、bundling rule を適用する。
- policy が定められていない dependency risk を、一般論だけで release blocker にしない。ただし明白な破損、未解決 dependency、manifest / artifact mismatch は根拠付きで指摘する。

## Documentation と利用可能性

対象に必要な範囲で、README、installation、usage、public API documentation、migration、changelog / release notes、supported / unsupported capability、known limitation、security guidance を確認する。

changelog、migration information、特定の documentation file を全 repository の必須条件にしない。required / optional の区別は repository release policy から取得する。将来機能、外部 dependency の能力、未検証の example を current supported capability として記述していないか確認する。

## Security と supply chain

- secret、credential、private key、token、password、environment data、dangerous test fixture が source、manifest、archive、bundle、生成物、log、evidence に混入していないか確認する。
- source map、debug artifact、test output、unexpected binary / executable / archive、security-sensitive configuration が意図せず公開されていないか確認する。
- dependency integrity、artifact provenance、release source と artifact の対応、build reproducibility、signing、attestation、SBOM を確認する。ただし後者は repository release policy が要求する場合だけ必須 gate とする。
- vulnerability policy、security regression、license / notice、provenance / integrity evidence の不足を、applicable policy と approved source に照合する。
- repository policy に存在しない security control を新しい product requirement として発明しない。ただし明白な secret exposure、artifact tampering、integrity failure は release blocker として扱う。

## Validation evidence

repository instructions と release policy が要求する範囲で、次を確認する。

- unit / integration / compatibility / conformance test、lint、formatter、static analysis、type / compiler validation。
- build、package generation、archive / bundle inspection、installation / smoke check、distribution check。
- release evidence、provenance、signature、attestation、SBOM、vulnerability scan、reproducibility evidence（要求される場合）。
- 実行 command、対象範囲、version、環境、結果、未実行理由、外部依存の状態。

実行していない validation、未確認の evidence、未接続の registry、失敗を隠した CI result を成功扱いにしない。repository-specific mandatory validation が不明な場合は、generic readiness と policy unknown を分離して報告する。

## Severity

severity は package 名、ecosystem、registry、environment の名称ではなく、release impact で判断する。

- `Critical`: secret / credential exposure、悪意または意図しない executable content、重大な supply-chain compromise、release artifact の根本的な integrity failure。
- `Major`: incompatible public API、incorrect package / artifact contents、required validation failure、manifest / artifact mismatch、明示的な release policy violation、supported environment での動作不能。
- `Minor`: release を妨げない metadata の欠落、optional documentation の不足、低影響の packaging inconsistency。
- `Nit`: purely editorial / cosmetic な問題。

既存の repository-specific severity model がある場合は、repository instructions を優先する。severity を理由に未要求の変更や新しい product requirement を発明しない。

## 実行と変更境界

デフォルトは読み取り専用のレビューとする。release target、source、test、configuration、manifest、artifact、tag、remote、registry、release policy を変更せず、publish、tag、registry 操作、承認、release branch 操作も実行しない。ユーザーが別途修正を明示し、repository instructions が許可する場合だけ、対象範囲内の release documentation / metadata の変更可否を個別に確認する。source code、test、lock、dependency、artifact の置換を release review の暗黙の作業にしない。

## Phase boundary と implement-review との分離

`implement-review` は主に implementation correctness、specification compliance、code-level security、test adequacy、behavior を確認する。この Skill は version、packaging、publication metadata、distributable artifact、public release compatibility、dependency、release documentation、evidence、supply-chain、publication readiness を確認する。

release blocking となる実装不具合は、approved source、実行結果、既存 review の状態へ追跡できる場合に release finding として参照する。実装の設計・仕様・リファクタリングそのものを、この Skill の finding として新たに要求しない。

## 実行と判定

`review-common/review-playbook.md` の Phase 0〜3 と、`reviewers.md` の独立観点を適用する。サブエージェントを使わない場合は、実施した自己レビューの観点別パスだけを記録する。

`review-gates.md` の generic release gate を適用した後、repository instructions / approved release policy が定める追加 mandatory gate、required evidence、approval、branch / tag / registry rule を適用する。repository-specific gate が不明な場合は、確認できない状態を無視して完全な release-ready と判定しない。

判定は次のいずれかとする。

- `READY`: generic gate と確認可能な mandatory policy がすべて合格。
- `READY WITH MINOR FIXES`: release を妨げない Minor / Nit だけが残る。
- `NOT READY`: Critical / Major、generic release blocker、required validation failure、manifest / artifact mismatch、secret exposure、重大な compatibility failure、明示的な release policy violation がある。
- `TARGET CONFIRMATION REQUIRED`: release target、version、scope、publication target が一意に確定できない。
- `RELEASE POLICY CONFIRMATION REQUIRED`: generic readiness は評価できるが、mandatory repository release policy または required evidence が不明で完全な判定ができない。

デフォルトの review workflow では package、source、test、configuration、manifest version、tag、remote、registry、artifact、release policy を変更しない。別途明示された修正依頼を扱う場合も、release review の scope、認可、影響、再検証を分離して確認する。publish、tag、registry 操作、承認、release branch 操作を実行しない。

## 自己確認

- release target、artifact、intended version、publication target、scope 外混入が一意に確認できているか。
- version policy、SemVer（採用時）、prerelease / stable、public API、compatibility が根拠へ追跡できるか。
- manifest、metadata、entry / export、files、dependencies、generated artifact、archive / bundle の consistency を確認したか。
- build、package generation、inspection、tests、static validation、release evidence の結果と未実行範囲を正確に記録したか。
- secret、credential、private data、debug / test artifact、unexpected executable、integrity / provenance risk を確認したか。
- README、installation、usage、release note、migration、supported / unsupported capability、limitation が current release と一致するか。
- repository-specific registry、tag、branch、SBOM、provenance、signing、vulnerability、approval policy を推測していないか。
- policy unknown を READY としていないか。generic readiness と repository policy confirmation を分離しているか。
- release review の finding が、implement-review の code review や新しい product requirement に逸脱していないか。
- finding ごとに対象、事実、evidence、影響、必要条件、完了条件、severity、status があるか。

レビュー成果物だけを、repository instructions が定める方法で作成する。共通の finding、severity、evidence、regression、Git、validation ルールは `../review-common/review-playbook.md` に従う。
