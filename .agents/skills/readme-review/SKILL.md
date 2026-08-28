---
name: readme-review
description: README を manifest、公開 API / contract、実装、仕様、テスト、設定、metadata と照合し、正確性、利用可能性、security guidance、制約、supported / unsupported capability、整合性をレビューする。コードや仕様は変更しない。
---

# README Review

README を利用者向け documentation としてレビューし、利用者が前提を理解して最初の利用まで進められ、記載内容を現在の実装・公開契約・approved source が裏付けているかを判定する。README の誤りを、API、製品仕様、実装、依存先の変更で解決しない。

## 作業開始時の確認

次の順に確認する。

1. applicable repository instructions。対象 README、review artifact の配置、対象 component、Source of Truth、repository-specific gate、validation、報告規約を取得する。
2. `../review-common/review-playbook.md`。
3. `reviewers.md`、`review-gates.md`、`output-format.md`。
4. ユーザーが明示した README、範囲、参照資料。
5. 対象の manifest、workspace / build 設定、公開 export、型、実装、test、approved specification、ADR、必要な公式資料。

特定の repository layout、language、package manager、platform、domain、product capability、README path、finding prefix を前提にしない。repository instructions と existing structure から確認できない detail は推測せず、insufficient evidence として扱う。

## 対象と成果物

- ユーザーが README の path、component、package、application を指定した場合は、その範囲だけを対象にする。
- README path が未指定の場合は、repository instructions の探索規則と既存構成から対象を一意に特定する。候補が 0 件または複数件なら自動選択しない。
- review artifact の保存場所、命名、連番、finding prefix は repository instructions が定義する場合だけ使用する。定義がなければ固定形式を発明しない。
- 既存レビュー成果物を移動、削除、上書きしない。README、code、manifest、specification、設定をレビュー中に変更しない。

## 確認する事実源

README 全体を読んだ後、対象の manifest / metadata、workspace 設定、公開 export、型、主要実装、configuration、test、sample、build / distribution 設定、approved specification、ADR、license を必要な範囲で照合する。

外部 platform、domain、network、protocol、service、dependency の公式資料は、外部事実や利用前提の確認に使う。ただし外部資料が説明する能力を、対象が提供する capability と誤認しない。確認できない環境や未実行の sample は成功扱いにしない。

## レビュー観点

- purpose、scope、current status、supported / unsupported / experimental / planned capability の区別。
- installation、prerequisite、runtime / platform requirement、configuration、environment、dependency。
- package / component 名、import、public API / command / interface、引数、戻り値、公開型、version、metadata。
- 最初の利用までの導線、最小例、example の再現性、error、validation、resource / lifecycle、compatibility、limitations。
- security、privacy、secret / credential handling、trust boundary、external / remote system の責任と保証範囲。
- domain、platform、network、protocol、version の差異、互換性、外部形式の説明（対象に適用される場合）。
- README、manifest、公開 contract、実装、仕様、test、設定、license、links の整合性。
- 利用者に必要な制約が欠落していないか、内部詳細や未承認の保証が過剰記載されていないか。

## Phase boundary と finding

finding は README 自体の誤り、README に必要な情報の不足、または README が利用者を具体的に誤誘導する問題に限定する。API 設計、product requirement、implementation quality、performance、coverage、将来の capability を新しく要求しない。

実装・仕様・metadata の不一致は、README の修正で事実を合わせられるのか、別工程の unresolved issue なのかを分離する。実装にないものを README に追加せず、外部 dependency の capability だけを supported と記載しない。

README review の finding は新しい product requirement や support policy の根拠ではない。不明な仕様、platform requirement、security promise は推測せず、unresolved または適切な source への確認事項として記録する。

## 実行と判定

`review-common/review-playbook.md` の Phase 0〜3 と、`reviewers.md` の独立観点を適用する。サブエージェントを使わない場合は、実施した自己レビューの観点別パスだけを記録する。

`review-gates.md` の generic phase gate を適用した後、repository instructions が定める追加 mandatory gate、required evidence、review policy を適用する。repository-specific gate が不明、または必要な evidence を確認できない場合は、合格や READY とせず、未確認として記録する。

generic gate の結果は `READY`、`READY WITH MINOR FIXES`、`REVISE README` とする。ERROR / WARN、current capability と記述の重大な不一致、利用開始を妨げる不足がある場合は後者とする。NIT だけで安全に次工程へ進める場合は READY WITH MINOR FIXES とし、repository policy に従う。

レビュー成果物だけを、repository instructions が定める方法で作成する。未確認事項、未実行の validation、外部リンクや sample の未検証を成功扱いにしない。

## 自己確認

- README の purpose、installation、usage、configuration、example、public API が現在の source と一致しているか。
- supported / unsupported / planned capability、platform requirement、version、limitations、compatibility が根拠へ追跡できるか。
- 実装、仕様、外部 dependency、将来計画を混同していないか。
- security、secret handling、trust boundary、error、failure、制約、保証範囲が利用者に誤解なく伝わるか。
- domain / platform / network / protocol の差異を、適用される場合だけ正確に扱っているか。
- 相対リンク、外部リンク、command、code example、placeholder、license の確認範囲を正確に記録したか。
- finding ごとに対象箇所、事実、根拠、影響、必要条件、完了条件があるか。
- repository-specific gate、evidence、命名規約が不明な場合に PASS としていないか。

共通の finding、severity、evidence、regression、Git、validation ルールは `../review-common/review-playbook.md` に従う。
