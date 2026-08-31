# Certificate center

The certificate center at `/wallet/certificates` uses only the active BRC-100
`WalletInterface`. The same route is used for the built-in wallet and connected
wallets; it does not construct a second SDK client or bypass wallet permission
prompts.

## Supported operations

- `listCertificates` requests an unfiltered, paginated inventory. The UI shows
  certificate type, issuer, attached verifier, and field names. It deliberately
  does not render encrypted field values or any stored master keyring.
- `acquireCertificate` accepts canonical JSON arguments for either the `direct`
  or `issuance` acquisition protocol. The selected wallet performs BRC-100
  validation, issuer communication, signature checks, field encryption, and
  storage. Unsupported types and unavailable issuers remain explicit failures.
- `proveCertificate` requires a verifier identity key and an explicit set of
  fields. The disclosure preview names the verifier and fields before the wallet
  call. Export succeeds only when the returned verifier keyring exactly matches
  the selected fields; stored master keyrings are never exported.
- `relinquishCertificate` requires destructive confirmation. It removes the
  certificate from the selected wallet; it does not claim to revoke the
  issuer's revocation outpoint.

## Standards boundary

BRC-52 and the installed `@bsv/sdk` 2.4.2 `WalletInterface` are authoritative.
BRC-53 and BRC-56 are historical context and do not justify legacy
`createCertificate` or `findCertificates` calls. BRC-57, BRC-62, BRC-65, and
BRC-74 do not add certificate-center behavior.

This implementation does not claim that every browser, desktop, embedded, or
external provider supports certificate acquisition and disclosure. Provider
conformance and live issuer interoperability require separate fixtures and
manual cross-provider verification.
