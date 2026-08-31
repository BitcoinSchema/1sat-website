# Activity, explorer, and search

These product paths use only the installed typed 1Sat Stack clients:

- Activity calls `MarketClient.searchListings` with active status and score
  pagination. Market results are typed indexed outputs and ORDFS content is
  resolved only through `stackContentUrl`.
- Outpoint search calls `TxoClient.get` and links to `/outpoint/[outpoint]`.
- Transaction search calls `TxoClient.getByTxid` and links to the real
  `/tx/[txid]` explorer, whose outputs link to existing outpoint pages.
- Name search calls `OpnsClient.getOrigin` and active
  `MarketClient.searchListings` prefix search in parallel.
- The existing outpoint explorer gates TXO history, Market listing state, and
  ORDFS preview independently instead of treating missing capabilities as
  missing content.

Search checks the live `/1sat/capabilities` manifest before each operation.
Missing TXO, Market, OpNS, or ORDFS support produces an explicit disabled state
instead of a fallback endpoint. Listing pagination uses the installed client's
numeric score cursor.

The live mainnet manifest currently advertises `pubsub`, but
`@1sat/client@0.0.50` has no typed PubSub client. Live activity subscriptions
therefore remain disabled; the UI says so and continues with indexed
pagination. Add streaming only after a maintained typed client is published.

No route uses the deleted mock activity feed, `/api/market`, or `/api/autofill`.
No explorer/search module reads WalletInterface state, built-in keys, IndexedDB,
wallet storage, backup, or migration helpers.

Local contract tests cover classification, canonical routes, 404/error/empty
states, capability gating, score pagination, visible activity failures, loading
surfaces, and the canonical ORDFS helper. Real browser navigation, live PubSub,
and production-stack result quality remain certification work before OPL-3968
is Done.
