# Provider action matrix

`lib/wallet/provider-capabilities.ts` is the maintained product matrix. Its
states mean:

- `supported`: locally implemented and exercised without a browser substrate.
- `contract-only`: product code uses only `WalletInterface`, but the real
  browser substrate has not been certified.
- `provider-managed`: the external wallet owns the state; the website must not
  read or synthesize built-in state.
- `uncertified`: code exists but the product deliberately disables the flow.
- `experimental`: local hosted relay contracts pass, but the transport is not
  production-approved.
- `unsupported`: the product hides or rejects the flow.

| Product flow | Built-in direct | Desktop HTTP | Injected / Yours | Native WebView | Hosted embed | Hosted redirect |
| --- | --- | --- | --- | --- | --- | --- |
| 28-method BRC-100 interface | supported | contract-only | contract-only | contract-only | experimental | experimental |
| Balance summary | supported | provider-managed | provider-managed | provider-managed | experimental | experimental |
| Action history | supported | contract-only | contract-only | contract-only | experimental | experimental |
| Send BSV | supported | contract-only | contract-only | contract-only | experimental | experimental |
| Receive address | supported | uncertified | uncertified | uncertified | experimental | experimental |
| Asset read/write | supported | contract-only | contract-only | contract-only | experimental | experimental |
| Identity | supported | contract-only | contract-only | contract-only | experimental | experimental |
| Permission administration | supported | provider-managed | provider-managed | provider-managed | provider-managed | provider-managed |
| Sync | supported | provider-managed | provider-managed | provider-managed | provider-managed | provider-managed |
| Local keys, backup, migration | supported | unsupported | unsupported | unsupported | unsupported | unsupported |

The installed `@1sat/connect@0.0.89` returns `provider: string` and identifies
every successful auto-detected `WalletClient("auto")` substrate as `brc100`.
It therefore cannot distinguish desktop HTTP, injected/XDM, and React Native
after the race, cannot target one of them for reconnect, and cannot prove that
losing probes were cancelled. `EmbedTransport` and `RedirectTransport` appear
in installed declaration files but are not exported from the package index.
The website must not infer a more specific substrate than the installed API
reports.

Static contracts cover the actual product action modules and the external
connector branch. They reject imports or reads of built-in wallet keys,
IndexedDB, wallet storage, backup, and migration helpers. Identity change and
disconnect contracts also pin query, address, identity, and sync invalidation.

## Certification dependencies

- OPL-3954: winning-substrate identity, targeted reconnect, losing-probe
  cancellation, and lifecycle browser coverage.
- OPL-3953 and OPL-3955: funded and multi-origin adapter execution for all 28
  standard methods.
- OPL-3980: native WebView origin, lifecycle, and shared action-suite evidence.
- OPL-3981: published auto/embed/redirect exports and browser provider matrix.
- OPL-3983: injected and desktop origin/lifecycle hardening.

No row marked `contract-only`, `uncertified`, or `experimental` is browser
certification evidence. `connect`, `pay`, and `getBalance` are not BRC-100
methods and are not included in the 28-method row.
