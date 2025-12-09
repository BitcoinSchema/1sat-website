"use client";

import { useCallback, useRef } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSound } from "@/hooks/use-sound";
import type { SoundName } from "@/lib/sounds";

interface SoundDialogProps
  extends React.ComponentProps<typeof Dialog> {
  openSound?: SoundName | false;
}

/**
 * Dialog wrapper that plays sounds on open/close.
 *
 * @param openSound - Sound to play when dialog opens. Default: "dialog". Pass `false` to disable.
 */
function SoundDialog({
  openSound = "dialog",
  onOpenChange,
  ...props
}: SoundDialogProps) {
  const { play } = useSound();
  const wasOpenRef = useRef(props.open ?? false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      // Play sound when opening (not closing)
      if (open && !wasOpenRef.current && openSound) {
        play(openSound);
      }
      wasOpenRef.current = open;
      onOpenChange?.(open);
    },
    [onOpenChange, openSound, play]
  );

  return <Dialog {...props} onOpenChange={handleOpenChange} />;
}

export {
  SoundDialog,
  // Re-export all other dialog components unchanged
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
