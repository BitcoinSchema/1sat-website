# DaisyUI to ShadCN/UI Migration + ThemeToken Support

## Overview

Full migration from DaisyUI to ShadCN/UI to enable ThemeToken ordinal detection and runtime theming. Work on new branch `feature/shadcn-themetoken`.

## Theme Strategy

### Base Theme Installation
Install the **midnight-aurora** ThemeToken directly via ShadCN CLI:
```bash
bunx shadcn@latest add https://themetoken.dev/r/themes/85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf_0
```

This inscribes the theme CSS variables into `globals.css` automatically.

**Theme Origin:** `85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf_0`

### Runtime ThemeToken Support
Install `@theme-token/sdk` for detecting and applying ThemeToken ordinals:
```bash
bun add @theme-token/sdk
```

Key SDK functions:
- `fetchThemeByOrigin(origin)` - Fetch theme from blockchain
- `applyThemeMode(theme, mode)` - Apply light/dark mode
- `toggleThemeMode(theme)` - Switch between modes
- `clearTheme()` - Remove applied theme
- `validateThemeToken(data)` - Validate theme JSON

### ShadCN CLI for Components
```bash
bun x shadcn@latest init        # Initialize with components.json
bun x shadcn@latest add --all   # Install ALL 59 components at once
```

## Strategy: Per-Folder shadcn.md Checklists

Create a `shadcn.md` file at the root of the project and in each major component folder with checkbox todo lists. This allows agents/developers to claim and complete chunks of work systematically.

### File Structure
```
/shadcn.md                           # Root index pointing to all sub-files
/src/components/shadcn.md            # Components index
/src/components/modal/shadcn.md      # Modal-specific todos
/src/components/Wallet/shadcn.md     # Wallet-specific todos
/src/components/pages/shadcn.md      # Pages-specific todos
/src/components/ui/shadcn.md         # UI primitives todos
/src/app/shadcn.md                   # App routes todos
```

---

## Complete Route Sitemap (47 routes)

### Page Routes (31)

| Route | File | Dynamic Segments | Status |
|-------|------|------------------|--------|
| `/` | `src/app/page.tsx` | - | ⬜ |
| `/activity` | `src/app/activity/page.tsx` | - | ⬜ |
| `/activity/[address]` | `src/app/activity/[address]/page.tsx` | `[address]` | ⬜ |
| `/activity/[address]/[type]` | `src/app/activity/[address]/[type]/page.tsx` | `[address]`, `[type]` | ⬜ |
| `/collection` | `src/app/collection/page.tsx` | - | ⬜ |
| `/collection/[outpoint]` | `src/app/collection/[outpoint]/page.tsx` | `[outpoint]` | ⬜ |
| `/holders/[type]/[id]` | `src/app/holders/[type]/[id]/page.tsx` | `[type]`, `[id]` | ⬜ |
| `/inscribe` | `src/app/inscribe/page.tsx` | - | ⬜ |
| `/listings` | `src/app/listings/page.tsx` | - | ⬜ |
| `/listings/[tab]` | `src/app/listings/[tab]/page.tsx` | `[tab]` | ⬜ |
| `/listings/search` | `src/app/listings/search/page.tsx` | - | ⬜ |
| `/listings/search/[term]` | `src/app/listings/search/[term]/page.tsx` | `[term]` | ⬜ |
| `/market` | `src/app/market/page.tsx` | - | ⬜ |
| `/market/[tab]` | `src/app/market/[tab]/page.tsx` | `[tab]` | ⬜ |
| `/market/[tab]/[id]` | `src/app/market/[tab]/[id]/page.tsx` | `[tab]`, `[id]` | ⬜ |
| `/market/[tab]/new` | `src/app/market/[tab]/new/page.tsx` | `[tab]` | ⬜ |
| `/market/search` | `src/app/market/search/page.tsx` | - | ⬜ |
| `/market/search/[term]` | `src/app/market/search/[term]/page.tsx` | `[term]` | ⬜ |
| `/mine` | `src/app/mine/page.tsx` | - | ⬜ |
| `/outpoint/[outpoint]` | `src/app/outpoint/[outpoint]/page.tsx` | `[outpoint]` | ⬜ |
| `/outpoint/[outpoint]/[tab]` | `src/app/outpoint/[outpoint]/[tab]/page.tsx` | `[outpoint]`, `[tab]` | ⬜ |
| `/preview` | `src/app/preview/page.tsx` | - | ⬜ |
| `/publisher/COOM` | `src/app/publisher/COOM/page.tsx` | - | ⬜ |
| `/publisher/COOM/[outpoint]` | `src/app/publisher/COOM/[outpoint]/page.tsx` | `[outpoint]` | ⬜ |
| `/sign/[message]` | `src/app/sign/[message]/page.tsx` | `[message]` | ⬜ |
| `/signer/[address]` | `src/app/signer/[address]/page.tsx` | `[address]` | ⬜ |
| `/wallet` | `src/app/wallet/page.tsx` | - | ⬜ |
| `/wallet/[tab]` | `src/app/wallet/[tab]/page.tsx` | `[tab]` | ⬜ |
| `/wallet/create` | `src/app/wallet/create/page.tsx` | - | ⬜ |
| `/wallet/delete` | `src/app/wallet/delete/page.tsx` | - | ⬜ |
| `/wallet/import` | `src/app/wallet/import/page.tsx` | - | ⬜ |
| `/wallet/swap` | `src/app/wallet/swap/page.tsx` | - | ⬜ |

