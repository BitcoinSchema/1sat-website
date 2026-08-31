# Wallet backup and restore

The built-in wallet exports its authenticated AES-256-GCM local container. The
same password used to unlock the wallet opens the file. Decryption and WIF
validation finish before local storage is replaced; failed validation or
persistence restores the previous storage value. Existing unversioned AES-CBC
containers remain importable as legacy backups.

Supported key formats are detected explicitly:

- 1Sat web wallet v1 and its unversioned legacy container
- `bitcoin-backup` encrypted 1Sat/Yours key payloads (`.bep`)
- Yours Wallet keys-only ZIP/JSON schema v6 and legacy schema v1; ZIP manifest
  versions 1 and 2 are detected separately
- legacy plaintext 1Sat/Yours key JSON (import only; re-encrypted immediately)

Yours v6 AES-GCM and 2024 v1 AES-CBC compatibility is exercised with fixtures
generated outside this codebase. A Yours ZIP restores the selected account's
keys only. Wallet-toolbox history chunks are validated for completeness when a
manifest is present, but are not imported; history is rebuilt by wallet sync.
Identity-only Yours accounts are rejected because this website still requires
payment and ordinal legacy keys for its built-in key container.

Create/import/migrate/delete routes do not render while an external BRC-100
provider is selected. A built-in wallet must be backed up and removed before a
different wallet can be created or restored.
