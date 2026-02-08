# @1sat/connect Error Codes Reference

All error classes extend `OneSatError` which has a numeric `code` property.

## Error Table

| Error Class | Code | When | Recovery |
|---|---|---|---|
| `UserRejectedError` | 4001 | User clicked Reject or closed popup intentionally | Silent — no toast needed, user chose this |
| `WalletLockedError` | 4002 | Wallet exists but passphrase-locked | Inform user to unlock wallet first |
| `WalletNotConnectedError` | 4003 | Called method before `connect()` | Call `connect()` first |
| `InsufficientFundsError` | 4004 | Not enough BSV for operation | Show balance info, suggest funding |
| `PopupBlockedError` | 4006 | `window.open()` returned null | Toast: "Allow popups for this site" |
| `PopupClosedError` | 4007 | Popup closed unexpectedly (not via reject) | Silent — treat like user cancel |
| `TimeoutError` | 4008 | 5-minute timeout exceeded | Suggest trying again |
| `TransportUnavailableError` | 4010 | CWI transport failed | Fall back to popup flow |
| `FallbackRequiredError` | 4011 | Embed transport requires redirect | SDK handles automatically |
| `AuthorizationTimeoutError` | 4012 | CWI authorization timed out | Retry |
| `StateMismatchError` | 4013 | OAuth state mismatch | Security error, restart flow |
| `CodeReplayError` | 4014 | Authorization code already used | Restart flow |

## Error Handling Patterns

### Silent Dismissals (No Toast)

These are intentional user actions:
- `PopupClosedError` — user closed the window
- `UserRejectedError` — user clicked Reject

### User Guidance (Toast with Instructions)

These need user action:
- `PopupBlockedError` — browser setting needs to change
- `WalletLockedError` — user needs to unlock wallet
- `InsufficientFundsError` — user needs to add funds

### Retry Suggestions

These are transient:
- `TimeoutError` — suggest trying again
- `TransportUnavailableError` — suggest trying again
- `AuthorizationTimeoutError` — suggest trying again

### Error Detection Pattern

```typescript
import { fromErrorResponse, OneSatError } from '@1sat/connect'

// The SDK's fromErrorResponse() converts numeric codes to typed errors
// This is used internally but also exported for custom handling:

const error = fromErrorResponse({ code: 4006, message: 'blocked' })
// error instanceof PopupBlockedError === true
```

## Common Pitfalls

### Origin Mismatch

`https://1satwallet.com` redirects to `https://www.1satwallet.com`. The `event.origin` in
postMessage will be `https://www.1satwallet.com`. Always configure `popupUrl` with the `www`
prefix, or use the default which already includes it (as of v0.0.6).

### Second Popup Blocked

Browsers allow only one `window.open()` per user gesture. The `await` in `connect()` breaks
the gesture chain, so a subsequent `signMessage()` popup will be blocked. Solution: use the
`challenge` parameter on `connect()` to sign in the same popup (v0.0.6+).

### Stale Connection State

`provider.isConnected()` checks localStorage. If the user clears browser data or the wallet
resets, the SDK may report connected but the wallet won't recognize the session. Always wrap
operations in try/catch and handle `WalletNotConnectedError`.
