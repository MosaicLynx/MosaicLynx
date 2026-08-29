# Generic Release Review Gates

各 gate は、release candidate が intended version と distribution target に対して配布可能かを、確認可能な evidence から判定する。repository-specific policy をこの資料へ埋め込まない。

1. Release scope: target、artifact、intended version、publication / distribution target、release scope が一意に確定している。
2. Version / metadata: versioning policy、manifest / metadata、public entry / export、support information、license、publication setting が矛盾しない。
3. Public contract / compatibility: declared public API、external contract、runtime / platform support、dependency compatibility に重大な未承認変更や compatibility regression がない。
4. Build / artifact: build と distributable artifact の生成・検査が成功し、required file が存在し、source / configuration / version と整合する。
5. Package integrity: secret、credential、private data、debug / test artifact、unintended executable / archive、不要な source-only file が意図せず配布されない。
6. Dependencies: dependency metadata、classification、version range、lock / manifest consistency、publication 時の解決性が確認でき、適用 policy に違反しない。
7. Documentation: release に必要な README、installation、usage、public API documentation、migration、release note、limitation、security guidance が current release と整合する（該当する場合）。
8. Validation / evidence: required validation、artifact inspection、compatibility check、release evidence の結果を確認でき、失敗や未実行を成功扱いにしていない。
9. Security / provenance: artifact integrity、source と artifact の対応、dependency integrity、provenance、vulnerability、signing、attestation、SBOM を、適用される policy の範囲で確認できる。
10. Policy conformance: repository instructions / approved release policy から取得した明示的な release 条件に違反していない。具体的な条件自体は generic gate に含めない。

## 判定

- target、version、scope、distribution target が確定できない場合は `TARGET CONFIRMATION REQUIRED`。
- generic release blocker、Critical / Major finding、required validation failure、artifact / metadata mismatch、secret exposure、重大な compatibility failure、明示的な release policy violation がある場合は `NOT READY`。
- generic gate は通るが、repository-specific mandatory gate、required evidence、approval、registry / branch / tag rule が不明な場合は `RELEASE POLICY CONFIRMATION REQUIRED`。この状態を `READY` としない。
- release を妨げない Minor / Nit だけが残る場合は `READY WITH MINOR FIXES`。
- generic gate と、確認可能な repository policy がすべて合格している場合だけ `READY`。

## Repository-specific policy

repository instructions / approved release policy から、次のような追加条件を必要な場合だけ取得する。

- required test suite、vulnerability threshold、license / dependency rule。
- SBOM、provenance、signing、attestation、reproducibility の必須性と形式。
- release evidence の保存方法、approval、branch / tag / registry policy。
- publication target、distribution channel、environment-specific release condition。

追加条件の有無、形式、判定基準を推測しない。確認できない mandatory policy は `RELEASE POLICY CONFIRMATION REQUIRED` として記録する。
