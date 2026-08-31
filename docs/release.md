# Omega release gate

Current decision on 2026-08-30: **HOLD**. Local contracts and builds are useful
evidence, but they do not replace the open provider, hosted-wallet, mobile,
quality, domain, secret-isolation, preview, and production checks below.

This document is the release checklist, rollback runbook, and release-notes
template. [Deployment configuration](deployment.md) remains the source of truth
for Vercel targets, environment ownership, and response headers.

## Stop conditions

Do not merge or promote while any of these is true:

- an automated check is red or did not run against the candidate commit;
- a money flow can report a broadcast transaction as retry-safe failure;
- a provider mode presented as supported lacks real-browser evidence;
- Preview and Production/`omega` share CWI redirect secrets;
- `1satwallet.com` and `www.1satwallet.com` target different releases;
- a storage or Convex schema change lacks forward/backward compatibility and a
  restore rehearsal;
- mobile, accessibility, performance, hosted-CWI, or production smoke evidence
  is missing and the affected feature is still enabled;
- a blocked capability is described as available in UI or release notes.

The release owner may ship a deliberately smaller surface only when the
unfinished capability is actually hidden or rejected, the decision is named in
the release notes, and no money/security invariant is waived.

## Review path: modernization to omega

The only planned review path is `codex/1sat-wallet-modernization` → `omega`.
The workflow in `.github/workflows/verify.yml` runs for pull requests targeting
`omega` and again after a push to `omega`. Do not push directly to `omega` or
rewrite its history.

Before opening the PR, the release owner records the candidate SHA and proves
the branch contains the current remote `omega`:

```bash
git fetch origin
git switch codex/1sat-wallet-modernization
git status --short
git merge-base --is-ancestor origin/omega HEAD
git diff --stat origin/omega...HEAD
git rev-parse HEAD
shasum -a 256 bun.lock
```

`git status --short` must contain only reviewed candidate changes. A non-zero
merge-base check means the branch must be updated under the team's normal Git
policy before review. This runbook does not prescribe a force push, reset, or
history rewrite.

Open a GitHub PR with base `omega` and head
`codex/1sat-wallet-modernization`. Required review evidence:

- candidate SHA and `bun.lock` hash;
- green GitHub Verify run URL;
- exact local/preview commands and output summary;
- Linear issue/status table, including every enabled feature and blocker;
- provider/money-flow matrix with wallet, browser, viewport, and result;
- redacted preview URL and Vercel deployment ID;
- accessibility/performance evidence and contextualized Shadscan/React Doctor
  reports;
- storage/schema migration declaration, even when the answer is “none”;
- previous known-good deployment IDs and named rollback owner.

At least one reviewer must check money-safety, hosted-CWI, storage migration,
and the disabled-capability list rather than reviewing UI appearance alone.

## Automated candidate gate

Run from a clean checkout of the candidate with the pinned Bun version from CI:

```bash
bun install --frozen-lockfile
bun outdated
bun audit
bunx biome check .
bunx tsc --noEmit
bun test
bun scripts/check-routes.mjs
bun run build
```

Acceptance:

- frozen install does not change `bun.lock`;
- `bun outdated` is attached as an informational dependency-drift report;
- `bun audit` reports no unresolved vulnerability applicable to the shipped
  browser/server paths;
- lint, typecheck, every test, route integrity, and production build exit zero;
- the route table is reviewed for accidental additions or removals.

Quality tools are advisory detectors, not score-only acceptance gates. Pin the
audited versions and attach both raw output and a disposition for every new
confirmed error. Start the production build in a separate terminal before the
browser scan:

```bash
bun run start -p 8255
```

Then run in another terminal:

```bash
bunx @shadscan/cli@0.17.0 --check-ui http://localhost:8255 \
  --route / --route /wallet --route /download
bunx react-doctor@0.9.12 . --scope changed --base origin/omega \
  --include-untracked --no-score --blocking none
```

Do not fail or waive a release from a raw score alone. OPL-3986 records the
current reviewed baseline and detector caveats; OPL-4019 and OPL-4020 own the
remaining authenticated accessibility and production performance budgets.

## Preview acceptance matrix

Every checked row needs the exact preview deployment, wallet build/version,
browser or native host, account/identity, and redacted evidence. “Contract-only”
unit tests are not a pass for a real substrate.

### Provider modes

