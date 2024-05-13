"use client";

import SAFU from "@/components/Wallet/safu";
import Inscribe from "@/components/pages/inscribe/inscribe";
import { bsvWasmReady, encryptedBackup, payPk, utxos } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { FaSpinner } from "react-icons/fa6";
import type { InscriptionTab } from "./tabs";

const InscribePage: React.FC = () => {
  useSignals();
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") as InscriptionTab;
  const generated = params.get("generated") === "true";


  const locked = computed(() => !ordAddress.value && !!encryptedBackup);

  if (locked.value) {
    return <SAFU />;
  }

  if (!ordAddress.value) {
    return (
      <div className="mx-auto animate-spin w-fit flex flex-col items-center justify-center min-h-[80vh]">
        <FaSpinner />
      </div>
    );
  }

  return (
    <>
      {bsvWasmReady.value && payPk.value && utxos.value && <Inscribe tab={tab} generated={generated} />}
      <div className="p-2 md:p-4">
        {bsvWasmReady.value && (!payPk.value || !utxos.value) && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <div
            className="rounded bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-4 md:p-8"
            onClick={() => router.push("./wallet")}
          >
            You need funds to inscribe. Check your wallet.
          </div>
        )}
      </div>
    </>
  );
};

export default InscribePage;
