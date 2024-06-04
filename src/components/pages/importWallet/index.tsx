"use client";

import ImportWalletModal from "@/components/modal/importWallet";
import { useSignal } from "@preact/signals-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const ImportWalletPage = () => {
  const router = useRouter();
  const open = useSignal(true);

  const close = useCallback(
    (signedOut = false) => {
      open.value = false;
      // if (signedOut) {
      //   router.push("/");
      //   return;
      // }
      // router.back();
      router.push("/");
    },
    [open, router]
  );

  return <ImportWalletModal open={open.value} onClose={close} />;
};

export default ImportWalletPage;
