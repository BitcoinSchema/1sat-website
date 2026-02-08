---
name: 1Sat Wallet Integration
description: >-
  This skill should be used when the user asks to "integrate 1Sat Wallet",
  "add wallet connection", "connect 1sat", "handle popup errors",
  "challenge signing", "BSM verification", "wallet popup blocked",
  or needs guidance on integrating www.1satwallet.com as a wallet provider
  in a dApp using @1sat/connect.
---

# 1Sat Wallet Integration Guide

This skill provides guidance for integrating the 1Sat Wallet (www.1satwallet.com) into dApps using the `@1sat/connect` SDK. The 1Sat Wallet uses a popup-based flow for wallet interactions — the dApp opens a popup to www.1satwallet.com where the user approves operations.

## Core Concepts

### Popup-Based Architecture

The 1Sat Wallet uses `window.open()` to launch a popup to `https://www.1satwallet.com/connect`. Communication happens via `window.postMessage()` between the dApp and the popup. The SDK manages the full lifecycle: opening the popup, sending requests, receiving responses, and handling timeouts/closures.

**Critical**: The popup URL origin is `https://www.1satwallet.com` (with `www`). The domain `1satwallet.com` 307-redirects to `www.1satwallet.com`, which changes the `event.origin` in postMessage. Always use the `www` variant.

### Single-Popup Connect + Sign (v0.0.6+)

Browsers only allow one `window.open()` per user gesture. If `connect()` awaits a popup response, a subsequent `signMessage()` call opens a second popup which gets blocked. To solve this, pass a `challenge` string to `connect()` — the wallet signs it with BSM in the same popup interaction.

```typescript
const timestamp = new Date().toISOString()
const challenge = `/api/wallet/connect|${timestamp}`

// Single popup: connect + sign
const result = await wallet.connect({ challenge })

// result.signedMessage contains { message, signature, address }
```

If no `challenge` is provided, `connect()` behaves exactly as before — fully backward compatible.

## Integration Workflow

### 1. Install and Create Provider

```typescript
import { createOneSat } from '@1sat/connect'

const wallet = createOneSat({
  appName: 'My dApp',
  // popupUrl defaults to https://www.1satwallet.com
})
```

### 2. Connect with Challenge (Recommended)

```typescript
const timestamp = new Date().toISOString()
const requestPath = '/api/wallet/connect'
const message = `${requestPath}|${timestamp}`

const result = await wallet.connect({ challenge: message })

if (result.signedMessage) {
  // Recover pubkey from BSM signature on the server
  // Construct authToken: `${pubkey}|bsm|${timestamp}|${path}|${signature}`
  await fetch('/api/wallet/connect', {
    method: 'POST',
    body: JSON.stringify({
      authToken: `${recoveredPubKey}|bsm|${timestamp}|${requestPath}|${result.signedMessage.signature}`,
      provider: '1sat',
    }),
  })
}
```

### 3. Error Handling (Required)

Import typed error classes and handle each case appropriately:

```typescript
import {
  PopupBlockedError,
  PopupClosedError,
  UserRejectedError,
  TimeoutError,
  WalletLockedError,
} from '@1sat/connect'

try {
  const result = await wallet.connect({ challenge })
} catch (error) {
  if (error instanceof PopupClosedError || error instanceof UserRejectedError) {
    // User intentionally cancelled — no toast needed
    return
  }

  if (error instanceof PopupBlockedError) {
    // Show toast: "Your browser blocked the popup. Allow popups and try again."
    return
  }

  if (error instanceof WalletLockedError) {
    // Wallet exists but is locked — user needs to unlock in wallet
    return
  }

  if (error instanceof TimeoutError) {
    // 5-minute timeout — user walked away
    return
  }

  // Generic fallback
  showError(error.message || 'Connection failed')
}
```

**Key principle**: `PopupClosedError` and `UserRejectedError` are intentional user actions — handle them silently. `PopupBlockedError` requires user guidance. All other errors should show feedback.

## React Integration Pattern

For React apps, wrap the provider in a context to avoid re-creating instances:

```typescript
// Provider context with lazy initialization
const connect = useCallback(async (params?: ConnectParams) => {
  let provider = ensureProvider()
  if (!provider) {
    const { createOneSat } = await import('@1sat/connect')
    provider = createOneSat({ appName: 'My dApp' })
  }
  return provider.connect(params)
}, [])
```

Use TanStack Query mutations for connect operations to get loading states and error handling:

```typescript
const connectMutation = useMutation({
  mutationFn: async () => {
    const result = await wallet.connect({ challenge })
    // ... verify signature, POST to server
  },
  onSuccess: () => toast.success('Wallet connected'),
  onError: (error) => {
    if (error instanceof PopupBlockedError) {
      toast.error('Popup blocked', { description: 'Allow popups and try again.' })
    }
  },
})
```

## Wallet-Side Popup Implementation

The connect popup page at `/connect` on 1satwallet.com:

1. Parses `requestId`, `origin`, `appName`, and `params` from URL search params
2. Shows approval UI with app name and origin
3. On approve: gets wallet addresses, optionally signs challenge with BSM
4. Calls `sendResponse(requestId, result, origin)` which does `window.opener.postMessage()`
5. Closes the popup

When `params.challenge` is present, the popup signs it using BSM before sending the response:

```typescript
const { BSM, PrivateKey, Utils } = await import('@bsv/sdk')
const privKey = PrivateKey.fromWif(walletKeys.ordPk)
const msgBytes = Utils.toArray(challenge, 'utf8')
const signature = BSM.sign(msgBytes, privKey) as string
```

## Additional Resources

### Reference Files

- **`references/error-codes.md`** — Complete error code table and recovery strategies
- **Live docs**: `https://www.1satwallet.com/docs` — Full SDK reference with interactive examples

### Key Files in This Repo

- `app/(main)/connect/page.tsx` — Wallet popup connect page (handles challenge signing)
- `app/(main)/sign-message/page.tsx` — Wallet popup sign message page
- `app/(main)/sign/page.tsx` — Wallet popup sign transaction page
- `app/(main)/docs/page.tsx` — Developer documentation page
