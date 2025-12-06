# Modal Components Migration

All modal components need to migrate from DaisyUI `modal` to ShadCN `Dialog`.

## Migration Tasks

### Main Modals

- [ ] `airdrop/index.tsx`
  - Replace: `modal`, `modal-box`, `input-bordered`, `tooltip`, `divider`
  - Colors: `bg-[#111]`, `text-[#aaa]`, `text-[#555]`, `placeholder:text-[#333]`

- [ ] `buyArtifact/index.tsx`
  - Colors: `bg-[#111]`, `text-[#aaa]`, `text-[#777]`, `text-red-200`

- [ ] `cancelListing/index.tsx`
  - Replace: `modal`, `modal-box`, `btn`, `btn-error`

- [ ] `createTokenListing/index.tsx`
  - Replace: `modal`, `modal-box`, `tooltip`
  - Colors: `text-[#555]`

- [ ] `createWallet/index.tsx`
  - Replace: `modal`, `modal-box`, `btn`, `btn-primary`, `bg-neutral`, `rounded-box`

- [ ] `deleteWallet/index.tsx`
  - Replace: `modal`, `modal-box`, `btn`, `btn-error`, `btn-secondary`

- [ ] `deposit/index.tsx`
  - Replace: `modal`, `modal-backdrop`, `btn`
  - Colors: `bg-[#111]`, `text-[#aaa]`

- [ ] `enterPassphrase/index.tsx`
  - Replace: `modal`, `modal-box`

- [ ] `importWallet/index.tsx`
  - Replace: `modal`, `modal-box`, `btn-outline`, `btn-lg`

- [ ] `protectKeys/index.tsx`
  - Replace: `modal`, `modal-box`

- [ ] `swapKeys/index.tsx`
  - Replace: `modal`, `modal-box`, `btn-secondary`
  - Colors: `text-warning`

- [ ] `transferBsv20/index.tsx`
  - Replace: `input-bordered`, `modal-action`
  - Colors: `bg-[#111]`, `text-[#aaa]`

- [ ] `withdrawal/index.tsx`
  - Replace: `input-bordered`, `modal-action`
  - Colors: `bg-[#111]`, `text-[#aaa]`

- [ ] `artifactModal.tsx`
  - Colors: `bg-[#111]`, `bg-black/85`

### Step Components

- [ ] `createWallet/steps/CreateStep.tsx` - `modal-action`, `btn`, `btn-primary`, `loading`
- [ ] `createWallet/steps/CreatedStep.tsx` - `modal-action`, `btn`, `btn-primary`
- [ ] `createWallet/steps/EnterPassphraseStep.tsx` - delegates
- [ ] `createWallet/steps/FundStep.tsx` - `modal-action`, `btn`, `btn-primary`
- [ ] `createWallet/steps/VerifyMnemonicStep.tsx`
- [ ] `createWallet/steps/ViewMnemonicStep.tsx` - `alert`, `alert-warning`, `btn-sm`, `bg-yellow-500`
- [ ] `importWallet/steps/DoneStep.tsx` - `btn`, `btn-primary`
- [ ] `importWallet/steps/fromBackupJson/EnterPassphraseStep.tsx`
- [ ] `importWallet/steps/fromBackupJson/SelectFileStep.tsx` - `file-input`, `file-input-bordered`
- [ ] `importWallet/steps/fromMnemonic/EnterMnemonicStep.tsx`
- [ ] `importWallet/steps/fromMnemonic/EnterPassphraseStep.tsx`
- [ ] `importWallet/steps/fromMnemonic/GenerateWalletStep.tsx` - `loading`, colors
- [ ] `protectKeys/steps/DoneStep.tsx` - `btn`, `btn-outline`, `btn-sm`, `text-gray-500`
- [ ] `protectKeys/steps/EnterPassphraseStep.tsx`
- [ ] `protectKeys/steps/InfoStep.tsx` - `btn`, `btn-outline`, `btn-sm`, `text-gray-500`

## Component Mapping

```tsx
// Before (DaisyUI)
<dialog className="modal modal-open">
  <div className="modal-box">
    <h3>Title</h3>
    <div className="modal-action">
      <button className="btn btn-primary">Confirm</button>
    </div>
  </div>
</dialog>

// After (ShadCN)
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <DialogFooter>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```
