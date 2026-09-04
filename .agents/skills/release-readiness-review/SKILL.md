---
name: release-readiness-review
description: MosaicLynx の公開対象 package、Extension、Relay、WASM / Native Binding などの実在する distribution surface と、それらを束ねる release evidence / workflow を公開前に照合する。publish、tag、source code の変更は行わない。
---

# Release Readiness Review

MosaicLynx の公開対象、package、Extension、Relay、必要に応じて外部 wallet-core Binding と、それらを
束ねる release evidence / workflow が、現在の実装、公開契約、配布物、security boundary、運用前提と一致し、
安全に公開できるかをレビューする。公開操作、tag、remote、registry、source code の変更は行わない。

## 作業開始時に読む資料

1. `AGENTS.md`
2. `../review-common/review-playbook.md`
3. `reviewers.md`、`review-gates.md`、`output-format.md`
4. `agents/openai.yaml`
5. 対象 repository の manifest、README、license、CHANGELOG、変更差分
6. `docs/release/release-process.md`、`docs/release/mainnet-release-evidence.md`、`docs/evidence/evidence-policy.json`
7. 対象に対応する仕様、設計、レビュー成果物、workflow、packaging / evidence script

対象 repository に存在しない固定 path や生成物を前提にせず、存在を確認した資料だけを根拠として扱う。
`_snwc` は外部 wallet-core であり、MosaicLynx の release set に明示されない限り root の公開 package として扱わない。

## 対象と release set の確定

- package、app、Extension、artifact、README または release set が明示された場合は、その指定を優先する。
- repository-wide release readiness、production release、複数 surface の公開前 review が指定された場合は、実在する app / package、release workflow、SBOM、provenance、release evidence を discovery して一つの `composite release target` として扱う。
- 現在の workspace では、`packages/sdk` の publish 設定と、Extension / Relay / test-dapp などの private app / package を manifest で区別する。将来 Mobile を実装済み surface と仮定しない。
- 外部 wallet-core / Native C ABI / WASM Binding は、release contract や対象 asset に明示された場合だけ surface として確認する。
- composite target では各 surface の責任境界と artifact を個別に確認する。
- 指定がなく候補が複数ある場合だけ自動選択せず、`TARGET CONFIRMATION REQUIRED` とする。
- package version、asset 数、package 名などは Skill に固定せず、manifest、release manifest、workflow、証拠から discovery して照合する。

## Release surface discovery

レビュー開始時に、対象 repository の構造から次を必要な範囲で discovery する。

- root `package.json`、workspace package、lockfile、`apps/**/package.json`、`packages/**/package.json`
- package の `private`、`publishConfig`、`files`、`exports`、`main`、`types`、scripts
- TypeScript 公開 API / declaration、Extension bundle、Relay image / archive、生成 asset、外部 Binding asset（存在する場合）
- root / package README、license、CHANGELOG、public release docs
- `.github/workflows/**` と environment / permission / publish boundary
- `tools/` の release evidence script、evidence policy、manifest、公開鍵、checksum、SBOM、license、provenance
- archive、npm package、Extension build、Relay distribution とその検証 fixture

固定のディレクトリ名や asset 数を必須条件にせず、発見した surface、生成手順、証拠、未確認範囲を
`Review Target` と `Scope and Traceability` に記録する。

## 確認範囲

対象確定後、次を発見した実体に対して確認する。

1. manifest、version、license、repository、description、依存関係、runtime 条件、private / publish 設定
2. TypeScript 公開 API、declaration、Extension / Provider surface、Relay endpoint、外部 Binding export（対象に含む場合）
3. README、CHANGELOG、license、release docs、translation / package README の public fact と契約の整合
4. package / archive / bundle の含有ファイル、secret、fixture、temporary data、不要な開発物
5. browser / Node runtime、Extension loading、Relay deployment、unsupported target、failure path
6. release workflow、tag / source / version binding、OIDC、provenance、SBOM、license、durable release evidence、retry / recovery
7. public surface の obsolete wording、placeholder、local path、credential、unsupported / deferred capability の過剰記載

## npm / package review

公開 package が発見された場合、次を確認する。列挙した metadata は全 package に必須と決めるものではなく、
存在する値、必要な不足、repository との不一致を評価する。