### API Routes (11)

| Route | File | Status |
|-------|------|--------|
| `/api/chat` | `src/app/api/chat/route.ts` | N/A |
| `/api/feed` | `src/app/api/feed/route.ts` | N/A |
| `/api/ollama/generate` | `src/app/api/ollama/generate/route.ts` | N/A |
| `/api/ollama/model` | `src/app/api/ollama/model/route.ts` | N/A |
| `/api/openai/chat` | `src/app/api/openai/chat/route.ts` | N/A |
| `/api/openai/generate` | `src/app/api/openai/generate/route.ts` | N/A |
| `/api/openai/transcribe` | `src/app/api/openai/transcribe/route.ts` | N/A |
| `/api/sanitize` | `src/app/api/sanitize/route.ts` | N/A |
| `/holders/[type]/[id]/details` | `src/app/holders/[type]/[id]/details/route.ts` | N/A |
| `/holders/[type]/[id]/holders` | `src/app/holders/[type]/[id]/holders/route.ts` | N/A |
| `/market/[tab]/list` | `src/app/market/[tab]/list/route.ts` | N/A |

---

## Component Catalog by Folder

### src/components/ui/ (10 files)

| File | DaisyUI | Hardcoded Colors | Priority | Status |
|------|---------|------------------|----------|--------|
| `button.tsx` | - | - | ✅ Already ShadCN | ✅ |
| `button-group.tsx` | - | - | ✅ Already ShadCN | ✅ |
| `form.tsx` | - | - | ✅ Already ShadCN | ✅ |
| `input.tsx` | - | - | ✅ Already ShadCN | ✅ |
| `label.tsx` | - | - | ✅ Already ShadCN | ✅ |
| `empty.tsx` | - | `bg-[#222]`, `text-[#666]`, `text-[#888]` | HIGH | ⬜ |
| `skeleton.tsx` | - | `bg-[#222]` | HIGH | ⬜ |
| `meteors.tsx` | - | `bg-slate-500`, gradient colors | LOW | ⬜ |
| `spotlights.tsx` | - | opacity values | LOW | ⬜ |
| `tracing-beam.tsx` | - | `stroke="#9091A0"`, gradient colors | LOW | ⬜ |

### src/components/modal/ (29 files)

#### Main Modal Files