| Mode | Required preview evidence | Current blocker |
| --- | --- | --- |
| Built-in browser wallet | Create, import, unlock/lock, reconnect, identity isolation, sync, backup, delete, restore | OPL-3966 is In Review; OPL-4018 still blocks full multi-account Yours restore |
| 1Sat Wallet Desktop | Connect/disconnect/reconnect, origin display, identity change, full shared action suite | OPL-3981 and OPL-3983 |
| Yours/other injected wallet | Connect/disconnect/reconnect, winning-origin proof, identity change, full shared action suite | OPL-3981 and OPL-3983 |
| Native mobile WebView host | iOS/Android lifecycle, injected complete `WalletInterface`, background/foreground, navigation, shared action suite | OPL-3980 |
| Hosted CWI iframe | HTTPS parent, origin-isolated concurrent sessions, lock/consent/deny, all 28 methods, reload/close | OPL-3960 and urgent OPL-4005 |
| Hosted CWI redirect | Approve, deny, wrong origin, wrong PKCE, replay, expiry, reload, encrypted result isolation | OPL-3960, OPL-4005, and OPL-4022 |

OPL-3967 owns product-action parity. The installed connector reports successful
auto-detection only as generic `brc100`; release notes must not claim that the
website can identify the winning desktop, injected, or native substrate until
OPL-3981 ships that contract.

### Money and asset flows

Use low-value funded wallets created for release testing. Record transaction IDs
only in the restricted evidence location approved by the release owner.

- Built-in and each enabled external provider: exact P2PKH BSV send, denial,
  insufficient funds, ambiguous transport failure, success receipt, history,
  balance refresh, and receive rotation/ownership.
- Prove a failed UI state cannot be retried after a transaction may have
  broadcast. Paymail stays disabled under OPL-4014 and OPL-4015.
- Ordinals: send, burn confirmation, list, cancel, stale-output rejection, and
  post-action invalidation before claiming OPL-3969.
- BSV21, OpNS, inscriptions, marketplace, certificate, identity, lock, and MNEE
  actions are tested only if enabled; otherwise confirm their entry points are
  hidden or capability-gated and list them as unavailable.
- Verify action history exposes truthful BRC-100 pagination and BRC-153
  references without leaking provider payloads.
- Run built-in sync with MessageBox success and failure. The release notes must
  retain the acknowledgement/sweep observability limitation documented in
  `wallet-sync-observability.md` until the upstream action results expose it.

### Capability drift and infrastructure

- Capture `https://api.1sat.app/1sat/capabilities` for the preview timestamp.
- For every advertised capability, exercise only typed `@1sat/client` or
  `@1sat/actions` paths. For every absent capability, prove the UI disables the
  action without falling back to a legacy endpoint.
- Validate `api.1sat.app`, `wallet.1sat.app`, `messagebox.1sat.app`, and the
  target-specific Convex CWI store from the browser path that consumes them.
- Treat the public testnet host as unavailable until OPL-3992 is resolved.
- Confirm Preview has its own Convex deployment, deploy key, and
  `CWI_REDIRECT_SECRET`; do not print or download secret values into evidence.

### Storage and schema

- State whether the candidate changes IndexedDB/localStorage formats,
  `convex/schema.ts`, wallet-storage behavior, encryption, or import formats.
- Back up the pre-release built-in wallet, upgrade in place, lock/unlock, sync,
  reload, then restore the backup into a fresh profile.
- Exercise current and legacy backup fixtures plus wrong-password and failed
  persistence paths. Existing data must survive every failure.
- Convex schema changes must be additive/backward-compatible through the
  rollback window. Do not remove fields or old readers in the same release that
  introduces replacements.
- A UI/code rollback does not reverse a broadcast transaction, on-chain
  permission, IndexedDB migration, remote wallet-storage write, or Convex data
  mutation. Each requires its own recovery statement.

### Mobile, accessibility, performance, and diagnostics

- At minimum test 320×820 and 1440×1000 without horizontal overflow.
- Test keyboard-only navigation, visible focus, dialogs/sheets, destructive
  confirmations, contrast, touch targets, reduced motion, locked/funded/error
  states, external providers, and hosted consent.
- Capture route timings, transferred JavaScript, long tasks, layout shifts,
  memory, and WebGL contexts for `/`, `/wallet`, `/activity`, `/search`, and an
  asset detail route. Reduced-motion/mobile must not create the landing WebGL
  context.
- Trigger each recovery boundary and one provider/action failure. Evidence may
  include only fixed diagnostic codes and correlation IDs, never keys,
  addresses, request payloads, certificates, or decrypted values.