### Identity / metadata

name、version、description、license、repository、engines、publishConfig、files、type、main / module / types、
exports を manifest と `npm pack --dry-run` または既存 evidence に照合する。private package を公開対象として扱わない。

### Public API / runtime

- runtime exports、TypeScript declarations、public subpaths、default export の有無
- sync / async contract、binary type、documented API、公開 API の名前・型・制約
- browser、bundler、Extension、Node、package-local asset、remote download の有無
- SDK / Provider と Extension、Relay、外部 wallet-core の責任境界

## 配布物と security

`npm pack --dry-run`、Extension build、Relay archive または release evidence から expected / unexpected files を確認する。
source map、fixture、test data、development script、local path、credential、private key、Mnemonic、temporary data、
binary、WASM、README、license、package metadata を対象にする。意図的な test secret が repository test にあること自体は
blocker とせず、公開 tarball・bundle・durable release asset への混入を blocker とする。

Vault、Profile、signing、Relay、backup の説明が、秘密情報を不要に配布・公開・復号するよう誤認させないか確認する。
external wallet-core の鍵管理・署名責任、Extension の承認、dApp の announce、Relay の opaque transport を混同しない。

## Supply-chain / release operation

発見された release workflow と evidence に対して、次を review domain とする。

- trigger、tag / source commit / version binding、protected environment、permissions、least privilege、publish boundary
- npm Trusted Publishing / OIDC、long-lived token fallback、registry identity、package / version collision behavior
- SBOM format / identity、strict license policy、unknown license、third-party license text、digest binding
- Actions artifact と durable release record の区別、exact asset set、manifest、checksum、release-record
- evidence collect / manifest / verify / gate の失敗、workflow rerun、二重 publish、version collision、recovery の fail-closed behavior

## Public hygiene と documentation consistency

README、package metadata、license、CHANGELOG、public docs、packed artifact、durable release artifact に対して、
obsolete stage wording、placeholder、TODO / FIXME の公開影響、temporary wording、local filesystem path、private path、
internal instruction、credential、token、private key、Mnemonic、sensitive sample、copyright、author、version、public link、
unsupported / deferred feature の誤記を確認する。

複数 README、root README、package README、translation、CHANGELOG、manifest、public API、release docs の間で、package name、
version、environment、target、install、import、API、chain / network、secret handling、signing、export、unsupported / deferred
feature、release status、security guarantee が利用者を誤認させないことを確認する。文章の逐語一致は要求せず、public fact と
contract の semantic parity を要求する。

## SemVer と validation

公開 API、Provider 契約、Relay / backup / wire format、Extension の既定動作の破壊は、対象 repository の version / tag policy と
照合して major / minor / patch の妥当性を確認する。根拠が曖昧な場合は version を変更せず未決定として記録する。

通常の validation は `AGENTS.md` の `## 検証` と対象 package / app の script に従う。この review は release evidence と公開 gate を
確認するため、コード差分がなくても `pnpm evidence:collect`、`pnpm evidence:manifest`、`pnpm evidence:verify`、`pnpm evidence:gate`、
対象 package test / build などを gate に必要な範囲で要求できる。実行した場合は理由を記録し、未実行の registry、external node、
browser、長時間検証を成功扱いにしない。pnpm の環境エラーは repository-defined validation failure と混同せず、`AGENTS.md` の fallback
方針に従って local executable の結果と未検証範囲を分けて記録する。

## 境界、判定、成果物

- レビュー中は README、コード、manifest、仕様、設定、test、fixture、生成物、lockfile、remote、registry を変更しない。
- source、公開 API、製品仕様、release implementation の変更をレビュー指摘から直接実施しない。
- 判定は `READY`、`READY WITH MINOR FIXES`、`NOT READY`、`TARGET CONFIRMATION REQUIRED`。公開阻害事項は `NOT READY`、阻害しない Minor のみなら `READY WITH MINOR FIXES` とする。
- 成果物は共通 `output-format.md` の章構成を使い、composite target の発見結果、surface ごとの確認、evidence、未確認範囲、finding lifecycle、gate、残存リスクを追跡可能にする。
