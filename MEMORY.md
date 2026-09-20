# Project Memory

## Confirmed

- 2026-09-20 時点の実装対象は `apps/extension`、`apps/relay`、`apps/link-fallback`、`apps/test-dapp` と `packages/*`。Mobile App の実装 package / app は現在の workspace に存在せず、Mobile の Requirements / Design / Specification は計画・契約資料として扱う。
- Concept は `docs/reviews/concept/concept-sheet-review-003.md` で `READY`、Common Requirements は `docs/reviews/requirements/requirements-review-006.md` で `READY`。
- Specification Phase の cross-review-002 で指摘された `SPCR-005`（横断 traceability）、`SPCR-008`（Mobile Mainnet 条件の premature fixation）、`SPCR-009`（Interfaces / Handoff / SDK の contract authority 重複）、`SPCR-010`（Product manifest と Lite policy の承認条件不整合）は、仕様修正後の `docs/reviews/specifications/specification-phase-cross-review-003.md` で全て `Resolved`、Review Result は `READY`。ただし、Mobile / Relay の実装・実機・release evaluator の検証完了を意味しない。
- Design の最新 review は Gate 上 `READY` だが、未解決 follow-up が残る。主なものは Architecture `DR-003`、Security `DR-SEC-001` / `DR-SEC-002`、Signing Flow `DR-SF-007` / `DR-SF-008`、Interfaces `DR-006` / `DR-007`。`READY` を解決済みとは扱わない。
- `docs/reviews/implementation/` に Implementation Review 成果物はなく、実装コードは存在するが正式な Implementation Review は未実施。
- Mainnet capability は signed release evidence がない限り fail-closed。現在の `docs/evidence/evidence-policy.json` は Lite（release approval 1、security approval 0）で、trusted key は未登録のため、現行 build は Testnet-only として扱う。
- Root `README.md` は存在しない `@mosaiclynx/mobile` package と `evidence:mobile` script を参照している。Mobile 実装が追加されるまで、README の記載は実装済み capability の根拠にしない。

## Memory boundary

- このファイルは継続コンテキスト用の索引であり、正式な判断はユーザー依頼、承認済み文書、ADR、manifest、実装・テストを優先する。
