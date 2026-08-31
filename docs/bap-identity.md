# BAP identity center

`/wallet/identity` uses the active provider-neutral `OneSatContext`. It never
reads built-in wallet storage, private keys, or seed material.

## Supported paths

- Wallet-local BAP state is read with `resolveBapId` and `getProfile`.
- Profile creation and edits use `updateProfile`; identity-only publication uses
  `publishIdentity`; rotation uses `rotateIdentity`.
- Every transaction presents an explicit review before requesting wallet
  authorization. Profile fields are a fixed, validated schema and are public
  on-chain.
- Attestations accept an exact `urn:bap:id:attribute:value:nonce` claim and a
  subject BAP identity key. The UI derives and shows the attribute hash,
  `bap:attest:<attribute-hash>:<subject>` (matching the live `bsv-bap`
  `MasterID.getAttestation` reference), and the final SHA-256 value sent
  to the canonical `attest` action. The plaintext claim is not logged or kept in
  the success state.
- Public discovery uses the typed `BapClient.searchIdentities` route only when
  the live capability manifest advertises `bap`. Results are defensively
  normalized and omit contact and unknown fields.

BAP index discovery is not WalletInterface certificate discovery. The latter is
available separately at `/wallet/certificates`.

## Honest certification boundary

Automated tests cover validation, protocol hashing, redaction, and safe error
mapping. No funded profile, rotation, or attestation transaction was executed.
No live index convergence, browser extension, mobile embedding, or external
provider flow is certified by these tests.

Known upstream boundaries are tracked in Linear: the installed `getProfile`
action may relinquish duplicate outputs despite being a read, installed identity
actions log caught errors, and `BapClient.listProfiles` does not match the shape
observed from the live endpoint. The website therefore avoids `listProfiles` and
does not claim that wallet-local success is already indexed.
