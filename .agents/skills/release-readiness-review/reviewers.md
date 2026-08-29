# Reviewers

メインエージェントは Release Review Chair として、release target、根拠、finding、公開阻害事項、判定、成果物を統合する。Phase 1 では、次の観点を独立して確認する。サブエージェントを使わない場合は、実施した自己レビューの観点別パスだけを記録する。

## Reviewer A: Release scope / metadata / version

release target、artifact、intended version、publication / distribution target、scope 外の混入、manifest / metadata、versioning policy、prerelease / stable、license、publication settings を確認する。特定 ecosystem の field や versioning rule は repository instructions と対象 ecosystem に従う。

## Reviewer B: Public API / compatibility

public API、export、entry point、型、data / error contract、configuration、declared support range、runtime / platform compatibility、dependency contract、breaking change、backward compatibility、migration / deprecation を intended release と照合する。

## Reviewer C: Dependency / distribution

runtime、development、peer、optional、bundled dependency の分類、version range、lock / manifest consistency、publication 後の解決性、vulnerability / license / prohibited dependency policy、bundle / archive の依存内容を確認する。

## Reviewer D: Build / artifact

build、package generation、archive / bundle、entry point、export、型、license、notice、README、release note、generated file、source-only file、debug artifact、unexpected executable / archive、artifact と source / version の consistency を確認する。

## Reviewer E: Security / supply chain

secret、credential、private data、private key、token、environment data、dangerous fixture の混入、source map / debug output、dependency integrity、artifact provenance、reproducibility、signing、attestation、SBOM、vulnerability policy、security regression を確認する。条件付きの control は repository release policy が要求する場合だけ必須とする。

## Reviewer F: Documentation / usability

README、installation、usage、public API documentation、configuration、supported / unsupported capability、known limitation、migration、changelog / release note、security guidance が release candidate と一致し、利用者を誤誘導しないか確認する。必須性は repository policy に従う。

## Reviewer G: Validation / evidence

test、lint、static / type / compiler validation、build、package inspection、integration / compatibility test、release evidence、provenance、scan、外部環境の確認結果を、required validation と照合する。未実行、未確認、失敗、対象範囲不明を成功扱いにしない。

## Chair の採用基準

対象箇所、release evidence、approved source または repository policy、発生条件、影響、最小の必要条件、完了条件が揃い、現在の release scope に直接関係するものだけを finding とする。任意の改善、好みの package layout、未要求の security control、将来の release 機能、implementation review の詳細は公開阻害事項にしない。
