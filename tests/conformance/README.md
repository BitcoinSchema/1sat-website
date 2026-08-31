# WalletInterface conformance boundary

This directory distinguishes executable conformance evidence from live work
that cannot run deterministically in repository CI.

## Executable here

- All action/output arguments run through the validators exported by the
  installed `@bsv/sdk`.
- The same corpus runs through a direct `WalletInterface` adapter and the
  website's real `CWIRelay` transport, checking arguments, originator, binary
  values, results, and invalid/denied/error shapes.
- BRC-112 normalization and aggregation, BRC-114 time labels, and BRC-153
  reference labels execute against the installed official wallet-toolbox.
- BRC-164 uses the SDK's ordinary case-folded output tags; no special RPC or
  asset-identity semantics are invented.
- The remaining 21 methods in the installed SDK registry run through one typed
  public request/result vector each, using both the direct adapter and the
  website's real `CWIRelay`.
- The installed `ProtoWallet` executes deterministic BRC-2 encryption, BRC-3
  signatures, BRC-42 counterparty derivation, BRC-56 HMAC, BRC-69 linkage,
  BRC-72 decryption, BRC-94 Schnorr proof verification, and the BRC-97
  proof-type-0 no-proof marker. Certificate and discovery requests use the
  installed SDK validators where public validators exist.

`getBalance`, `connect`, and `pay` are not BRC-100 `WalletInterface` methods.
They are excluded from every method and pass count.

## Remaining-method pass matrix

Each `pass` below is one executable method-adapter vector. Thus the remaining
interface contributes **21 methods × 2 adapters = 42 transport passes**. The
seven action/output methods are covered separately in
`wallet-actions.test.ts`.

| Method | Direct | Real `CWIRelay` | Additional executable evidence |
| --- | --- | --- | --- |
| `getPublicKey` | pass | pass | Identity-key retrieval plus installed BRC-42 counterparty-derived key agreement |
| `revealCounterpartyKeyLinkage` | pass | pass | BRC-72 decryption to the expected BRC-69 shared secret and BRC-94 Schnorr proof verification |
| `revealSpecificKeyLinkage` | pass | pass | BRC-72 decryption to the expected BRC-69 HMAC and BRC-97 proof-type-0 no-proof marker |
| `encrypt` | pass | pass | Installed BRC-2 round trip, binary edge bytes |
| `decrypt` | pass | pass | Installed BRC-2 round trip, privileged request shape |
| `createHmac` | pass | pass | Installed BRC-56 create/verify pair |
| `verifyHmac` | pass | pass | Installed BRC-56 create/verify pair |
| `createSignature` | pass | pass | Installed BRC-3 counterparty signature |
| `verifySignature` | pass | pass | Installed BRC-3 counterparty verification |
| `acquireCertificate` | pass | pass | BRC-52 direct-acquisition shape and SDK validator |
| `listCertificates` | pass | pass | BRC-52 filters, paging, keyring, SDK validator |
| `proveCertificate` | pass | pass | BRC-52/53 selective field shape and SDK validator |
| `relinquishCertificate` | pass | pass | BRC-52 identity tuple and SDK validator |
| `discoverByIdentityKey` | pass | pass | BRC-52 identity result and SDK validator |
| `discoverByAttributes` | pass | pass | BRC-52 attribute query and SDK validator |
| `isAuthenticated` | pass | pass | Public result fidelity |
| `waitForAuthentication` | pass | pass | Public result fidelity |
| `getHeight` | pass | pass | Public result fidelity |
| `getHeaderForHeight` | pass | pass | 80-byte header hex and SDK integer validator |
| `getNetwork` | pass | pass | Public result fidelity |
| `getVersion` | pass | pass | Public result fidelity |

The corpus distributes BRC-43 security levels `0`, `1`, and `2`, explicit
counterparties, privileged reasons, exact origin forwarding, byte values at
`0` and `255`, BRC-69/72/94/97 linkage fields, and BRC-52
certificate/keyring shapes. Every public-key fixture parses as a real
secp256k1 point. Validator, permission-denied, and unexpected failures are
checked through both adapters with numeric error-code fidelity.

BRC-53 is recorded only as the historical certificate creation/revelation
lineage. Current certificate behavior and pass claims follow BRC-100 and the
authoritative BRC-52 certificate primitives.

## Blocked live adapters

| Adapter or behavior | Why it is not a CI conformance claim |
| --- | --- |
| Built-in funded action lifecycle | Requires a browser IndexedDB wallet, keys, funds, permission interaction, and network services. |
| Desktop localhost wallet | Requires a running user wallet and cannot be a deterministic repository fixture. |
| Yours/injected wallet | Requires the extension and user approval in an interactive browser profile. |
| Embedded mobile wallet | The host must inject a complete BRC-100 `WalletInterface`; the current native one-shot payment session is not that interface. |
| `inputBEEF` spend validity and broadcast results | The corpus proves public request and transport fidelity only; cryptographic transaction validity and miner responses belong to wallet-toolbox/live integration suites. |
| Permission prompt approval/denial | The relay test proves thrown wallet denial is transported faithfully; it does not simulate the `WalletPermissionsManager` UI or permission-token lifecycle. |
| Browser multi-origin isolation | Repository tests exercise the relay protocol in process, not independent browser origins or browser-enforced channel boundaries. |
| Hosted-wallet Playwright flow | There is no deterministic browser fixture that provisions a wallet, completes permission UI, and controls multiple top-level origins. |
| Certificate acquisition/issuance network flow | Public BRC-52 shapes and SDK validators execute, but a live certifier, signature validation, encrypted field keyrings, and revocation UTXO checks require an integration fixture. |
| Chain services (`getHeight`, `getHeaderForHeight`) | Transport and public result shapes execute; no network result is claimed without a controlled chain-service adapter. |

Live coverage should be added only when a reproducible funded sandbox or
provider-owned test adapter exists. Until then, treating these rows as passing
would be fake conformance.
