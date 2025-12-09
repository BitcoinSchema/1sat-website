"use client";

import { useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSound } from "@/hooks/use-sound";
import type { SoundName } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SoundAlertDialogProps
  extends React.ComponentProps<typeof AlertDialog> {
  openSound?: SoundName | false;
}

/**
 * AlertDialog wrapper that plays sounds on open.
 *
 * @param openSound - Sound to play when dialog opens. Default: "dialog". Pass `false` to disable.
 */
function SoundAlertDialog({
  openSound = "dialog",
  onOpenChange,
  ...props
}: SoundAlertDialogProps) {
  const { play } = useSound();
  const wasOpenRef = useRef(props.open ?? false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open && !wasOpenRef.current && openSound) {
        play(openSound);
      }
      wasOpenRef.current = open;
      onOpenChange?.(open);
    },
    [onOpenChange, openSound, play]
  );

  return <AlertDialog {...props} onOpenChange={handleOpenChange} />;
}

interface SoundAlertDialogActionProps
  extends React.ComponentProps<typeof AlertDialogAction> {
  sound?: SoundName | false;
}

/**
 * AlertDialogAction that plays a sound on click.
 *
 * @param sound - Sound to play. Default: "success". Pass `false` to disable.
 */
function SoundAlertDialogAction({
  sound = "success",
  onClick,
  className,
  ...props
}: SoundAlertDialogActionProps) {
  const { play } = useSound();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (sound) play(sound);
      onClick?.(e);
    },
    [onClick, sound, play]
  );

  return (
    <AlertDialogAction
      className={cn(buttonVariants(), className)}
      onClick={handleClick}
      {...props}
    />
  );
}

interface SoundAlertDialogCancelProps
  extends React.ComponentProps<typeof AlertDialogCancel> {
  sound?: SoundName | false;
}

/**
 * AlertDialogCancel that plays a sound on click.
 *
 * @param sound - Sound to play. Default: "decline". Pass `false` to disable.
 */
function SoundAlertDialogCancel({
  sound = "decline",
  onClick,
  className,
  ...props
}: SoundAlertDialogCancelProps) {
  const { play } = useSound();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (sound) play(sound);
      onClick?.(e);
    },
    [onClick, sound, play]
  );

  return (
    <AlertDialogCancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      onClick={handleClick}
      {...props}
    />
  );
}

export {
  SoundAlertDialog,
  SoundAlertDialogAction,
  SoundAlertDialogCancel,
  // Re-export unchanged components
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
