# Release process

1. Start from `v<version>` at a clean, reviewed commit.
2. Run the unit, integration and browser E2E suites, then collect evidence and build the Extension.
3. Generate the manifest, inspect every digest and test report, add the release approval, and sign it on an offline machine.
4. Add the signer public key and key ID to the policy before running `evidence:verify` and `build:extension`.
5. Retain the signed manifest, detached signature, reports and artifacts in the release evidence directory. Do not retain signing keys, user payloads, credentials, or environment dumps.

At 30 days, or after a source, dependency, parser, fixture, build, or policy change, repeat the procedure. An expired manifest cannot be refreshed by changing timestamps: regenerate and sign the affected evidence.
