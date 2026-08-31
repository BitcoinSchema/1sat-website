# 1Sat Website

The web wallet, asset explorer, and marketplace served at
[1satwallet.com](https://1satwallet.com). The production site tracks the
`omega` branch.

The app can use a BRC-100 wallet supplied by 1Sat Wallet Desktop, an injected
wallet such as Yours, or an embedded mobile host. It also includes its own web
wallet and exposes that wallet to other websites through the CWI bridge.

## Getting started

Install dependencies, configure the environment, and start the development
server:

```bash
bun install
cp .env.example .env.local
bun run dev
```

Open [http://localhost:8255](http://localhost:8255).

Before submitting changes, run:

```bash
bun run lint
bunx tsc --noEmit
bun run build
```

## Architecture

- `@1sat/connect` discovers and monitors external BRC-100 wallets.
- `@1sat/wallet-browser` supplies the built-in browser wallet.
- `@1sat/actions` implements 1Sat asset and payment operations over a standard
  BRC-100 `WalletInterface`.
- `@1sat/client` connects the UI to the public services at `api.1sat.app`.
- `wallet.1sat.app` stores and synchronizes the built-in BRC-100 wallet.

See [docs/BRC100_GAP_ANALYSIS.md](docs/BRC100_GAP_ANALYSIS.md) for the standards
comparison, supported connection modes, and remaining product work.

## Deployment

The deployment target, environment ownership, and security headers are defined
in [docs/deployment.md](docs/deployment.md). The review path, release gate,
rollback runbook, and release-notes template live in
[docs/release.md](docs/release.md). Do not promote a build until that gate is
green.
