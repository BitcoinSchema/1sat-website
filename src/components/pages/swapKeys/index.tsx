"use client";

import SwapKeysModal from "@/components/modal/swapKeys";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const SwapKeysPage = () => {
  useSignals();
  const router = useRouter();
  const open = useSignal(true);

  const close = useCallback(
    (cancelled?: boolean) => {
      open.value = false;
      if (cancelled) {
        router.back();
        return;
      }
      router.push("/");
    },
    [open, router]
  );

  return (
    <div className="mx-auto">
      <SwapKeysModal open={open.value} close={close} />
    </div>
  );
};

export default SwapKeysPage;
