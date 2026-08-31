# BRC-100 implementation and gap analysis

Updated: 2026-08-30

## References

- Canonical BRC-100 specification: `~/code/BRCs/wallet/0100.md`
- Related standards: BRC-137 onboarding, BRC-147 1Sat basket, BRC-153 action references, BRC-164 output IDs, and BRC-219 prompt liveness
- TypeScript reference: `~/code/ts-stack/packages/wallet/wallet-toolbox`
- Go reference: `~/code/go-wallet-toolbox`
- Current 1Sat SDK: `~/code/1sat-sdk`
- Current native implementation: `~/code/1sat-wallet-mobile`

## Verified dependency baseline

- The website imports `@bsv/wallet-toolbox-client` 2.10.4 directly with
  `@bsv/sdk` 2.4.2, satisfying the official package's `^2.4.1` SDK peer range.
- The official 2.10.4 package contains the same BRC-153 reference-label codec
  and `listActions` response annotation as the interim
  `@bopen-io/wallet-toolbox-client` 2.6.2-brc153.5 package. References still
  round-trip between BRC-100 base64 and the required lowercase
  `reference <hex>` label, and forged/stale reserved labels are replaced.
- Published `@1sat/client` 0.0.50 still installs the interim package as a
  nested dependency, while `@1sat/wallet` 0.0.104 and
  `@1sat/wallet-browser` 0.0.90 still declare it as a peer. This does not block
  the website's direct use of the official package, but those manifests need
  an upstream release before the interim package disappears from the full
  dependency graph.

The standard defines 28 wallet methods. A compatible transport must carry the
method arguments and results without replacing BRC-100 with a smaller,
application-specific RPC vocabulary.

| Method group | BRC-100 methods | Website status |
| --- | --- | --- |
| Actions | `createAction`, `signAction`, `abortAction`, `listActions`, `internalizeAction` | Exposed by the built-in CWI relay and accepted from external `WalletInterface` providers |
| Outputs | `listOutputs`, `relinquishOutput` | Exposed by both modes; current first-party UI covers BSV, ordinals, BSV21, and OpNS, with additional asset flows still listed below |
| Keys | `getPublicKey`, `revealCounterpartyKeyLinkage`, `revealSpecificKeyLinkage` | Exposed by both modes; built-in mode applies `WalletPermissionsManager` prompts |
| Crypto | `encrypt`, `decrypt`, `createHmac`, `verifyHmac`, `createSignature`, `verifySignature` | Exposed by both modes; no bespoke replacements |
| Certificates | `acquireCertificate`, `listCertificates`, `proveCertificate`, `relinquishCertificate` | Transport and first-party certificate center are locally complete; issuer and real-provider interoperability remain uncertified |
| Discovery | `discoverByIdentityKey`, `discoverByAttributes` | Transport complete; first-party identity discovery UI is missing |
| Authentication | `isAuthenticated`, `waitForAuthentication` | Used by `@1sat/connect` and its monitored wallet session |
| Chain and version | `getHeight`, `getHeaderForHeight`, `getNetwork`, `getVersion` | Exposed by both modes |

## Connection modes

| User mode | Transport | Permission owner | Status |
| --- | --- | --- | --- |
| 1Sat Wallet Desktop | `@1sat/connect` -> `WalletClient("auto")` localhost detection | Desktop wallet | Local contract complete; real desktop lifecycle and action certification remain |
| Yours or another injected wallet | `@1sat/connect` -> injected CWI detection | Injected wallet | Local contract complete; real injected lifecycle and action certification remain |
| Embedded mobile wallet/browser | `@1sat/connect` -> injected/XDM/React Native detection | Mobile host | Website contract complete; the host must inject and certify a complete `WalletInterface` |
| Built-in browser wallet | `@1sat/wallet-browser` plus `WalletPermissionsManager` | This website | Local implementation complete; funded browser and backup/restore certification remain |
| Other websites use the built-in wallet | Hidden `/wallet/cwi` iframe, `postMessage`, BroadcastChannel relay, and redirect fallback | This website | All 28 methods and local isolation/liveness contracts pass; trust-anchored encrypted hosted transport remains urgent |

The first three rows deliberately use one standard connection entry point. The
site does not guess which wallet is installed or bind application logic to a
vendor-specific global.

## Important mobile distinction

The native `1sat-wallet-mobile` checkout is not currently a complete BRC-100
session host. Its `SessionWire.Method` supports `connect` and `pay`, while the
design documents call out the missing BRC-100 action layer. The website can run
inside a mobile host today only when that host injects a complete BRC-100
`WalletInterface`. A successful one-shot native payment handoff must not be
reported as full BRC-100 compatibility.

## Remaining product and upstream gaps

The website now has provider-neutral BSV send/receive, ordinal actions and
marketplace, inscriptions/collections, BSV21 detail/send/fixed-supply deploy
and guarded purchase, OpNS ownership/discovery/market actions, BAP identity
management, certificates, activity/search, backup/restore, and sync
observability. The remaining work is intentionally withheld where the current
typed SDK or live certification is insufficient:

1. BSV21 registry browse needs typed `Bsv21Client.listTokens`; authority minting
   remains disabled until action fee counting, genesis-authority discovery, and
   stale/spent listing validation are corrected upstream.
2. OpNS direct claim needs a recovery-safe typed acquisition payload; public
   profiles need a typed resolver. The website does not invent either endpoint
   or transaction shape.
3. BAP profile reads must become side-effect free, the live `listProfiles`
   response must match its exported type, and dependency-owned action logging
   must be removed.
4. Ordinal multi-input actions need to preserve every required BEEF part, and
   all pre-broadcast product actions need a provider-neutral fee-quote contract.
5. BSV lock/unlock management and MNEE balance/history/send remain unimplemented.
6. Certificate issuance and built-in/desktop/injected/embedded interoperability
   require real issuer and browser certification.
7. Provider selection, identity changes, all 28 methods, BRC-219 prompts, funded
   product actions, and index convergence require real desktop/mobile/injected
   browser fixtures.
8. Hosted CWI still needs trust-anchored encryption for capability delivery and
   messages before cross-site wallet use can ship.
9. Paymail stays disabled until output validation is safe and broadcast success
   is separated from P2P delivery failure.
10. Production release remains on hold for apex/`www` deployment convergence,
    environment-secret separation, rollback rehearsal, accessibility, and
    measured performance budgets.

## 1Sat infrastructure mapping

The public stack advertises unified TXO, ordinals/ORDFS, BSV21, market, OpNS,
BAP, transaction broadcast, chaintracks, paymail, and SSE endpoints at
`api.1sat.app`. `wallet.1sat.app` is the BRC-100 storage host;
`messagebox.1sat.app` handles encrypted delivery; `sigma.1sat.app` and
`bsv21.1sat.app` expose specialized overlays. The website should access these
through `@1sat/client` and `@1sat/actions`, not handwritten legacy endpoint
shapes.

As of `@1sat/client` 0.0.50, `OneSatServices.getCapabilities()` requests the
obsolete root `/capabilities` path. The website contains a narrow service
subclass that targets `/1sat/capabilities` until the SDK correction ships.
