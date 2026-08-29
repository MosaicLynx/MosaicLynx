# エージェント Skill 汎用化 最終横断レビュー

## 1. Review Target / Review scope

- Review type: 第1〜4段階の Skill 汎用化に対する最終横断レビュー
- Review date: 2026-08-29
- Review artifact: `docs/reviews/release/skill-generalization-cross-review-001.md`
- Review scope: `AGENTS.md`、`.agents/project-context.md`、`author-common`、`review-common`、6組の author / reviewer Skill、`release-readiness-review` と各補助資料
- 未確認範囲: product docs、ADR、実装、テストの内容そのもの。今回の判定では、Skill がそれらを正本として参照する契約を確認するために必要な範囲だけを確認した。
- 変更範囲: このレビュー成果物のみ。Skill、AGENTS.md、product docs、ADR、実装は変更していない。

出力先は、repository instructions が定める release review artifact の配置に従った。Skill 自身がこの物理パスに依存することを意味しない。

## 2. Execution Audit

サブエージェントは使用せず、次の独立した確認パスを実施した。

1. repository context、project-context stub、common playbook の責務を確認した。
2. 全13 Skill の frontmatter、対象取得、Source of Truth、fallback、変更境界を確認した。
3. author / reviewer の phase boundary、成果物、品質観点、terminology の対応を比較した。
4. security、trust boundary、secret handling、異常系、interoperability、determinism、supply-chain の保持を確認した。
5. generic gate、repository-specific gate、severity、finding output の層分離を比較した。
6. relative reference、固定 path、固定語、project-context 直接依存、Markdown / YAML の検証を実施した。
7. Rust CLI library、Python Web API、cryptographic library の仮想 repository を用いて適用可能性を確認した。

## 3. Evidence Used

| Evidence                                     | 用途                                                                                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                  | repository map、artifact 配置、Source of Truth、local policy、validation、review reporting の正本と、product specification との責務分離を確認 |
| `.agents/project-context.md`                 | repository context の第二の正本になっていない互換 stub であることを確認                                                                       |
| `.agents/skills/author-common/**`            | author 共通の Source of Truth、scope、traceability、validation、未知情報の扱いを確認                                                          |
| `.agents/skills/review-common/**`            | review workflow、finding、severity、evidence、gate、regression の共通契約を確認                                                               |
| 6組の author / reviewer Skill と専用補助資料 | phase boundary、author / reviewer symmetry、品質観点、fallback、trigger を比較                                                                |
| `.agents/skills/release-readiness-review/**` | release review の独立性、generic release capability、policy unknown、supply-chain 観点を確認                                                  |
| `quick_validate.py`                          | 13 Skill の frontmatter / 構造検証                                                                                                            |
| repository 内の参照・語句・format 検証結果   | broken reference、固定 path、固有語、project-context 依存、Markdown / YAML の確認                                                             |

## 4. Review Result / Overall assessment / Final gate

全体として、Skill 群は repository-independent な汎用 Skill として利用可能な状態に到達している。特定の repository layout、language、package manager、protocol、network、component architecture、registry、release branch を active Skill の既定値として使用していない。

一方、以下の Minor finding が未解消である。

- requirements-author が扱う operational / compliance 等の条件付き要求に対する requirements-review の明示的な確認観点が弱い。
- generic gate の「1つ以上不合格」と、Skill 本文の「Critical は blocking、Major / Minor は defer 可能」という判定文に表現上のずれがある。
- phase ごとの severity model に共通の影響ベースの対応関係が明記されていない。

**Final gate: `READY WITH CONDITIONS`**

Critical / Major の未解消 finding はなく、他 repository での利用を直ちに阻害する欠陥は確認されなかった。ただし、上記3点を将来の共通基盤保守で明文化し、phase 間の判定 drift を防止することを条件とする。

## 5. Summary / Findings overview

