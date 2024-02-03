"use client";

import Inscribe from "@/components/pages/inscribe/inscribe";
import { bsvWasmReady, payPk, utxos } from "@/signals/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { InscriptionTab } from "./tabs";

const InscribePage: React.FC = () => {
  useSignals();
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") as InscriptionTab;
  return (
    <>
      {bsvWasmReady.value && payPk.value && utxos.value && <Inscribe tab={tab} />}
      <div className="p-2 md:p-4">
        {bsvWasmReady.value && (!payPk.value || !utxos.value) && (
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