| File | Modal Type | DaisyUI Classes | Hardcoded Colors | Status |
|------|------------|-----------------|------------------|--------|
| `airdrop/index.tsx` | DaisyUI dialog | `modal`, `modal-box`, `input-bordered`, `tooltip`, `divider` | `bg-[#111]`, `text-[#aaa]`, `text-[#555]`, `placeholder:text-[#333]` | ⬜ |
| `buyArtifact/index.tsx` | Custom div | None | `bg-[#111]`, `text-[#aaa]`, `text-[#777]`, `text-red-200` | ⬜ |
| `cancelListing/index.tsx` | DaisyUI dialog | `modal`, `modal-box`, `btn`, `btn-error` | - | ⬜ |
| `createTokenListing/index.tsx` | DaisyUI dialog | `modal`, `modal-box`, `tooltip` | `text-[#555]` | ⬜ |
| `createWallet/index.tsx` | DaisyUI dialog | `modal`, `modal-box`, `btn`, `btn-primary`, `bg-neutral`, `rounded-box` | - | ⬜ |
| `deleteWallet/index.tsx` | DaisyUI dialog | `modal`, `modal-box`, `btn`, `btn-error`, `btn-secondary` | - | ⬜ |
| `deposit/index.tsx` | Custom div | `modal`, `modal-backdrop`, `btn` | `bg-[#111]`, `text-[#aaa]` | ⬜ |
| `enterPassphrase/index.tsx` | DaisyUI dialog | `modal`, `modal-box` | - | ⬜ |
| `importWallet/index.tsx` | DaisyUI dialog | `modal`, `modal-box`, `btn-outline`, `btn-lg` | - | ⬜ |
| `protectKeys/index.tsx` | DaisyUI dialog | `modal`, `modal-box` | - | ⬜ |
| `swapKeys/index.tsx` | DaisyUI dialog | `modal`, `modal-box`, `btn-secondary` | `text-warning` | ⬜ |
| `transferBsv20/index.tsx` | Custom div | `input-bordered`, `modal-action` | `bg-[#111]`, `text-[#aaa]` | ⬜ |
| `withdrawal/index.tsx` | Custom div | `input-bordered`, `modal-action` | `bg-[#111]`, `text-[#aaa]` | ⬜ |
| `artifactModal.tsx` | Custom div | None (uses ShadCN Button) | `bg-[#111]`, `bg-black/85` | ⬜ |

#### Step Components (15 files)

| File | DaisyUI Classes | Hardcoded Colors | Status |
|------|-----------------|------------------|--------|
| `createWallet/steps/CreateStep.tsx` | `modal-action`, `btn`, `btn-primary`, `loading` | - | ⬜ |
| `createWallet/steps/CreatedStep.tsx` | `modal-action`, `btn`, `btn-primary` | - | ⬜ |
| `createWallet/steps/EnterPassphraseStep.tsx` | (delegates to EnterPassphrase) | - | ⬜ |
| `createWallet/steps/FundStep.tsx` | `modal-action`, `btn`, `btn-primary` | - | ⬜ |
| `createWallet/steps/VerifyMnemonicStep.tsx` | - | - | ⬜ |
| `createWallet/steps/ViewMnemonicStep.tsx` | `alert`, `alert-warning`, `btn-sm` | `bg-yellow-500` | ⬜ |
| `importWallet/steps/DoneStep.tsx` | `btn`, `btn-primary` | - | ⬜ |
| `importWallet/steps/fromBackupJson/EnterPassphraseStep.tsx` | (delegates) | - | ⬜ |
| `importWallet/steps/fromBackupJson/SelectFileStep.tsx` | `file-input`, `file-input-bordered`, `btn`, `btn-disabled` | - | ⬜ |
| `importWallet/steps/fromMnemonic/EnterMnemonicStep.tsx` | - | - | ⬜ |
| `importWallet/steps/fromMnemonic/EnterPassphraseStep.tsx` | (delegates) | - | ⬜ |
| `importWallet/steps/fromMnemonic/GenerateWalletStep.tsx` | `loading`, `loading-spinner`, `btn`, `btn-primary` | `border-green-400`, `text-green-400`, `bg-[#1a1a1a]` | ⬜ |
| `protectKeys/steps/DoneStep.tsx` | `btn`, `btn-outline`, `btn-sm` | `text-gray-500` | ⬜ |
| `protectKeys/steps/EnterPassphraseStep.tsx` | (delegates) | - | ⬜ |
| `protectKeys/steps/InfoStep.tsx` | `btn`, `btn-outline`, `btn-sm` | `text-gray-500` | ⬜ |