| ID              | Severity | Status | Area                                     | Gate impact                                                                |
| --------------- | -------- | ------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| `SKILL-GEN-001` | Minor    | New    | requirements author / reviewer symmetry  | 条件付き。operational / compliance 等の明示的な review coverage を整理する |
| `SKILL-GEN-002` | Minor    | New    | generic gate と blocking severity の対応 | 条件付き。gate failure の意味を phase 間で統一する                         |
| `SKILL-GEN-003` | Minor    | New    | phase 間 severity mapping                | 条件付き。集約時の影響比較方法を明文化する                                 |

## 6. Finding Status / Findings

### `SKILL-GEN-001` — Minor — New

- Location: `.agents/skills/requirements-author/SKILL.md:40`、`.agents/skills/requirements-author/scope-boundary.md:5-17`、`.agents/skills/requirements-review/reviewers.md:13-15`、`.agents/skills/requirements-review/review-gates.md:8`
- Evidence: requirements-author は、承認済み資料に根拠がある場合の `performance`、`capacity`、`lifecycle`、`operational`、`compliance` を要求候補として扱う。scope-boundary も operational behavior を requirements 候補に含める。一方 requirements-review は quality、security、privacy、interoperability、failure、constraints を確認するが、operational / compliance の条件付き review coverage を明示していない。
- Problem: 「constraints」や「quality」に含めて解釈することはできるが、author が合法的に作成できる条件付き要求の一部が reviewer の確認表へ明示的に対応していない。author / reviewer の意味上の契約に軽微な非対称が残る。
- Impact: operational または compliance が重要な repository で、requirements-review がその要求の欠落・矛盾・検証可能性を一貫して確認しない可能性がある。これは新しい product requirement の追加要求ではなく、既存の approved requirement をレビューする観点の不足である。
- Required change: requirements-review に該当時の operational / compliance / capacity 等を明示するか、既存の quality / constraints gate がそれらを条件付きで包含することを明文化し、requirements-author と対応させる。
- Completion check: author の要求候補と reviewer の観点・gate を比較し、条件付き概念の omission がないことを再確認する。

### `SKILL-GEN-002` — Minor — New

- Location: `.agents/skills/concept-review/review-gates.md:13`、`.agents/skills/requirements-review/review-gates.md:14`、`.agents/skills/design-review/review-gates.md:14`、`.agents/skills/spec-review/review-gates.md:13`、`.agents/skills/implement-review/review-gates.md:12`。対照箇所は各 `SKILL.md` の generic gate 判定節。
- Evidence: phase の `review-gates.md` は概ね「すべての generic gate が合格なら READY、1つ以上不合格なら REVISE」と記述している。requirements / design / specification / implementation の `SKILL.md` は、Critical の unresolved issue 等があれば REVISE とし、Major / Minor または実装レビューの HIGH 以下は安全に引き継げる場合に Deferred / Optional として READY にできると記述している。review-common は Critical を blocking、Major を修正推奨、Minor を軽微な欠陥と定義する。
- Problem: 「任意の gate failure が即 REVISE」なのか、「blocking に相当する gate failure だけが REVISE」なのかが補助資料と Skill 本文で一意に読めない。gate の不合格を Critical finding に対応付ける記述がある phase と、Major / Minor の defer を明記する Skill 本文の間にも、運用上の解釈差が生じる。
- Impact: 同じ evidence を phase によって異なる final gate へ分類する可能性があり、レビュー結果の再現性が低下する。repository-specific gate を適用する前の generic 判定にも影響する。
- Required change: generic gate の不合格条件を blocking severity と明示する、または gate failure を常に blocking とするなど、review-gates と各 Skill の判定文を共通 severity model に合わせる。
- Completion check: 全 phase で、Critical / Major / Minor / phase-specific severity と READY / REVISE の対応が同じ表現で確認できること。

### `SKILL-GEN-003` — Minor — New

