# Inscriptions and collection minting

The `/inscribe` route is built on the installed `@1sat/actions` `0.0.200`
contracts. It uses the provider's canonical `oneSatContext`, so built-in and
external BRC-100 providers execute the same action path. The route does not
read wallet keys, IndexedDB, local wallet storage, migration data, or a
provider-specific injection object.

The former BSV21 deploy tab was removed from this route. Canonical BSV21
deployment and asset surfaces are owned by OPL-3972 rather than the inscription
flow.

## Supported actions

| Product mode | Action | Content boundary | Identity behavior |
| --- | --- | --- | --- |
| File or UTF-8 text | `inscribe` | Single transaction through exactly 50 MiB; optional OrdFS streaming uses 1 MiB chunks and has no action-defined total limit | BAP/Sigma signing is optional and requires wallet approval; it cannot be combined with streaming |
| Collection | `mintCollection` | Exactly 50 MiB maximum; the installed action does not stream | The action always creates a Sigma-sealed collection output |
| Collection item | `mintCollectionItem` | Exactly 50 MiB maximum; the installed action does not stream | The action always creates a Sigma-sealed item output linked to a canonical `txid_vout` parent |

Text size is calculated with `TextEncoder`, so the number displayed in review
is the UTF-8 byte count that is encoded. File size comes from the browser's
`File.size`. The UI accepts both `txid.vout` and `txid_vout` at its boundary and
normalizes collection IDs to `txid_vout` before calling the action.

The optional permission-module switch passes the current
`usePermissionModule` field. For collection actions it also passes the
deprecated `useModule` alias because the installed `0.0.200` Sigma path still
reads that field. This compatibility bridge can be removed when the installed
runtime consumes `usePermissionModule` for collections.

## Review and recovery

Draft data is retained when the user goes back, declines a wallet request, or
an action fails. The visible states are edit, review, wallet/broadcast pending,
success, and recoverable error. Stream failures can return `partialTxids`; the
UI explains that those incomplete no-send chunks were not batch-broadcast and
does not represent them as completed inscriptions.

Every inscription action creates a one-satoshi inscription output. The current
actions do **not** expose a fee quote or total before execution. Review therefore
does not estimate either value; it says that the connected wallet calculates
the fee and must request final approval.

## Indexing

A returned transaction ID means the action accepted the broadcast. It is not
treated as proof that an indexer has processed the output. When the live stack
manifest advertises `ordfs`, the route checks the typed
`services.ordfs.getMetadata` client:

- HTTP 404 is shown as indexing pending.
- A returned metadata record is shown as confirmed and enables the canonical
  ORDFS content link.
- A service/network error is distinct from pending and can be retried.
- Missing ORDFS capability disables only the indexing check and content link;
  it does not disable minting or hide the broadcast result.

## Remaining certification and action gaps

- No funded mainnet/testnet mint was run in this work. Wallet approval,
  broadcast, Sigma sealing, and fee presentation still require a funded test
  matrix for each provider mode.
- No browser media-preview, permission-denial, delayed-indexing, or page-reload
  recovery pass was run yet.
- The typed actions do not expose a quote or an indexing subscription, so this
  route cannot show an exact pre-confirmation fee or push-driven confirmation.
- The current UI covers the required collection name/description/quantity and
  item parent/mint/rank fields. The action-only optional traits, rarity,
  royalties, and attachment JSON are not yet exposed as a maintained form.
- The live stack capability probe advertised `ordfs` on 2026-08-30, but that is
  not a guarantee of indexing latency or availability for a future mint.

Keep OPL-3971 In Progress until funded provider/browser/indexer certification
and the optional collection metadata UX are completed.