### src/components/Wallet/ (10 files)

| File | DaisyUI Classes | Hardcoded Colors | Status |
|------|-----------------|------------------|--------|
| `menu.tsx` | `dropdown`, `dropdown-end`, `btn`, `btn-ghost`, `dropdown-content`, `menu`, `divider`, `tooltip` | `text-[#555]`, `text-[#333]` | ⬜ |
| `bsv20List.tsx` | `table`, `table-compact`, `tooltip`, `tabs`, `tab`, `btn`, `btn-sm`, `btn-xs` | `bg-[#222]`, `text-[#aaa]` | ⬜ |
| `tabs.tsx` | `tabs`, `tab-active`, `navbar`, `border-base-200` | - | ⬜ |
| `filter.tsx` | `tabs`, `tab` | - | ⬜ |
| `history.tsx` | `table`, `table-sm` | - | ⬜ |
| `ordinals.tsx` | `loading`, `loading-spinner` | - | ⬜ |
| `deposit.tsx` | - | - | ⬜ |
| `home.tsx` | - | - | ⬜ |
| `bsv20.tsx` | - | - | ⬜ |
| `safu.tsx` | `btn`, `btn-primary`, `btn-neutral` | - | ⬜ |

### src/components/pages/ (50+ files)

#### Home Page
| File | DaisyUI | Hardcoded Colors | Status |
|------|---------|------------------|--------|
| `home/index.tsx` | - | - | ⬜ |
| `home/flowLoader.tsx` | - | - | ⬜ |
| `home/flowgrid.tsx` | - | `bg-[#111]`, `bg-[#222]` | ⬜ |
| `home/loader.tsx` | - | - | ⬜ |
| `home/loadingSkeleton.tsx` | - | - | ⬜ |
| `home/slideshow.tsx` | - | - | ⬜ |
| `home/menu.tsx` | - | - | ⬜ |

#### Market
| File | DaisyUI | Hardcoded Colors | Status |
|------|---------|------------------|--------|
| `market/index.tsx` | - | - | ⬜ |
| `market/tabs.tsx` | `tabs`, `tab-active`, `swap`, `swap-flip`, `tooltip` | - | ⬜ |
| `market/filter.tsx` | `dropdown`, `dropdown-content`, `btn`, `menu` | - | ⬜ |
| `market/new.tsx` | `btn` | `bg-[#222]` | ⬜ |

#### Listings
| File | DaisyUI | Hardcoded Colors | Status |
|------|---------|------------------|--------|
| `listings/index.tsx` | - | - | ⬜ |
| `listings/tabs.tsx` | `tabs`, `tab-active` | - | ⬜ |

#### Inscribe
| File | DaisyUI | Hardcoded Colors | Status |
|------|---------|------------------|--------|
| `inscribe/index.tsx` | - | - | ⬜ |
| `inscribe/inscribe.tsx` | `form`, `form-control`, `input` | - | ⬜ |
| `inscribe/tabs/index.tsx` | `tabs`, `tab` | - | ⬜ |
| `inscribe/image.tsx` | - | - | ⬜ |
| `inscribe/text.tsx` | - | - | ⬜ |
| `inscribe/html.tsx` | - | - | ⬜ |
| `inscribe/bsv20.tsx` | `btn` | - | ⬜ |
| `inscribe/bsv21.tsx` | - | - | ⬜ |
| `inscribe/collection.tsx` | - | - | ⬜ |
| `inscribe/model.tsx` | - | - | ⬜ |

