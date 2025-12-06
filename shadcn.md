# ShadCN/UI Migration Index

This file indexes all per-folder migration checklists. Check the folder-specific `shadcn.md` files for detailed component migration status.

## Migration Status Overview

| Folder | Status | Link |
|--------|--------|------|
| `src/components/ui/` | 🟢 ShadCN installed | [shadcn.md](src/components/ui/shadcn.md) |
| `src/components/modal/` | 🟡 Needs migration | [shadcn.md](src/components/modal/shadcn.md) |
| `src/components/Wallet/` | 🟡 Needs migration | [shadcn.md](src/components/Wallet/shadcn.md) |
| `src/components/pages/` | 🟡 Needs migration | [shadcn.md](src/components/pages/shadcn.md) |
| `src/components/` (other) | 🟡 Needs migration | [shadcn.md](src/components/shadcn.md) |
| `src/app/` | 🟡 Needs migration | [shadcn.md](src/app/shadcn.md) |

## Foundation Setup

- [x] Create branch `feature/shadcn-themetoken`
- [x] Initialize ShadCN CLI (`components.json`, `utils.ts`)
- [x] Install midnight-aurora ThemeToken theme
- [x] Install all 59 ShadCN components
- [x] Install `@theme-token/sdk`
- [x] Remove DaisyUI from plugins
- [x] Create `useThemeToken` hook

## Migration Guide

See [SHADCN_MIGRATION.md](SHADCN_MIGRATION.md) for:
- Color mapping reference (hardcoded → semantic)
- DaisyUI → ShadCN component mapping
- Route sitemap
- Complete component catalog

## Quick Reference

### Color Replacements
```
bg-[#111] → bg-card
bg-[#222] → bg-muted
text-[#aaa] → text-card-foreground
text-[#555] → text-muted-foreground
```

### Component Replacements
```
modal → Dialog
btn → Button
tabs → Tabs
dropdown → DropdownMenu
tooltip → Tooltip
divider → Separator
```
