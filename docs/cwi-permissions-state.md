# CWI Permissions -- Current State (Aug 30, 2026)

Reference doc for researchers. Covers the CWI iframe bridge permission model, E2E test results, and known behaviors.

## Architecture

```
dApp page (localhost:3333)
  |
  | postMessage (CWI protocol)
  v
CWI iframe (localhost:8255/wallet/cwi)
  |
  | BroadcastChannel "1sat-cwi"
  v
Wallet tab (localhost:8255) -- CWIRelay -> WalletPermissionsManager
```

- **CWIBridge** (`lib/cwi/bridge.ts`): runs in iframe, translates postMessage <-> BroadcastChannel
- **CWIRelay** (`lib/cwi/relay.ts`): runs in wallet tab, dispatches to WPM, handles grant/deny
- **WalletPermissionsManager** (WPM, from `@bsv/wallet-toolbox-client`): wraps the wallet with permission enforcement

The relay and redirect fallback accept exactly the 28 BRC-100 methods from the
public `@bsv/sdk/wallet/substrates/WalletWireCalls` registry. Vendor extensions
such as `getBalance` are rejected with unsupported-method code 2. Balance UI
uses the provider-neutral `listOutputs` wallet method and its standard wallet
balance basket instead.

## Permission Config (wallet-toolbox-provider.tsx)

