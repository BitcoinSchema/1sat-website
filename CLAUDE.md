# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

1Sat is a Next.js marketplace for Bitcoin SV 1Sat Ordinals and tokens. Provides wallet management, token trading, NFT collections, and inscription services.

## Development Commands

```bash
bun run dev      # Start development server (uses Turbopack)
bun run build    # Build for production
bun run start    # Start production server
bun run lint     # Run ESLint
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 with App Router + Turbopack + React Compiler
- **State Management**: Preact Signals v3 (`@preact/signals-react`)
- **Data Fetching**: TanStack Query with custom `httpClient` wrapper
- **Styling**: TailwindCSS v4 + ShadCN/UI + ThemeToken
- **Bitcoin**: `@bsv/sdk` and `js-1sat-ord`

### Key Directories
- `src/app/` - App Router pages and API routes
- `src/components/` - Organized as `pages/`, `modal/`, `ui/`
- `src/signals/` - Preact Signals state (wallet signals in `wallet/`)
- `src/utils/` - Utilities including `httpClient.ts` for API calls
- `src/types/` - TypeScript definitions (`ordinals.ts`, `bsv20.ts`, `common.ts`)
- `src/constants.ts` - API endpoints, protocol prefixes, fee rates

### Wallet Architecture
- HD wallets with BIP39 mnemonics
- Three key types: `payPk` (payments), `ordPk` (ordinals), `identityPk` (identity)
- Encrypted storage with passphrase
- All wallet state via signals: `src/signals/wallet/index.tsx`

### Asset Types (from `src/constants.ts`)
- `AssetType.Ordinals` - NFT inscriptions
- `AssetType.BSV20` - Fungible tokens (tick-based)
- `AssetType.BSV21` - Enhanced tokens (id-based)
- `AssetType.LRC20` - Alternative protocol

### API Endpoints (from `src/constants.ts`)
```typescript
ORDFS = "https://ordfs.network"           // File storage
API_HOST = "https://ordinals.gorillapool.io"  // Ordinals indexer
MARKET_API_HOST = "https://api.1sat.market"   // Market API
```

### Protocol Prefixes (from `src/constants.ts`)
- `MAP_PREFIX` - Magic Attribute Protocol
- `B_PREFIX` - B:// file protocol
- `BAP_PREFIX` - Bitcoin Attestation Protocol
- `AIP_PREFIX` - Author Identity Protocol

### Important Patterns

1. **Signals State**: Import from `@/signals/wallet`:
   ```typescript
   import { payPk, ordPk, utxos, bsv20Balances } from '@/signals/wallet';
   ```

2. **HTTP Client**: Use `customFetch` from `@/utils/httpClient` for API calls with automatic caching and error handling.

3. **Path Alias**: `@/*` maps to `./src/*`

4. **Sanitization**: Use `isomorphic-dompurify` for user content (SVG, HTML).

5. **Fee Rate**: Use `SATS_PER_KB` or `SATS_PER_BYTE` from constants (not deprecated `feeRate`).

### Security
- User content (SVG, HTML) must be sanitized with DOMPurify
- Wallet keys encrypted before storage
- Scam prevention via `SCAM_LISTING_USER_BLACKLIST` and `SCAM_ITEM_BLACKLIST` in constants
- CSP configured for images in `next.config.mjs`

### Notes
- Production app handling real cryptocurrency - be extremely careful with wallet operations
- Uses real blockchain data, never mock data
- React Compiler enabled for automatic memoization
- View transitions enabled experimentally

## ShadCN/UI + ThemeToken Migration

This codebase uses ShadCN/UI with ThemeToken support. When modifying components:

1. **Check shadcn.md files**: Each folder has a `shadcn.md` with migration status
2. **Use semantic colors**: Never use hardcoded hex colors - use `bg-card`, `text-muted-foreground`, etc.
3. **Use ShadCN components**: Import from `@/components/ui/` (Button, Dialog, Tabs, etc.)
4. **CSS Variables**: Theme colors defined in `globals.css` using OKLCH format
5. **ThemeToken**: Runtime theming via `useThemeToken` hook from `@theme-token/sdk/react`

### Base Theme
The midnight-aurora ThemeToken is installed as the base theme:
- Origin: `85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf_0`
- Primary: Gold/yellow (`oklch(0.7686 0.1647 70.0804)`)

### Component Imports
```typescript
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
```

### Color Mapping (DaisyUI to ShadCN)
| Hardcoded | Semantic Replacement |
|-----------|---------------------|
| `bg-[#111]` | `bg-card` |
| `bg-[#222]` | `bg-secondary` or `bg-muted` |
| `text-[#aaa]` | `text-card-foreground` |
| `text-[#555]` | `text-muted-foreground` |
| `bg-base-100` | `bg-background` |
| `border-base-200` | `border-border` |

### DaisyUI to ShadCN Component Mapping
| DaisyUI | ShadCN |
|---------|--------|
| `modal`, `modal-box` | `<Dialog>`, `<DialogContent>` |
| `btn`, `btn-primary` | `<Button>` |
| `btn-ghost` | `<Button variant="ghost">` |
| `btn-error` | `<Button variant="destructive">` |
| `tabs`, `tab` | `<Tabs>`, `<TabsTrigger>` |
| `dropdown` | `<DropdownMenu>` |
| `tooltip` | `<Tooltip>` |
| `divider` | `<Separator>` |
| `input`, `input-bordered` | `<Input>` |

### ThemeToken Hook Usage
```typescript
import { useThemeToken } from "@theme-token/sdk/react";

// Pass user's ordinals to detect ThemeToken ordinals
const { themeTokens, activeOrigin, loadTheme, resetTheme, isLoading } = useThemeToken(ordinals);

// Load a theme by origin
await loadTheme("85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf_0");

// Reset to default theme
resetTheme();
```