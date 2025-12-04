# App Routes Migration

Routes don't typically need DaisyUI migration, but may have layout components.
API routes marked N/A - no UI changes needed.

## Page Routes

- [ ] `/` - `page.tsx`
- [ ] `/activity` - `activity/page.tsx`
- [ ] `/activity/[address]` - `activity/[address]/page.tsx`
- [ ] `/activity/[address]/[type]` - `activity/[address]/[type]/page.tsx`
- [ ] `/collection` - `collection/page.tsx`
- [ ] `/collection/[outpoint]` - `collection/[outpoint]/page.tsx`
- [ ] `/holders/[type]/[id]` - `holders/[type]/[id]/page.tsx`
- [ ] `/inscribe` - `inscribe/page.tsx`
- [ ] `/listings` - `listings/page.tsx`
- [ ] `/listings/[tab]` - `listings/[tab]/page.tsx`
- [ ] `/listings/search` - `listings/search/page.tsx`
- [ ] `/listings/search/[term]` - `listings/search/[term]/page.tsx`
- [ ] `/market` - `market/page.tsx`
- [ ] `/market/[tab]` - `market/[tab]/page.tsx`
- [ ] `/market/[tab]/[id]` - `market/[tab]/[id]/page.tsx`
- [ ] `/market/[tab]/new` - `market/[tab]/new/page.tsx`
- [ ] `/market/search` - `market/search/page.tsx`
- [ ] `/market/search/[term]` - `market/search/[term]/page.tsx`
- [ ] `/mine` - `mine/page.tsx`
- [ ] `/outpoint/[outpoint]` - `outpoint/[outpoint]/page.tsx`
- [ ] `/outpoint/[outpoint]/[tab]` - `outpoint/[outpoint]/[tab]/page.tsx`
- [ ] `/preview` - `preview/page.tsx`
- [ ] `/publisher/COOM` - `publisher/COOM/page.tsx`
- [ ] `/publisher/COOM/[outpoint]` - `publisher/COOM/[outpoint]/page.tsx`
- [ ] `/sign/[message]` - `sign/[message]/page.tsx`
- [ ] `/signer/[address]` - `signer/[address]/page.tsx`
- [ ] `/wallet` - `wallet/page.tsx`
- [ ] `/wallet/[tab]` - `wallet/[tab]/page.tsx`
- [ ] `/wallet/create` - `wallet/create/page.tsx`
- [ ] `/wallet/delete` - `wallet/delete/page.tsx`
- [ ] `/wallet/import` - `wallet/import/page.tsx`
- [ ] `/wallet/swap` - `wallet/swap/page.tsx`

## API Routes (N/A)

- [x] `/api/chat`
- [x] `/api/feed`
- [x] `/api/ollama/generate`
- [x] `/api/ollama/model`
- [x] `/api/openai/chat`
- [x] `/api/openai/generate`
- [x] `/api/openai/transcribe`
- [x] `/api/sanitize`
- [x] `/holders/[type]/[id]/details`
- [x] `/holders/[type]/[id]/holders`
- [x] `/market/[tab]/list`

## Layout Files

- [ ] `layout.tsx` - Check for DaisyUI classes
- [ ] Check all nested `layout.tsx` files