These flags control which operations trigger permission prompts for external originators. Admin originator (the wallet's own UI) bypasses all checks.

Other config flags:
- `encryptWalletMetadata: true` -- metadata encryption (internal)
- `seekGroupedPermission: true` -- manifest-declared permissions can be approved in one canonical grouped flow
- `differentiatePrivilegedOperations: true` -- privileged vs standard operations get separate permission tokens

### Enabled (will prompt on first use)

| Flag | Methods affected |
|------|-----------------|
| `seekProtocolPermissionsForSigning` | `createSignature`, `verifySignature` |
| `seekProtocolPermissionsForEncrypting` | `encrypt`, `decrypt` |
| `seekProtocolPermissionsForHMAC` | `createHmac`, `verifyHmac` |
| `seekPermissionsForKeyLinkageRevelation` | `revealCounterpartyKeyLinkage`, `revealSpecificKeyLinkage` |
| `seekPermissionsForIdentityKeyRevelation` | `getPublicKey({identityKey: true})` |
| `seekPermissionsForIdentityResolution` | `discoverByIdentityKey`, `discoverByAttributes` |
| `seekBasketInsertionPermissions` | `createAction` (with basket output), `internalizeAction` |
| `seekBasketRemovalPermissions` | `relinquishOutput` |
| `seekCertificateDisclosurePermissions` | `proveCertificate` |
| `seekCertificateAcquisitionPermissions` | `acquireCertificate` |
| `seekCertificateRelinquishmentPermissions` | `relinquishCertificate` |
| `seekSpendingPermissions` | `createAction` (when netSpent > 0) |

### Disabled (no prompt)

| Flag | Methods affected |
|------|-----------------|
| `seekPermissionsForPublicKeyRevelation` | `getPublicKey({identityKey: false})` |
| `seekBasketListingPermissions` | `listOutputs` |
| `seekPermissionWhenApplyingActionLabels` | `createAction` with labels |
| `seekPermissionWhenListingActionsByLabel` | `listActions` with label filter |
| `seekCertificateListingPermissions` | `listCertificates` |

### Never require permission (regardless of config)

| Method | Why |
|--------|-----|
| `isAuthenticated` | Auth query -- exempt in relay.ts |
| `waitForAuthentication` | Auth query -- exempt in relay.ts |
| `getHeight` | Read-only chain info |
| `getHeaderForHeight` | Read-only chain info |
| `getNetwork` | Read-only chain info |
| `getVersion` | Read-only chain info |
| `abortAction` | Cleanup, no permission needed |
| `listActions` (no label filter) | Read-only when no label filter |

## Permission Authority

BRC-116 defines four permission categories: protocol (DPACP), spending (DSAP),
basket (DBAP), and certificate (DCAP). Scope always includes the normalized
originator and the category-specific fields defined by the standard.

Authorization comes only from:

1. valid, unspent, unexpired permission tokens returned by WPM's canonical
   token paths; or
2. an explicit ephemeral grant for the request currently in flight.

WPM may cache canonical lookups as an optimization, but cache state is not a
second authority. The website does not read or mutate WPM private caches and
does not persist browser-local permission grants. A failed mint, including an
insufficient-funds failure, never creates a durable fallback grant.

Reactive individual spending approval is sent as `ephemeral: true`, so it
authorizes only that spend. A standing monthly DSAP limit is created only from
an explicitly approved grouped permission declaration.

## Permission Grant Flow

```
1. dApp calls method (e.g. encrypt)
2. CWIRelay dispatches to WPM
3. WPM evaluates canonical permission-token state
4. If no valid grant found:
   a. WPM fires onProtocolPermissionRequested callback
   b. Relay sends cwi-permission-request over BroadcastChannel
   c. Bridge forwards to iframe UI (PermissionCard component)
   d. Iframe expands to full-screen overlay (postMessage cwiState)
   e. User clicks Allow or Deny
   f. Bridge sends cwi-permission-grant / cwi-permission-deny
   g. Relay calls wallet.grantPermission() or wallet.denyPermission()
   h. A persistent grant creates or renews its canonical token; failure rejects
      without a website fallback
   i. An individual spending grant is explicitly ephemeral for this request
   j. Iframe collapses (cwiState.hasPermission = false)
5. WPM resolves the pending method call with result or error
```

## Revocation and upstream dependency

The Connected Apps page lists only WPM permission tokens and revokes them via
`WalletPermissionsManager.revokePermission`. It reloads the wallet page after a
successful revoke so a new manager instance cannot retain the spent token in a
private cache.

Two upstream fixes are required before this flow is fully BRC-116 conformant:

- [OPL-3993](https://linear.app/openprotocollabs/issue/OPL-3993) tracks making
  individual persistent grants settle only after their canonical token has
  been created or renewed successfully.
- [OPL-3994](https://linear.app/openprotocollabs/issue/OPL-3994) tracks immediate
  invalidation of affected WPM caches after revocation.

The reload is a temporary workaround for OPL-3994. Remove it only after the
installed WPM invalidates revoked grants internally.

## BRC-219 prompt liveness (relay.ts)

`waitForAuthentication` and `isAuthenticated` are exempt from the locked-wallet check in `handleCWIRequest`. These two methods need to work regardless of wallet state since they exist to query/wait for authentication.

When WPM is null (not yet initialized):
- `isAuthenticated` -> returns `{authenticated: false}` immediately
- `waitForAuthentication` -> waits for `getWallet()` without a wall-clock cutoff

Authentication and permission-dependent calls remain pending while their CWI
session and elected wallet-tab leader are alive. Grant or deny settles the
original call. Session close, relay stop, bridge destruction, or leader loss
settles pending bridge work with numeric lifecycle error code `1`; handshake
and leader-reachability deadlines remain separate transport checks.

Installed upstream packages still impose interactive request deadlines and
must be fixed at their sources (the website does not patch `node_modules`):

- `@1sat/wallet@0.0.104` `createWebCWI` applies a fixed 120-second timer to
  every request, including `waitForAuthentication` and permission prompts.
- `@1sat/wallet@0.0.104` `createSigmaCWI` applies the same 120-second timer and
  merely restarts it while interactive UI is visible.
- `@1sat/connect@0.0.89` bundles both transports unchanged, so its URL-based
  provider path inherits those fixed interactive cutoffs.

## Iframe Overlay Behavior (cwi/page.tsx)

The CWI page renders transparent when idle -- only shows UI when `activePermission` is set. It posts state to the parent frame:

```js
{ type: 'CWI', cwiState: { status, hasPermission: boolean } }
```

The test page (or any host dApp) uses this to toggle iframe visibility:
- `hasPermission: true` -> expand iframe to full-screen, enable pointer-events
- `hasPermission: false` -> collapse iframe to 0x0, disable pointer-events

## E2E Test Results (Feb 6, 2026)

### All passing

| Method | Args | Result | Permission? |
|--------|------|--------|------------|
| `waitForAuthentication` | `{}` | `{"authenticated":true}` | No |
| `isAuthenticated` | `{}` | `{"authenticated":true}` | No |
| `getNetwork` | `{}` | `{"network":"mainnet"}` | No |
| `getVersion` | `{}` | `{"version":"wallet-brc100-1.0.0"}` | No |
| `getHeight` | `{}` | `{"height":935157}` | No |
| `getPublicKey` (non-identity) | `{identityKey:false, forSelf:true, protocolID:[0,'tests'], keyID:'1', counterparty:'self'}` | ERROR: "Protocol names must be 5 characters or more" with `'test'`; fixed to `'tests'` (not re-tested after fix) | No (config disabled) |
| `listOutputs` | `{basket:'todo tokens', include:'locking scripts'}` | `{"totalOutputs":0,"outputs":[]}` | No (config disabled) |
| `getPublicKey` (identity) | `{identityKey:true, forSelf:true}` | `{"publicKey":"03908c..."}` | Yes -- prompted, allowed |
| `encrypt` | `{plaintext:[...], protocolID:[0,'tests'], keyID:'1', counterparty:'self'}` | `{"ciphertext":[207,78,...]}` | No (cached from identity grant) |
| `createSignature` | `{data:[...], protocolID:[0,'tests'], keyID:'1', counterparty:'self'}` | `{"signature":[48,69,...]}` | No (cached) |
| `createHmac` | `{data:[...], protocolID:[0,'tests'], keyID:'1', counterparty:'self'}` | `{"hmac":[151,23,...]}` | No (cached) |
| `bogusMethod` | `{}` | ERROR: "Unknown method: bogusMethod" (code 2) | N/A |

### Known test arg issues

| Method | Issue | Fix |
|--------|-------|-----|
| `getPublicKey` (non-identity) | Protocol name `'test'` was too short (5-char min) | Changed to `'tests'` |
| `listOutputs` with `{basket:'default'}` | "default" basket is admin-only | Changed to `'todo tokens'` |

## Not Yet Tested

- `getPublicKey` (non-identity) with fixed args (`'tests'`) -- was tested with `'test'` (4 chars) which hit a 5-char minimum validation error; args fixed but not re-tested after fix
- `decrypt` -- needs ciphertext from encrypt result
- `verifySignature` -- needs signature from createSignature result
- `verifyHmac` -- needs hmac from createHmac result
- `createAction` -- needs valid transaction construction
- `signAction` / `abortAction` -- needs action in progress
- `listActions` -- should work without permission
- `acquireCertificate` / `listCertificates` / `proveCertificate` / `relinquishCertificate` -- cert infrastructure
- `revealCounterpartyKeyLinkage` / `revealSpecificKeyLinkage` -- key linkage
- `discoverByIdentityKey` / `discoverByAttributes` -- identity resolution
- `internalizeAction` / `relinquishOutput` -- basket mutation
- Permission denial flow (clicking Deny)
- Multiple concurrent permission requests (queue behavior)
- Cold-start race condition (reload both tabs, immediate waitForAuth)
- Cross-session permission persistence (grant, close tabs, reopen)

## Key Files

| File | Purpose |
|------|---------|
| `lib/cwi/relay.ts` | CWIRelay -- wallet tab side, dispatches to WPM |
| `lib/cwi/bridge.ts` | CWIBridge -- iframe side, postMessage <-> BroadcastChannel |
| `lib/hooks/use-cwi-bridge.ts` | React hook for iframe page |
| `lib/hooks/use-cwi-relay.ts` | React hook for wallet tab |
| `app/(embed)/wallet/cwi/page.tsx` | CWI iframe page component |
| `app/(main)/cwi-relay-provider.tsx` | Mounts relay in wallet tab |
| `providers/wallet-toolbox-provider.tsx` | WPM creation + permission config (lines 37-54) |
| `test-cwi.html` | E2E test page |