#### Outpoint (Item Details)
| File | DaisyUI | Hardcoded Colors | Status |
|------|---------|------------------|--------|
| `outpoint/index.tsx` | - | - | ⬜ |
| `outpoint/clientOutpointPage.tsx` | - | - | ⬜ |
| `outpoint/tabs.tsx` | `tabs`, `tab-active` | - | ⬜ |
| `outpoint/heading.tsx` | - | - | ⬜ |
| `outpoint/ArtifactViewer.tsx` | - | - | ⬜ |
| `outpoint/inscription.tsx` | - | - | ⬜ |
| `outpoint/inscriptionContent.tsx` | - | - | ⬜ |
| `outpoint/token.tsx` | - | - | ⬜ |
| `outpoint/tokenContent.tsx` | - | - | ⬜ |
| `outpoint/owner.tsx` | - | - | ⬜ |
| `outpoint/ownerContent.tsx` | - | `text-[#aaa]`, `text-[#555]` | ⬜ |
| `outpoint/listing.tsx` | - | - | ⬜ |
| `outpoint/listingContent.tsx` | - | - | ⬜ |
| `outpoint/timeline.tsx` | `timeline`, `timeline-vertical`, `timeline-start`, `timeline-end`, `timeline-middle`, `timeline-box` | `text-emerald-300` | ⬜ |
| `outpoint/timelineContent.tsx` | - | - | ⬜ |

#### Token Market
| File | DaisyUI | Hardcoded Colors | Status |
|------|---------|------------------|--------|
| `TokenMarket/index.tsx` | - | - | ⬜ |
| `TokenMarket/heading.tsx` | `btn`, `btn-sm` | - | ⬜ |
| `TokenMarket/tabs.tsx` | `tabs`, `tab-active` | - | ⬜ |
| `TokenMarket/chart.tsx` | - | - | ⬜ |
| `TokenMarket/details.tsx` | - | - | ⬜ |
| `TokenMarket/fund.tsx` | - | - | ⬜ |
| `TokenMarket/list.tsx` | `table` | - | ⬜ |
| `TokenMarket/listingForm.tsx` | `form`, `form-control`, `input`, `btn`, `btn-primary` | `bg-[#222]`, `text-[#aaa]` | ⬜ |

#### Other Pages
| File | DaisyUI | Hardcoded Colors | Status |
|------|---------|------------------|--------|
| `activity/index.tsx` | `btn`, `btn-lg` | - | ⬜ |
| `collection/index.tsx` | - | - | ⬜ |
| `mine/index.tsx` | `btn`, `btn-primary`, `btn-sm` | - | ⬜ |
| `preview/index.tsx` | `btn` | - | ⬜ |
| `search/index.tsx` | `btn` | - | ⬜ |
| `sign/index.tsx` | `btn`, `btn-primary` | 15+ hardcoded colors | ⬜ |

### src/components/ (Other)

