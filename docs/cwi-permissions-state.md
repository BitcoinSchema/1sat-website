# CWI Permissions -- Current State (Feb 6, 2026)

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
- **WalletPermissionsManager** (WPM, from `@bsv/wallet-toolbox`): wraps the wallet with permission enforcement

## Permission Config (wallet-toolbox-provider.tsx)

These flags control which operations trigger permission prompts for external originators. Admin originator (the wallet's own UI) bypasses all checks.

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
| `getBalance` | Handled directly by relay, not WPM |
| `abortAction` | Cleanup, no permission needed |
| `listActions` (no label filter) | Read-only when no label filter |

## Permission Types

Four categories, each with its own cache key format:

| Type | Cache key format | Scope |
|------|-----------------|-------|
| `protocol` | `proto:{origin}:{privileged}:{level},{name}:{counterparty}` | Per protocol+counterparty+originator |
| `basket` | `basket:{origin}:{basket_name}` | Per basket+originator |
| `certificate` | `cert:{origin}:{privileged}:{verifier}:{certType}:{fields}` | Per cert type+fields+originator |
| `spending` | `spend:{origin}:{satoshis}` | Per amount+originator |

Originator is normalized: lowercased, default ports stripped (80/443).

## Permission Caching -- Why Some Calls Don't Re-prompt

The WPM uses a multi-tier cache. Once granted, the same operation won't prompt again within the cache window:

1. **recentGrants** (15 second TTL, non-spending only) -- Immediate post-grant window
2. **permissionCache** (5 minute TTL, in-memory) -- Avoids repeated on-chain lookups
3. **On-chain PushDrop tokens** -- Permanent until revoked
4. **IndexedDB local permissions** -- Fallback when on-chain creation fails (no funds)

### Cache key determines deduplication

Two calls share a grant if they produce the same cache key. For protocol permissions, the key includes `protocolID` + `counterparty` + `originator`. So:

- `encrypt({protocolID: [0, 'tests'], counterparty: 'self'})` and `createSignature({protocolID: [0, 'tests'], counterparty: 'self'})` share the SAME protocol permission grant (same protocol + counterparty).
- `getPublicKey({identityKey: true})` triggers its own permission (identity key revelation is a separate permission type internally, though it's also a protocol permission with a specific protocolID).

### Observed behavior in E2E testing

1. `getPublicKey({identityKey: true})` -- **Prompted**. First protocol permission for this originator.
2. `encrypt({protocolID: [0, 'tests'], counterparty: 'self'})` -- **Auto-granted**. Same protocol+counterparty was already granted by step 1 (identity key revelation uses the same underlying protocol permission scope).
3. `createSignature({...same args})` -- **Auto-granted**. Cached.
4. `createHmac({...same args})` -- **Auto-granted**. Cached.

**To trigger separate prompts for each**, use different `protocolID` or `counterparty` values.

## Permission Grant Flow

```
1. dApp calls method (e.g. encrypt)
2. CWIRelay dispatches to WPM
3. WPM checks cache hierarchy (recent -> memory -> on-chain -> local)
4. If no valid grant found:
   a. WPM fires onProtocolPermissionRequested callback
   b. Relay sends cwi-permission-request over BroadcastChannel
   c. Bridge forwards to iframe UI (PermissionCard component)
   d. Iframe expands to full-screen overlay (postMessage cwiState)
   e. User clicks Allow or Deny
   f. Bridge sends cwi-permission-grant / cwi-permission-deny
   g. Relay calls wallet.grantPermission() or wallet.denyPermission()
   h. If grant fails (no funds), fallback: hydrate cache + persist to IndexedDB
   i. Iframe collapses (cwiState.hasPermission = false)
5. WPM resolves the pending method call with result or error
```

## Race Condition Fix (relay.ts)

`waitForAuthentication` and `isAuthenticated` are exempt from the locked-wallet check in `handleCWIRequest`. These two methods need to work regardless of wallet state since they exist to query/wait for authentication.

When WPM is null (not yet initialized):
- `isAuthenticated` -> returns `{authenticated: false}` immediately
- `waitForAuthentication` -> polls `getWallet()` every 500ms (30s timeout)

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
| `getBalance` | `{}` | `{"satoshis":0,"usd":0}` | No |
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
| `lib/cwi/permission-keys.ts` | Cache key building + originator normalization |
| `lib/cwi/permission-store.ts` | IndexedDB local permission persistence |
| `lib/hooks/use-cwi-bridge.ts` | React hook for iframe page |
| `lib/hooks/use-cwi-relay.ts` | React hook for wallet tab |
| `app/(embed)/wallet/cwi/page.tsx` | CWI iframe page component |
| `app/(main)/cwi-relay-provider.tsx` | Mounts relay in wallet tab |
| `providers/wallet-toolbox-provider.tsx` | WPM creation + permission config (lines 37-54) |
| `test-cwi.html` | E2E test page |
