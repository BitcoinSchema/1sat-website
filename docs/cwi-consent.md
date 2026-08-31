# Hosted CWI consent

The hosted consent surface uses the `GroupedPermissions`,
`CounterpartyPermissions`, and `PermissionRequest` types exported by the
installed official wallet toolbox.

- BRC-73 grouped requests are parsed before display. Privileged entries,
  unsafe numeric values, reserved baskets, malformed verifier/counterparty
  keys, duplicate certificate fields, and invalid Level 2 scopes cannot be
  approved.
- Every grouped item is independently selectable. Protocol, basket, and
  certificate grants can expire after 30 days or remain until revoked.
- Spending prompts show the structured total and all wallet-provided line
  items, including the fee. The user must choose one-time or a standing monthly
  authorization. A standing amount must exactly equal the pending request.
- PACT prompts accept only Level 2 protocols and show both the full application
  origin and full counterparty public key.
- `/manifest.json` declares schema version 1 and no app permissions because the
  website currently requires no grouped permission declaration of its own.

The website does not treat this UI as proof that the full BRC-116 lifecycle is
production-ready. OPL-3993 must make persistent individual grants settle only
after token creation, OPL-3994 must invalidate revoked permission caches
immediately, and OPL-4005 must replace the observable same-origin channel token
with a trust-anchored encrypted hosted transport. External provider and funded
monthly-rollover certification also remain required.
