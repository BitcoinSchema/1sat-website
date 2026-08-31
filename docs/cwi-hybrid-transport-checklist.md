# CWI Hybrid Transport Checklist (No Feature Flags)

Date: 2026-02-06

## Scope decisions

- No feature flags. All changes are always-on.
- Embed transport remains default path.
- Redirect fallback is only for reliability failures, with special priority on mobile lifecycle/background-tab cases.
- No broad rollout/phased gating for this pre-release app.

## Security invariants

- Keep iframe -> parent `cwiState` signaling with `targetOrigin: "*"` (parent origin unknown at embed time).
- Never trust origin fields from payloads; derive origin from browser event (`MessageEvent.origin` / HTTP `Origin`).
- Route invocation responses only to stored `{source, origin}`.
- Redirect flow uses `state + nonce + PKCE + one-time code`.
- Never place wallet operation results in URL query parameters.

## Execution order (serial dependencies)

1. Harden current embed path first (relay lifecycle + session envelope + handshake reasons).
2. Add redirect fallback infra (schema + server endpoints + wallet authorize page).
3. Wire mobile-first fallback policy in transport negotiation contract.
4. Validate with unit/integration/security tests.

## File-by-file implementation checklist

### Track A — Embed hardening (start first)

#### `lib/cwi/types.ts`

- Add internal bridge/relay envelope types with:
  - `version: 2`
  - `sessionId: string`
- Keep compatibility for legacy v1 internal shapes during rollout.

#### `lib/cwi/relay.ts`

- Add relay lifecycle guard (`isStopped` / `isRunning`).
- Keep `waitForAuthentication` pending without a wall-clock cutoff while its
  session is alive.
- Cancel polling and settle pending work on session or relay lifecycle loss.
- Prevent `postMessage` when relay is stopped/channel closed.
- Add session scoping:
  - Track active session.
  - Ignore messages outside active session for grant/deny/status response handling.
- Maintain backwards compatibility for messages without `version/sessionId`.

#### `lib/cwi/bridge.ts`

- Generate per-iframe `sessionId`.
- Include `version: 2` + `sessionId` in forwarded channel messages.
- Add handshake state machine + reason codes:
  - `channel_unavailable`
  - `wallet_tab_unreachable`
  - `wallet_locked`
- Add bounded exponential backoff before declaring fallback recommended.
- Ignore channel responses not matching active `sessionId`.

#### `lib/hooks/use-cwi-bridge.ts`

- Expose handshake metadata from bridge:
  - `reason?: string`
  - `fallbackRecommended: boolean`
  - `transport: "embed"`

#### `app/(embed)/wallet/cwi/page.tsx`

- Expand posted `cwiState` payload:
  - `status`
  - `hasPermission`
  - `transport: "embed"`
  - `fallbackRecommended`
  - `reason?`

### Track B — Redirect fallback (begin after Track A schema/types are stable)

#### `convex/schema.ts`

- Add `cwiAuthRequests` table:
  - `requestId`, `origin`, `redirectUri`, `call`, `argsHash`, `state`, `nonce`,
  - `codeChallenge`, `codeChallengeMethod`, `status`, `expiresAt`, `createdAt`
- Add `cwiAuthCodes` table:
  - `codeId`, `requestId`, `origin`, `redirectUri`, `resultCiphertext`, `error`,
  - `consumedAt?`, `expiresAt`, `createdAt`
- Add indexes for `requestId`, `codeId`, and expiry scans.

#### `app/api/cwi/authorize/init/route.ts`

- Validate:
  - HTTP `Origin`
  - `redirect_uri` exact origin match
  - allowed method
  - args size limits
  - PKCE params
- Enforce HTTPS in production; allow localhost/127.0.0.1 in dev.
- Create auth request + return `authorizeUrl`.

#### `app/api/cwi/token/route.ts`

- Validate one-time code exists, TTL valid, not consumed.
- Validate PKCE verifier/challenge.
- Validate origin + redirect binding.
- Atomically mark code consumed.
- Return operation result or standardized error.

#### `app/(main)/wallet/cwi/authorize/page.tsx`

- Load request by `requestId`.
- Show requesting origin/method/permission details.
- Require unlocked wallet.
- On allow/deny/error:
  - persist terminal auth result as one-time code payload
  - redirect back with either:
    - success: `code`, `state`
    - error: `error`, `error_description`, `state`

### Track C — SDK contract (parallel repo note)

#### External: `@1sat/connect` (separate repository)

- Add transport abstraction:
  - `EmbedTransport`
  - `RedirectTransport`
  - `AutoTransport` (default)
- Negotiation:
  - try embed first with timeout
  - if handshake fails or fallback recommended, switch to redirect
  - use shorter timeout on iOS/Android UAs
- Add explicit transport events/errors for telemetry + app UX.

## Mobile reliability policy (always-on)

- Mobile UA starts with shorter embed handshake timeout.
- If wallet tab handshake is unreachable, redirect fallback is triggered immediately.
- Show "Continuing in Wallet" interstitial before redirect.
- Auto-return to callback on approve/deny.

## Tests (must pass before merge)

### Unit

- Relay lifecycle cleanup + no post-after-stop.
- Bridge session filtering + handshake transition reasons.
- PKCE/state/nonce validation helpers.

### Integration

- Desktop embed success (approve/deny).
- Mobile simulation with unreachable wallet tab -> redirect fallback.
- Locked wallet on authorize page -> unlock then continue.
- Redirect denial path.
- Replay, state mismatch, PKCE mismatch, and expiry rejection.

### Security

- Payload origin spoof ignored.
- Redirect URI origin mismatch rejected.
- Oversized args rejected.
- Unknown methods rejected consistently.

## Definition of done

- Interactive waits have no fixed timeout and remain visibly actionable.
- Transport/session loss settles pending calls with a structured numeric error.
- No post-stop relay console errors.
- One-time auth codes are single-use (replay blocked).
- Permission semantics are consistent across embed + redirect paths.
