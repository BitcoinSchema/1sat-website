# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

1Sat is a Next.js-based marketplace for Bitcoin SV Ordinals and tokens. It provides wallet management, token trading, NFT collections, and inscription services.

## Development Commands

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run start    # Start production server
bun run lint     # Run ESLint
bun update       # Update all dependencies
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **State Management**: Preact Signals v3 for reactive wallet state
- **Data Fetching**: TanStack Query
- **Styling**: TailwindCSS + DaisyUI (luxury theme)
- **Bitcoin Integration**: @bsv/sdk and js-1sat-ord

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable components (pages/, modal/, ui/)
- `src/signals/` - Reactive state management using Preact Signals
- `src/utils/` - Utility functions for crypto, formatting, etc.
- `src/types/` - TypeScript type definitions

### Core Concepts

#### Wallet System
- Uses HD wallets with BIP39 mnemonics
- Separate keys: `payPk` (payments) and `ordPk` (ordinals)
- Encrypted storage with user passphrase
- State managed via signals in `src/signals/wallet/`

#### Supported Asset Types
- **Ordinals**: NFT-like inscriptions
- **BSV20**: Fungible tokens
- **BSV21**: Enhanced token standard  
- **LRC20**: Alternative token protocol

#### API Integrations
- **Ordinals Indexer**: https://ordinals.gorillapool.io
- **1Sat API**: https://1sat-api-production.up.railway.app
- **WhatsOnChain**: For blockchain data
- **ORDFS**: For file storage

### Environment Variables

Required in `.env.local`:
```
UPLOADTHING_SECRET=<your-key>
UPLOADTHING_APP_ID=<your-app-id>
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434  # Optional, for AI features
```

### Important Patterns

1. **Component Imports**: Always check existing components before creating new ones. UI components are in `src/components/ui/`.

2. **State Management**: Use signals from `src/signals/` for wallet-related state. Example:
   ```typescript
   import { payPk, ordPk, utxos } from '@/signals/wallet';
   ```

3. **API Calls**: Use TanStack Query hooks for data fetching. Check `src/hooks/` for existing query hooks.

4. **Type Safety**: All data structures have TypeScript types in `src/types/`. Use them consistently.

5. **Path Aliases**: Use `@/*` which maps to `./src/*`

### Security Considerations

- Content Security Policy configured in `src/middleware.ts`
- All user content (SVG, HTML) must be sanitized using DOMPurify
- Wallet keys are encrypted before storage
- Check blacklist for scam prevention (`src/utils/blacklist.ts`)

### Common Development Tasks

When working with:
- **Wallet features**: Check `src/signals/wallet/` and `src/utils/wallet/`
- **Token operations**: See `src/utils/tokens/` and corresponding API routes
- **UI components**: Use existing components from `src/components/ui/` and DaisyUI
- **Blockchain data**: Use existing API hooks rather than direct calls

### Notes

- This is a production application handling real cryptocurrency - be extremely careful with wallet operations
- The codebase uses real blockchain data, never mock data
- Image optimization is handled by Next.js Image component and Sharp
- AI features integrate with OpenAI and Ollama when configured