OPL-4019, OPL-4020, and the preview portion of OPL-3984 must be complete before
these rows can be checked.

## Promotion and production smoke

Before merge, record the current deployments without changing them:

```bash
vercel inspect https://1satwallet.com
vercel inspect https://www.1satwallet.com
vercel env ls --no-color
```

OPL-4023 must first align apex and `www` on the approved release or its
documented canonical redirect. OPL-4022 must split Preview and
Production/`omega` CWI secrets.

After approval, merge the reviewed PR into `omega` and let the configured
Vercel integration build that exact commit. Record the deployment ID and prove
it matches the merged SHA before changing or accepting aliases.

Run a production synthetic on both canonical hostnames:

- `/`, `/wallet`, `/docs`, `/robots.txt`, one transaction/asset read route, and
  the health/capability dependencies return the expected status and content;
- normal pages deny cross-origin framing; `/wallet/cwi` allows the approved
  HTTPS parent; CWI pages/APIs are `private, no-store`;
- a valid CWI preflight reflects the exact origin without credentials and an
  invalid origin is rejected;
- non-production deployment hosts remain `noindex, nofollow`;
- browser console/network contains no runtime, CSP, CORS, mixed-content, or
  hydration failure;
- run one approved low-value built-in send and one enabled external-provider
  action only when the release owner has authorized production fund movement.

Do not call a Vercel “Ready” state a smoke pass. Record the actual requests,
browser/viewport, timestamp, and result.

## Rollback runbook

Rollback is two operations: restore traffic first, then make Git history match.
Never force-push or reset `omega`.

### Before promotion

Record, in the release issue:

- candidate and previous known-good Git SHAs;
- candidate and previous known-good Vercel deployment IDs/URLs for every
  affected target;
- current apex and `www` alias targets;
- environment-variable and Convex schema versions, without values;
- whether the release writes a new local, remote, or on-chain format;
- rollback owner and a second reviewer.

### Restore traffic

Use the recorded previous deployment, never an ID copied from an old runbook:

```bash
vercel rollback <previous-known-good-deployment-id-or-url>
vercel rollback status 1sat-website
vercel inspect https://1satwallet.com
vercel inspect https://www.1satwallet.com
```

If the rollback operation does not restore both documented aliases, the
authorized operator explicitly restores each one and immediately reinspects it:

```bash
vercel alias set <previous-known-good-deployment-url> 1satwallet.com
vercel alias set <previous-known-good-deployment-url> www.1satwallet.com
```

These commands mutate production. They require release-owner authorization and
must first be rehearsed against a disposable/non-production alias. Preserve the
failed deployment, logs, correlation IDs, and request timestamps for diagnosis.

### Make Git durable

After traffic is safe, create a new `codex/` revert branch from current
`origin/omega`, revert the released change without rewriting history, rerun the
full gate, and open another reviewed PR to `omega`. Use the correct Git revert
form for the repository's actual merge strategy; do not guess merge parents in
an incident.

### Data caveats and verification

- Frontend rollback cannot undo transactions, permission tokens, remote sync,
  or wallet-storage writes. Reconcile them; never retry an ambiguous payment.
- A browser database migration must retain old-readable data until the rollback
  window closes. If it does not, stop promotion and provide an export/restore
  path first.
- Convex rollback restores neither schema nor records. Keep old fields/readers
  until both old and new deployments are safe.
- Secret rotation and deployment rollback can strand in-flight CWI results.
  Drain or let the five-minute request/code window expire, then test a fresh
  approve/deny exchange with the restored target.
- After rollback, rerun the production synthetic, confirm both aliases and the
  merged/reverted SHA, and post the result to the release issue.

The rollback gate remains unchecked until the Vercel and Git paths are actually
rehearsed in a non-production target under OPL-4026.

## Current disabled or uncertified capabilities

This list is a release-notes floor, not a backlog substitute:

- paymail and identity-key payments; exact pre-broadcast fee quote;
- persistent individual BRC-116 grants and immediate cached revocation under
  OPL-3993 and OPL-3994;
- production hosted iframe/redirect wallet under OPL-3960 and OPL-4005;
- native mobile WebView certification under OPL-3980;
- deterministic desktop/injected/native substrate identity and targeted
  reconnect under OPL-3981 and OPL-3983;
