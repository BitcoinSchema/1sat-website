# Wallet sync observability

The website owns synchronization only for its built-in wallet. External
BRC-100 providers own their address and MessageBox lifecycle; the website marks
all three tasks `provider-managed` and only refreshes the provider's exposed
wallet view.

For the built-in wallet, one single-flight run executes the installed
`@1sat/actions` address, payment inbox, and cosign-delivery actions. Each task
records its own completion time, exact returned `processed` and `failed` counts,
and thrown error. A non-zero `failed` result is a failed run, not a success.
Returning to a visible tab starts a fresh run; hidden tabs do not start work.
Disconnect and identity changes invalidate results, and teardown waits for any
non-abortable upstream action before destroying its wallet.

Payment and cosign actions queue acknowledgements only after successful
`internalizeAction` calls. Failed messages remain unacknowledged for a retry.

## Upstream gaps

The installed `@1sat/actions@0.0.200` does not expose acknowledgement failure in
either `dist/sync/syncMessages.js` or
`dist/sync/syncCosignDeliveries.js`: both catch and log a failed batch
`acknowledgeMessage`, then return the same `{ processed, failed }` result. The
website therefore reports `processed` as successfully internalized, not proven
acknowledged. The messages are not dropped, but the UI cannot distinguish a
completed acknowledgement from a retry that will re-read already-internalized
messages. The action result should add an acknowledgement count/error (and make
reprocessing idempotent) before the website can claim end-to-end delivery.

`syncAddresses` similarly catches and logs `sweepDeposit` failure without
returning or throwing it. Address ingestion counts remain exact, but the website
cannot report the sweep sub-step. The upstream result should expose that failure
instead of logging it only.