| File | DaisyUI | Hardcoded Colors | Status |
|------|---------|------------------|--------|
| `header/index.tsx` | `navbar`, `navbar-start`, `navbar-end`, `bg-base-100` | - | ⬜ |
| `Footer/footer.tsx` | - | `text-yellow-400/25`, `hover:text-yellow-500` | ⬜ |
| `ScrollToTop.tsx` | `btn`, `btn-circle`, `btn-primary` | - | ⬜ |
| `tooltip.tsx` | - | `bg-gray-800` | ⬜ |
| `SigmaAvatar.tsx` | - | Dynamic HSL colors | ⬜ |
| `Passphrase/index.tsx` | `input`, `btn`, `btn-error`, `btn-primary` | - | ⬜ |
| `dropdown/dropdown.tsx` | `input`, `input-bordered` | `bg-[#1a1a1a]`, `text-yellow-500`, `bg-[#222]` | ⬜ |
| `tabs/index.tsx` | `tabs`, `tabs-boxed`, `tab`, `tab-active` | - | ⬜ |
| `Timeline/index.tsx` | `timeline`, `timeline-vertical` | `text-[#aaa]`, `text-emerald-300` | ⬜ |
| `MnemonicGrid/index.tsx` | `btn`, `btn-primary`, `btn-sm`, `input` | `bg-[#1a1a1a]`, `text-yellow-500`, `text-[#444]`, `text-[#555]` | ⬜ |
| `SearchBar/index.tsx` | `input`, `input-ghost` | `bg-[#111]`, `border-yellow-200/25`, `text-[#555]` | ⬜ |
| `marketMenu/index.tsx` | `dropdown`, `dropdown-end` | - | ⬜ |
| `jsonTable/index.tsx` | `table`, `table-compact` | `bg-[#222]`, `text-[#aaa]` | ⬜ |
| `transaction/display.tsx` | `table` | `bg-[#222]`, `text-[#aaa]` | ⬜ |
| `vivi/button.tsx` | `btn`, `btn-ghost`, `btn-primary`, `divider`, `input`, `input-bordered` | `bg-[#222]`, `text-[#aaa]`, `placeholder-[#555]` | ⬜ |
| `artifact/index.tsx` | - | `bg-[#111]`, `bg-[#222]`, `text-blue-400` | ⬜ |
| `OrdinalListings/list.tsx` | `table`, `table-sm` | `bg-[#222]`, `text-[#aaa]` | ⬜ |
| `OrdinalListings/buy.tsx` | `btn` | - | ⬜ |

---

## Phase 1: Foundation (Do First)

### 1.1 Create Branch ✅
```bash
git checkout -b feature/shadcn-themetoken
```

### 1.2 Initialize ShadCN
Run the ShadCN CLI to set up proper config:
```bash
bun x shadcn@latest init
# Options: style=new-york, base-color=neutral, css-variables=yes, rsc=yes, tsx=yes
```

This will:
- Create `components.json` with proper aliases
- Create `src/lib/utils.ts` with `cn()` helper
- Update `tailwind.config.ts` with ShadCN color mappings
- Add default CSS variables to `globals.css`

### 1.3 Install midnight-aurora ThemeToken as Base Theme
```bash
bunx shadcn@latest add https://themetoken.dev/r/themes/85702d92d2ca2f5a48eaede302f0e85d9142924d68454565dbf621701b2d83cf_0
```

This replaces the default ShadCN CSS variables with the midnight-aurora theme.

### 1.4 Install All ShadCN Components
```bash
bun x shadcn@latest add --all   # Installs all 59 components
```

### 1.5 Install ThemeToken SDK
```bash
bun add @theme-token/sdk
```

### 1.6 Remove DaisyUI
```bash
bun remove daisyui
```

Update `tailwind.config.ts`:
- Remove `require("daisyui")` from plugins
- Remove `daisyui: { themes: ["luxury"] }`

Note: Keep `@headlessui/tailwindcss` - it's used for Tremor charts.

### 1.7 Create ThemeToken Hook
Create `src/hooks/useThemeToken.ts`:
```typescript
import { useEffect, useState } from 'react';
import { fetchThemeByOrigin, applyThemeMode, clearTheme } from '@theme-token/sdk';
import type { ThemeToken } from '@theme-token/sdk';

export function useThemeToken(ordinals: Array<{ origin: string; map?: { app?: string } }>) {
  const [activeTheme, setActiveTheme] = useState<ThemeToken | null>(null);

  // Filter for ThemeToken ordinals
  const themeTokens = ordinals.filter(o => o.map?.app === 'ThemeToken');

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('selected-theme-origin');
    if (saved) {
      loadTheme(saved);
    }
  }, []);

  async function loadTheme(origin: string) {
    const published = await fetchThemeByOrigin(origin);
    if (published) {
      const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      applyThemeMode(published.theme, mode);
      setActiveTheme(published.theme);
      localStorage.setItem('selected-theme-origin', origin);
    }
  }

  function resetTheme() {
    clearTheme();
    setActiveTheme(null);
    localStorage.removeItem('selected-theme-origin');
  }

  return { themeTokens, activeTheme, loadTheme, resetTheme };
}
```

