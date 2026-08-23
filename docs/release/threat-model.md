# Release evidence threat model

The gate mitigates accidental Mainnet enablement, stale test results, wrong source revisions, altered evidence files, unsigned manifests, and insufficient approval. It does not make a compromised trusted release key safe, establish Store review, or protect a malicious maintainer who can alter both source and policy.

Trust boundaries are the offline release key, the checked-in trusted public-key policy, the clean tagged source revision, and the generated Extension artifact. The Extension enforces its embedded capability in the Background transaction and message entry points; hiding UI controls is only a secondary control.

Evidence scanners deliberately fail closed on secret-looking content. They scan reports, manifests, provenance and attachments; source archives, binary artifacts, lockfiles and SBOMs are excluded from hostname scanning because they legitimately contain product dependency and endpoint names. Private keys and other high-risk patterns remain prohibited from all text evidence.
