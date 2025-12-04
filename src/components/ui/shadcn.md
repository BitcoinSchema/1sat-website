# UI Components Migration

All ShadCN components are now installed. These files need hardcoded color fixes.

## Installed ShadCN Components (47)

All components installed via `bun x shadcn@latest add --all`:
- accordion, alert, alert-dialog, aspect-ratio, avatar, badge
- breadcrumb, button, button-group, calendar, card, carousel
- chart, checkbox, collapsible, command, context-menu, dialog
- drawer, dropdown-menu, empty, field, form, hover-card
- input, input-group, input-otp, item, kbd, label
- menubar, navigation-menu, pagination, popover, progress
- radio-group, resizable, scroll-area, select, separator
- sheet, sidebar, skeleton, slider, sonner, spinner
- switch, table, tabs, textarea, toggle, toggle-group, tooltip

## Files Needing Color Migration

- [ ] `empty.tsx` - Replace `bg-[#222]`, `text-[#666]`, `text-[#888]`
- [ ] `skeleton.tsx` - Replace `bg-[#222]`
- [ ] `meteors.tsx` - Replace `bg-slate-500`, gradient colors
- [ ] `spotlights.tsx` - Review opacity values
- [ ] `tracing-beam.tsx` - Replace `stroke="#9091A0"`, gradient colors

## Color Mapping

| Old | New |
|-----|-----|
| `bg-[#222]` | `bg-muted` |
| `text-[#666]` | `text-muted-foreground` |
| `text-[#888]` | `text-muted-foreground` |
| `bg-slate-500` | `bg-muted` |
