# Runtime diagnostics

Wallet diagnostics are explicit structured events in `lib/runtime-diagnostics.ts`.
They use fixed public messages, generated correlation IDs, and an allowlist of
non-secret context fields. Arbitrary errors and payloads are never accepted by
the reporter. Route-segment and root-layout error boundaries show a recovery
control and the same ID written to the safe diagnostic event.

The browser keeps the latest 100 events in memory. Reloading or pressing Clear
deletes them; there is no remote telemetry sink yet. Route error boundaries,
provider lifecycle changes, and diagnostics-page recovery actions emit the
three supported categories: `route`, `provider`, and `action`.

Never add error objects, stack traces, keys, mnemonics, authentication payloads,
permission capabilities, certificates, or decrypted values to this channel.
Add a new fixed diagnostic code and a narrowly allowlisted scalar field only
when an operator cannot diagnose a real failure with the existing events.

Preview tracing remains unverified until a preview deployment exists.
