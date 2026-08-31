# BSV send and receive

The wallet home sends a single P2PKH payment through the installed
`@1sat/actions` `sendBsv` action. The same `OneSatContext` path is used for the
built-in and external wallets; the UI does not import built-in keys, IndexedDB,
wallet storage, backup, or migration code.

Amounts remain decimal strings until validation. The parser combines whole and
fractional digits with `BigInt`, accepts at most eight decimals, and converts to
a JavaScript number only after proving the satoshi value is positive and no
larger than `Number.MAX_SAFE_INTEGER`.

The confirmation view shows the exact destination and amount. The installed
`sendBsv` action broadcasts immediately and returns no pre-broadcast fee quote.
The UI therefore labels fee as wallet-calculated and total as amount plus fee.
It does not create a speculative `noSend` transaction, which could reserve
funds and make cancellation stateful.

After success the UI displays the transaction ID and invalidates balance and
action-history queries. Validation failures, cancellation, wallet denial,
insufficient funds, and transport failures retain the recipient and amount.
Provider error payloads are not rendered.

Receive renders and copies the current derived P1SAT address. The built-in
wallet rotates its address after detecting an incoming payment. An external
wallet supplies the derivation and remains responsible for discovery and
rotation.

## Deliberate blockers

- Paymail remains disabled until OPL-4014 validates every resolved payment
  output before transaction creation and OPL-4015 represents broadcast success
  separately from P2P delivery failure.
- Identity-key destinations remain disabled because the installed SDK/actions
  expose no identity-to-payment-output resolution contract.
- An exact pre-broadcast fee and total remain unavailable until the standard
  payment action exposes a provider-neutral quote/prepare contract.
- Real built-in and external browser execution remains required before
  OPL-3963 can be marked Done.
