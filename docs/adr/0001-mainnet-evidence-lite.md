# ADR 0001: Lite evidence policy before strict operation

## Decision

Adopt a 30-day Lite gate for the initial Mainnet release: one release approval, signed JCS manifest, source/artifact/lockfile/SBOM digests, SDK integrity, compatibility metadata, and passing unit/integration/E2E evidence. The same evaluator supports a stricter policy with independent release and security approvers.

## Context

The prior product specification §19 made two-person approval, reproducible builds, fuzzing, audits and key ceremonies mandatory. This is not sustainable for the present single-maintainer project, while permitting Mainnet with no proof is unacceptable.

## Consequences

The strict requirements remain the target policy and must be enabled before team or high-assurance operation. The 30-day expiry creates recurring release work but prevents stale evidence from enabling a new build. Ed25519 was chosen because the project already uses that signature family for origin proofs and Node.js Web Crypto supports detached verification without adding a signing dependency.
