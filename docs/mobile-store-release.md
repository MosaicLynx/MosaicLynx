# MosaicLynx Testnet mobile release

The public mobile build is Testnet-only. Store descriptions and screenshots must state that it is not for real assets. It does not show balances, contact a chain node, announce transactions, or support Mainnet.

## External publishing prerequisites

1. Register `app.mosaiclynx.mobile` in Apple Developer and Google Play Console.
2. Replace the two association templates under `apps/link-fallback/public/.well-known` with deployment artifacts containing the real Apple Team ID and Play App Signing SHA-256 certificate fingerprint. Do not deploy the templates.
3. Serve the association files and fallback at `https://link.mosaiclynx.app` without redirects. Set HSTS, `Cache-Control: no-store` for fallback HTML, and the CSP/referrer headers represented by the static page.
4. Publish privacy and support URLs controlled by the release owner. The privacy disclosure must say that Relay ciphertext is retained for at most five minutes and that the app has no analytics SDK.
5. Complete TestFlight and Play closed testing on physical devices before production rollout. Verify Universal Links/App Links using the exact Store-signed applications.
6. Verify the privacy, support, and security-contact material in `docs/mobile-privacy.md` and `docs/mobile-support.md`, then publish it under owner-controlled HTTPS URLs used by both Store listings.

Production OTA updates are disabled. Every JavaScript or native change requires a new Store artifact, SBOM, test report, and artifact digest. Mainnet must remain disabled in the app configuration and release capability report.
