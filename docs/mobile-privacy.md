# MosaicLynx Testnet mobile privacy notice

MosaicLynx Testnet stores profiles, public account identities, settings, and password-encrypted Vault envelopes on the device. It does not collect balances, transaction history, contacts, advertising identifiers, or analytics.

When a user starts a signing request, the Web SDK and app exchange end-to-end encrypted request and response envelopes through `relay.mosaiclynx.app`. Relay credentials are held only in memory. The Relay cannot decrypt the transaction and deletes session data after acknowledgement, cancellation, or a maximum five-minute expiry.

The app does not broadcast signed transactions. The requesting dApp decides whether to submit the returned payload. Testnet request origins are displayed as unverified.

Encrypted profile backups are created only on explicit request, use a fresh salt and nonce, and are handed to the operating-system share sheet. MosaicLynx does not upload backup files.

Security reports should be sent through the independently published contact listed at the official `mosaiclynx.app` support page. Do not include mnemonics, private keys, passwords, Relay links, or full transaction payloads in a report.
