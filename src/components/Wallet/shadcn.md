# Wallet Components Migration

## Migration Tasks

- [ ] `menu.tsx`
  - Replace: `dropdown`, `dropdown-end`, `btn`, `btn-ghost`, `dropdown-content`, `menu`, `divider`, `tooltip`
  - Colors: `text-[#555]`, `text-[#333]`

- [ ] `bsv20List.tsx`
  - Replace: `table`, `table-compact`, `tooltip`, `tabs`, `tab`, `btn`, `btn-sm`, `btn-xs`
  - Colors: `bg-[#222]`, `text-[#aaa]`

- [ ] `tabs.tsx`
  - Replace: `tabs`, `tab-active`, `navbar`, `border-base-200`

- [ ] `filter.tsx`
  - Replace: `tabs`, `tab`

- [ ] `history.tsx`
  - Replace: `table`, `table-sm`

- [ ] `ordinals.tsx`
  - Replace: `loading`, `loading-spinner`

- [ ] `deposit.tsx`
  - Review for hardcoded colors

- [ ] `home.tsx`
  - Review for hardcoded colors

- [ ] `bsv20.tsx`
  - Review for hardcoded colors

- [ ] `safu.tsx`
  - Replace: `btn`, `btn-primary`, `btn-neutral`

## Component Mapping

```tsx
// Dropdown Menu
// Before
<div className="dropdown dropdown-end">
  <div tabIndex={0} className="btn btn-ghost">Menu</div>
  <ul className="dropdown-content menu">
    <li><a>Item</a></li>
  </ul>
</div>

// After
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

```tsx
// Tabs
// Before
<div className="tabs">
  <a className={`tab ${active ? 'tab-active' : ''}`}>Tab 1</a>
</div>

// After
<Tabs value={value} onValueChange={setValue}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content</TabsContent>
</Tabs>
```