- Location: `.agents/skills/review-common/review-playbook.md:126-132`、`.agents/skills/readme-review/output-format.md:8-11`、`.agents/skills/implement-review/output-format.md:8-11`、`.agents/skills/release-readiness-review/output-format.md:8-12`
- Evidence: review-common は文書レビューの原則的な severity として Critical / Major / Minor を示す。readme-review は ERROR / WARN / NIT、implement-review は CRITICAL / HIGH / MEDIUM / LOW、release-readiness-review は Critical / Major / Minor / Nit を採用している。各 phase 内では gate と整合するが、phase 間の影響ベースの明示的な mapping はない。
- Problem: phase-specific model を許容する設計自体は妥当だが、複数 phase の findings を統合する Chair や後続工程が、severity 名から blocking impact を一意に比較する契約を持たない。
- Impact: cross-phase report、再 review、release readiness への引き継ぎで、ERROR / CRITICAL / Major などの扱いを個別解釈する余地が残り、将来の drift を招く。
- Required change: 共通の影響ベース severity への mapping を review-common に定義するか、phase-specific model を維持する理由と Critical / Major / Minor / Nit 相当の対応を各 output-format に明記する。
- Completion check: phase-specific severity から最終 gate への blocking / non-blocking の変換が、reviewer の推測なしに確認できること。

## 7. Required Changes

共通 playbook の定義に基づく Critical / Major の finding はない。したがって、今回の artifact に対する blocking な Required Changes は「なし」とする。上記 Minor finding は、次回の共通基盤保守で対応すべき条件付き改善として Optional Improvements に記録する。

## 8. Optional Improvements

- `SKILL-GEN-001`: requirements の条件付き operational / compliance / capacity 観点を author / reviewer 間で対応付ける。
- `SKILL-GEN-002`: generic gate failure と severity / final gate の対応を全 phase で統一する。
- `SKILL-GEN-003`: phase-specific severity を横断集約する mapping を定義する。

いずれも、新しい product requirement、security control、release policy を発明する変更ではなく、既存の汎用 review 契約の明確化である。

## 9. Resolved Findings

なし。今回の横断レビューでは過去 finding の対応確認を目的とした変更を行っていない。

## 10. Deferred Findings

なし。`SKILL-GEN-001`〜`003` は後続の共通 Skill 保守へ引き継ぐが、別の review artifact へ状態を移したものではない。

## 11. Scope and Traceability / Author-reviewer symmetry

| Phase             | Author が作るもの                                                                                                                                 | Reviewer が確認するもの                                                                                                       | 評価                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Concept           | problem、value、user / stakeholder、scope / non-goal、responsibility、assumption、success criteria、unresolved issue                              | 同じ概念の根拠、粒度、scope、前提、成功条件、未解決事項。API / design / implementation の要求はしない                         | 整合                           |
| Requirements      | what、actor / responsibility、functional / quality / security / operational requirement、constraint、acceptance、failure、traceability            | clarity、scope、actor、responsibility、acceptance、security、failure、traceability、曖昧さ、矛盾。新しい要求は発明しない      | `SKILL-GEN-001` の条件付き差分 |
| Design            | responsibility allocation、component boundary、dependency、trust / secret boundary、ownership、lifecycle、failure、concurrency、運用責任          | 上記の境界、依存方向、security invariant、traceability、下位仕様への委譲                                                      | 整合                           |
| Specification     | external contract、input / output、validation、serialization、canonicalization、error、state、compatibility、interoperability、暗号契約（該当時） | 同じ契約の完全性、deterministic representation、異常系、compatibility、fixture / vector、implementation independence          | 整合                           |
| Implementation    | approved source に基づく最小変更、code / test、error、security、lifecycle、compatibility、validation                                              | specification conformance、secret handling、malformed / unsupported input、fail-closed、test、regression、validation coverage | 整合                           |
| README            | implementation と public contract に整合する installation、usage、API、support、configuration、security、limitations、examples                    | README と manifest / public API / implementation / specification / test の事実整合と overclaim                                | 整合                           |
| Release readiness | version、metadata、package / artifact、public release compatibility、dependency、documentation、evidence、supply-chain                            | release scope、packaging、publication readiness、artifact inspection、policy evidence                                         | implement-review と分離        |

Source of Truth の流れは、user instruction → applicable repository instructions → approved artifact / ADR / specification → code / test / build evidence となっている。Skill は product specification を生成せず、code の現在挙動だけで requirement や public promise を正当化しない。

## 12. Domain Checks

### Repository independence