- public testnet under OPL-3992;
- full multi-account Yours restore under OPL-4018;
- unfinished ordinal, BSV21, OpNS, inscription/collection, marketplace, BAP,
  social, BSV lock, MNEE, certificate interoperability, and identity-discovery
  work tracked by OPL-3969 through OPL-3979;
- authenticated accessibility and production performance certification under
  OPL-4019 and OPL-4020.

## Linear evidence snapshot

Refresh statuses at release time. As of 2026-08-30:

- Done foundation: [OPL-3948](https://linear.app/openprotocollabs/issue/OPL-3948),
  [OPL-3949](https://linear.app/openprotocollabs/issue/OPL-3949),
  [OPL-3950](https://linear.app/openprotocollabs/issue/OPL-3950),
  [OPL-3951](https://linear.app/openprotocollabs/issue/OPL-3951),
  [OPL-3952](https://linear.app/openprotocollabs/issue/OPL-3952),
  [OPL-3962](https://linear.app/openprotocollabs/issue/OPL-3962), and
  [OPL-3964](https://linear.app/openprotocollabs/issue/OPL-3964).
- Local implementation in review:
  [OPL-3953](https://linear.app/openprotocollabs/issue/OPL-3953) through
  [OPL-3957](https://linear.app/openprotocollabs/issue/OPL-3957),
  [OPL-3959](https://linear.app/openprotocollabs/issue/OPL-3959),
  [OPL-3961](https://linear.app/openprotocollabs/issue/OPL-3961),
  [OPL-3965](https://linear.app/openprotocollabs/issue/OPL-3965),
  [OPL-3966](https://linear.app/openprotocollabs/issue/OPL-3966), and
  [OPL-3984](https://linear.app/openprotocollabs/issue/OPL-3984) through
  [OPL-3986](https://linear.app/openprotocollabs/issue/OPL-3986).
- Current release blockers include
  [OPL-3960](https://linear.app/openprotocollabs/issue/OPL-3960),
  [OPL-3980](https://linear.app/openprotocollabs/issue/OPL-3980),
  [OPL-3981](https://linear.app/openprotocollabs/issue/OPL-3981),
  [OPL-3983](https://linear.app/openprotocollabs/issue/OPL-3983),
  [OPL-4005](https://linear.app/openprotocollabs/issue/OPL-4005),
  [OPL-4019](https://linear.app/openprotocollabs/issue/OPL-4019),
  [OPL-4020](https://linear.app/openprotocollabs/issue/OPL-4020),
  [OPL-4022](https://linear.app/openprotocollabs/issue/OPL-4022), and
  [OPL-4023](https://linear.app/openprotocollabs/issue/OPL-4023), plus the
  rollback rehearsal [OPL-4026](https://linear.app/openprotocollabs/issue/OPL-4026).

“In Review” means local work awaits review or environment evidence; it does not
mean preview or production certified.

## Release notes template

Copy this section into the release record and replace every bracket. Delete
unused headings; never leave placeholders in published notes.

```markdown
# 1Sat Website — [release name]

- Released: [UTC timestamp]
- Git: [omega SHA and PR]
- Vercel: [environment and deployment ID]
- Canonical domain: [domain and redirect behavior]
- Rollback anchor: [previous Git SHA and deployment ID]

## User-visible changes

- [Change — Linear issue]

## Wallet/provider support verified in this release

| Mode | Wallet/host version | Browser/device | Evidence | Result |
| --- | --- | --- | --- | --- |
| Built-in | [version] | [browser/device] | [link] | [pass/disabled] |
| Desktop | [version] | [browser/device] | [link] | [pass/disabled] |
| Injected | [version] | [browser/device] | [link] | [pass/disabled] |
| Native WebView | [version] | [device] | [link] | [pass/disabled] |
| Hosted iframe/redirect | [version] | [browser/device] | [link] | [pass/disabled] |

## Money, data, and infrastructure

- Funded flows executed: [exact flows and restricted evidence]
- Capability manifest: [timestamp/hash and disabled modules]
- Storage/schema change: [none or migration and restore evidence]
- Environment change: [names/targets only; never values]

## Disabled, experimental, or blocked

- [Capability — reason — Linear issue]

## Quality and smoke evidence

- Verify CI: [URL]
- Preview: [deployment/evidence]
- Accessibility/performance: [evidence]
- Production synthetic: [timestamp/evidence]

## Known limitations

- [Limitation and safe user behavior]

## Rollback

- Owner: [name]
- Rehearsal: [timestamp/result]
- Traffic restore: [recorded deployment]
- Data caveat: [none or explicit recovery]
```
