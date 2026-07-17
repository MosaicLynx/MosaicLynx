# Mainnet release evidence

Mainnet capability is fail-closed for each platform. A build embeds `true` only when the release-build gate verifies a signed evidence manifest. Missing evidence always produces a Testnet-only Extension.

## Lite policy

`docs/evidence-policy.json` is the checked-in policy. Lite requires a clean tagged commit, a source archive, Extension artifact, lockfile, SBOM, Symbol SDK integrity, compatibility versions, successful unit/integration/E2E reports, and one release approval. Manifest and all required evidence expire after 30 days. Optional audit, reproducible-build, differential, and fuzz entries must be marked `not-required` when absent.

The policy's `trustedKeys` maps key IDs to base64 DER/SPKI Ed25519 public keys. Private PKCS#8 PEM signing keys are intentionally never stored in this repository.

## Commands

```sh
pnpm evidence:collect --version 0.1.0
pnpm build:extension
pnpm evidence:manifest --version 0.1.0 --key-id release-2026
# edit the manifest to add the release approval
pnpm evidence:sign --version 0.1.0 --key /offline/release-2026.pem
pnpm evidence:verify --version 0.1.0 --platform extension
pnpm evidence:gate --version 0.1.0 --platform mobile
```

`collect` never reads a signing key. `sign` emits only a detached base64 signature. `gate` writes a platform report even on failure and exits nonzero when Mainnet is disabled.

## Investigation and recovery

Read `extension/extension-capability-report.json` or `mobile/mobile-capability-report.json` for each exact failure. Regenerate expired test/artifact evidence and sign a new manifest; do not edit digests in place. For a lost or suspected compromised release key, immediately remove its key ID from the policy, ship a Testnet-only build if needed, create a replacement offline key, update the public key inventory, and sign the next release with the replacement. Treat the old key as revoked.

## Strict migration

Change `mode` to `strict`, require one release and one security approval, set `minimumDistinctApprovers` to 2, and set `allowSameApproverMultipleRoles` to `false`. Before changing the policy, arrange the audit, reproducible-build, fuzz and differential evidence required by the release process.