---

## Phase 2: Create Per-Folder shadcn.md Files

After Phase 1, commit the foundation and create the checklist files for parallel work.

---

## Color Mapping Reference

| Hardcoded | Semantic Replacement |
|-----------|---------------------|
| `bg-[#111]` | `bg-card` |
| `bg-[#222]` | `bg-secondary` or `bg-muted` |
| `bg-[#1a1a1a]` | `bg-card` |
| `text-[#aaa]` | `text-card-foreground` |
| `text-[#555]` | `text-muted-foreground` |
| `text-[#666]` | `text-muted-foreground` |
| `text-[#888]` | `text-muted-foreground` |
| `text-[#333]` | `text-muted-foreground/50` |
| `placeholder:text-[#333]` | `placeholder:text-muted-foreground` |
| `border-[#222]` | `border-border` |
| `border-yellow-200/25` | `border-primary/25` |
| `bg-base-100` | `bg-background` |
| `bg-base-200` | `bg-card` |
| `border-base-200` | `border-border` |
| `text-neutral-content` | `text-muted-foreground` |
| `bg-neutral` | `bg-muted` |

## DaisyUI to ShadCN Component Mapping

| DaisyUI | ShadCN Replacement |
|---------|-------------------|
| `modal`, `modal-box` | `<Dialog>`, `<DialogContent>` |
| `modal-action` | `<DialogFooter>` |
| `btn` | `<Button>` |
| `btn-primary` | `<Button>` (default) |
| `btn-secondary` | `<Button variant="secondary">` |
| `btn-ghost` | `<Button variant="ghost">` |
| `btn-outline` | `<Button variant="outline">` |
| `btn-error` | `<Button variant="destructive">` |
| `btn-sm` | `<Button size="sm">` |
| `tabs`, `tab` | `<Tabs>`, `<TabsTrigger>` |
| `tab-active` | Controlled by Tabs value |
| `dropdown` | `<DropdownMenu>` |
| `dropdown-content` | `<DropdownMenuContent>` |
| `menu` | `<DropdownMenuItem>` items |
| `tooltip` | `<Tooltip>`, `<TooltipContent>` |
| `divider` | `<Separator>` |
| `input`, `input-bordered` | `<Input>` |
| `table` | Keep as Tailwind classes |
| `loading`, `loading-spinner` | Custom spinner or Lucide icon |
| `navbar` | Keep as layout utility |

---

## Summary Stats

- **Total Routes**: 47 (31 pages + 8 API + 8 dynamic API)
- **Total Component Files**: 160+
- **Modal Files**: 29
- **Files with DaisyUI classes**: 40+
- **Files with hardcoded colors**: 30+
- **ShadCN Components**: All 59 installed via `bun x shadcn@latest add --all`

## Key Tools

| Tool | Purpose |
|------|---------|
| TweakCN | Design base theme visually, export OKLCH CSS |
| @theme-token/sdk | Detect ordinals, apply themes at runtime |
| ShadCN CLI | Install components and configure project |

## Critical Files to Modify

- `src/app/globals.css` - Theme CSS variables (from ThemeToken)
- `tailwind.config.ts` - Remove DaisyUI, ShadCN colors added by CLI
- `components.json` - Created by ShadCN CLI
- `src/lib/utils.ts` - Created by ShadCN CLI
- `src/hooks/useThemeToken.ts` - New hook for ThemeToken integration
- `src/components/ui/*` - All ShadCN components installed here