PASS。active Skill 全体から、固定の repository layout、`docs/...`、`apps/...`、`packages/...`、language、runtime、package manager、protocol、network、database、client architecture、registry、CI、release branch を既定値としている記述は確認されなかった。条件付きの `npm` と `SemVer` は対象 ecosystem / version policy が該当する場合だけ適用される。`mnemonic` は実装 Skill の秘密情報種別の一般例であり、repository 固有語ではない。

### AGENTS.md dependency model

PASS。Skill は特定の `## Artifact Layout`、`## Source of Truth`、`## Repository Map` などの見出しを要求せず、applicable repository instructions から意味として artifact location、Source of Truth、boundary、validation、local policy を取得する。`.agents/project-context.md` への active Skill からの直接参照もない。stub は既存参照の互換性だけを担い、repository context の正本ではない。

### Source of Truth

PASS。author は approved source と implementation evidence を区別し、reviewer は finding を approved source、対象事実、影響へ追跡する。一般的 best practice、reviewer preference、現在 code の挙動だけから product requirement、security promise、release policy を発明しない。unknown / undecided、insufficient evidence、policy unknown を成功扱いにしない。

### Phase boundary consistency

PASS。Concept は problem / value / scope に留まり、Requirements は what / constraint / acceptance、Design は responsibility / component / boundary / lifecycle、Specification は external contract / representation / error、Implementation は approved specification への適合として分離されている。各 reviewer も下流 phase の詳細を要求しない。README は documentation fact review、release は distribution readiness に限定されている。

### Author / reviewer symmetry

CONDITIONAL。Concept、Design、Specification、Implementation、README は概ね対応する。Requirements の operational / compliance 等の条件付き観点だけ `SKILL-GEN-001` を記録した。

### Terminology consistency

PASS。`repository-defined component` は repository から取得する構成単位、`secret-bearing` / `signing-capable` は扱う capability、`trusted` / `privileged` は authority / permission、`remote` / `external` / `opaque` は境界または解釈可能性、`protocol` / `network` / `external system` は適用対象の外部領域として使われている。`public contract` は利用者に公開される契約、`external contract` は境界を越えて合意される契約として phase に応じて区別され、判断差につながる表現揺れは確認されなかった。

### Security capability preservation

PASS。Design / review は trust boundary、secret boundary、data ownership、責任、lifecycle を保持する。Specification / review は暗号が対象に存在する場合の algorithm、parameter、encoding、failure、interoperability、test vector を曖昧にしない。Implementation / review は secret handling、authentication / authorization（該当時）、malformed / unsupported input、fail-closed、replay / expiry（該当時）、determinism、test、regression を確認する。Release は secret exposure、unexpected executable、dependency integrity、provenance、SBOM / signing / attestation（policy が要求する場合）を確認する。

### Fallback behavior

PASS。各 Skill は user instruction、applicable repository instructions、既存構成・manifest・artifact、approved docs / ADR の順に確定可能な情報を利用する。artifact path、component boundary、toolchain、protocol、validation command、review prefix、release policy が確定できない場合は推測せず、insufficient evidence / unresolved / confirmation required として扱う。特定 repository の慣例への fallback はない。

### Gate / output consistency

CONDITIONAL。generic gate と repository-specific gate の二層構造、finding の evidence / impact / required change / status、review artifact の共通構成は維持されている。一方、gate failure の blocking 解釈と phase-specific severity の横断 mapping に `SKILL-GEN-002`、`SKILL-GEN-003` を記録した。

### Release review separation

PASS。`implement-review` は code-level correctness、specification compliance、security、test、regression を中心に扱う。`release-readiness-review` は version、metadata、packaging、public release compatibility、dependencies、documentation、evidence、supply-chain、publication readiness を扱い、publish / tag / registry / approval を実行しない。release blocking な実装不具合を evidence として参照する場合も、実装レビューそのものへ戻らない。

### Trigger / frontmatter

PASS。全13 Skill の description は phase-specific で、Concept、Requirements、Design、Specification、Implementation、README、package / distributable artifact release を区別している。author と reviewer、implementation review と release readiness review の誤競合を生む広すぎる trigger は確認されなかった。release の `openai.yaml` も software package / distributable artifact の release readiness に限定されている。

