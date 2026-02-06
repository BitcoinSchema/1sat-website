# CWI Redirect Contract

Date: 2026-02-06

This document describes the wallet-side redirect fallback contract for CWI.

## 1) Authorize Init

Endpoint: `POST /api/cwi/authorize/init`

Headers:
- `Origin` (required)

Body:
```json
{
  "call": "createSignature",
  "args": { "data": [1,2,3], "protocolID": [0, "tests"], "keyID": "1", "counterparty": "self" },
  "redirect_uri": "https://app.example.com/cwi/callback",
  "state": "opaque-client-state",
  "nonce": "opaque-client-nonce",
  "code_challenge": "BASE64URL_PKCE_CHALLENGE",
  "code_challenge_method": "S256"
}
```

Response:
```json
{
  "requestId": "...",
  "authorizeUrl": "https://wallet.example.com/wallet/cwi/authorize?requestId=...",
  "expiresAt": 1738840000000,
  "supportedMethods": ["..."]
}
```

Validation rules:
- `Origin` must be `https` in production.
- `http://localhost` and `http://127.0.0.1` are allowed in non-production.
- `redirect_uri` must be absolute URL with matching origin to `Origin`.
- `call` must be an allowed CWI method.
- PKCE challenge and method validated (`S256` or `plain`).
- Args payload limited to `MAX_CWI_ARGS_BYTES`.

## 2) Wallet Authorize UI

Page: `GET /wallet/cwi/authorize?requestId=...`

Behavior:
- Loads request details via `GET /api/cwi/authorize/request`.
- Requires unlocked wallet.
- On approve:
  - executes CWI method through `WalletPermissionsManager` (or direct wallet balance call)
  - stores one-time code artifact
  - redirects to callback with `code` + `state`
- On deny/error:
  - stores terminal request status
  - redirects to callback with OAuth-style error params

## 3) Callback Redirect Shape

Success:
- `?code=<one-time-code>&state=<state>`

Failure:
- `?error=<error>&error_description=<description>&state=<state>`

No operation result is returned in URL params.

## 4) Token Exchange

Endpoint: `POST /api/cwi/token`

Headers:
- `Origin` (required)

Body:
```json
{
  "code": "one-time-code",
  "code_verifier": "BASE64URL_PKCE_VERIFIER",
  "redirect_uri": "https://app.example.com/cwi/callback"
}
```

Success response:
```json
{
  "result": { "...": "wallet operation result" }
}
```

Error response:
```json
{
  "error": "invalid_grant",
  "error_description": "authorization_code_already_consumed"
}
```

Security checks:
- Code exists, not expired, not consumed.
- PKCE verifier matches stored challenge.
- `Origin` and `redirect_uri` match stored request binding.
- Code is single-use (replay rejected).

## 5) Convex Tables

`cwiAuthRequests`
- request lifecycle + PKCE + state/nonce + method metadata

`cwiAuthCodes`
- one-time code artifacts for token exchange

Both include expiry fields and index coverage for request/code lookup.

## 6) Local Harness

Run the local server and Convex backend, then execute:

```bash
npm run cwi:e2e:redirect
```

Optional environment overrides:
- `CWI_BASE_URL` (default: `http://localhost:8255`)
- `CWI_DAPP_ORIGIN` (default: `http://localhost:3333`)
- `CWI_REDIRECT_URI` (default: `http://localhost:3333/cwi/callback`)
- `CWI_APPROVE_CALL` (default: `getBalance`)
- `CWI_APPROVE_ARGS` (JSON string; default: `{}`)

The harness verifies:
- authorize init and request retrieval
- approval callback (`code` + `state`)
- token exchange success
- replay rejection for consumed code
- denial callback (`error` + `error_description` + `state`)