## 13. Validation Results

| Validation                                                                                          | Result                                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 全13 Skill の `quick_validate.py`                                                                   | PASS。13件すべて `Skill is valid!`                                                                                                          |
| expected relative reference files                                                                   | PASS。author-common、review-common、各専用 reviewers / gates / output、release の `openai.yaml` を確認                                      |
| active Skill の `.agents/project-context.md` 直接参照                                               | PASS。該当なし                                                                                                                              |
| active Skill の固定 absolute path、repository 固有語、固定 `docs/...` / `apps/...` / `packages/...` | PASS。禁止対象の active dependency は該当なし                                                                                               |
| common playbook dependency                                                                          | PASS。author / reviewer / release が対応する common playbook を参照し、参照先が存在する                                                     |
| broken relative reference                                                                           | PASS。確認対象の参照先は存在する                                                                                                            |
| Markdown / YAML format                                                                              | PASS。local formatter で対象 Markdown と全対象 Skill Markdown、`release-readiness-review/agents/openai.yaml` を確認し、YAML parser でも確認 |
| `pnpm exec prettier --check`                                                                        | Not validated。環境が pnpm の database file を開けず終了したため、local formatter で代替確認                                                |
| `git diff --check`                                                                                  | PASS。staged diff に対して実行                                                                                                              |
| lint / typecheck / test / build                                                                     | Not validated。コード、test、implementation を変更していないため今回の対象外                                                                |

`AGENTS.md` には repository-specific な product、component、toolchain、artifact layout の記述が残るが、これは今回確立した責務分離どおりの local context であり、active Skill の portability を損なわない。過去レビュー成果物や compatibility stub に現れる固有語は、active Skill dependency と区別した。

## 14. Remaining repository-specific dependencies

- `AGENTS.md`: repository map、artifact location、Source of Truth、boundary、validation、review reporting、local prohibition の正本。特定 repository の作業時だけ適用する。
- `.agents/project-context.md`: repository context の正本ではない互換 stub。新しいルールや product specification は置かない。
- approved docs / ADR / specification / manifest / CI configuration / code / test: product contract、具体的 protocol、crypto parameters、API、release policy、実装状態を確定する正本または evidence。Skill はそれらを推測で補完しない。
- `npm`、SemVer、`mnemonic` の残存: 前二者は対象 ecosystem / version policy に対する条件付き一般概念、後者は秘密情報の一般例であり、特定 repository への依存ではない。

active Skill に、repository-specific な MosaicLynx、Symbol / NEM、Relay、wallet-core、Chrome、TypeScript、pnpm、Redis、Mainnet / Testnet、固定 package scope、固定 evidence path の依存は残っていない。これらを含む具体的な local rule は `AGENTS.md` または approved docs / ADR 側に委譲されている。

## 15. Remaining Risks and Open Decisions

- `SKILL-GEN-001`〜`003` は portability を直ちに壊さないが、複数 phase の review board や自動集約を運用する場合に drift を招き得る。
- repository instructions が存在しない repository では、generic capability は利用できるが、artifact location、mandatory gate、validation、release policy の判定は confirmation required / policy unknown となる。これは fail-safe な挙動であり、既定値の補完ではない。
- generic Skill の品質を維持するため、将来 repository-specific policy を Skill 本体へ戻さず、AGENTS.md または approved docs / ADR の参照として追加する必要がある。

## 16. Automatic Changes

なし。レビュー成果物のみを作成し、finding に対する Skill の自動修正は行っていない。

## 17. Final Decision / Recommended next action

推奨する次のアクションは、`SKILL-GEN-001`〜`003` を共通基盤の保守課題として扱い、requirements の条件付き観点、gate の blocking semantics、severity mapping を明文化した後に、この横断レビューを再実行することである。release-readiness-review の追加汎用化を直ちに始める必要はなく、今回の第4段階までの Skill 群は条件付きで利用可能である。

**Final gate: `READY WITH CONDITIONS`**

**GENERIC SKILL SET READY**
