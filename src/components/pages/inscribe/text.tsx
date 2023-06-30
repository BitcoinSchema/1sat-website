import { useOrdinals } from "@/context/ordinals";
import { PendingTransaction, useWallet } from "@/context/wallet";
import { Utxo } from "js-1sat-ord";
import { head } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { FetchStatus } from "..";

interface InscribeTextProps {
  inscribedCallback: (pendingTx: PendingTransaction) => void;
}

const InscribeText: React.FC<InscribeTextProps> = ({ inscribedCallback }) => {
  const [text, setText] = useState<string>();
  const { inscribeUtf8 } = useOrdinals();
  const { getUTXOs, payPk, changeAddress, ordAddress } = useWallet();
  const changeText = useCallback(
    (e: any) => {
      setText(e.target.value);
    },
    [setText]
  );

  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const submitDisabled = useMemo(() => {
    return inscribeStatus === FetchStatus.Loading;
  }, [inscribeStatus]);

  const inscribeText = useCallback(
    async (utxo: Utxo, text: string) => {
      if (!text) {
        console.log("no text!");
        return;
      }
      setInscribeStatus(FetchStatus.Loading);

      const pendingTx = await inscribeUtf8(text, "text/plain", utxo);

      setInscribeStatus(FetchStatus.Success);

      return pendingTx;
    },
    [inscribeUtf8]
  );

  const clickInscribe = useCallback(
    async (e: any) => {
      if (
        !text ||
        text.length === 0 ||
        !payPk ||
        !ordAddress ||
        !changeAddress
      ) {
        console.log({ payPk, ordAddress, changeAddress, text });
        return;
      }

      const utxos = await getUTXOs(changeAddress);
      const sortedUtxos = utxos.sort((a, b) =>
        a.satoshis > b.satoshis ? -1 : 1
      );
      const u = head(sortedUtxos);
      if (!u) {
        console.log("no utxo");
        return;
      }
      const pendingTx = await inscribeText(u, text);
      if (pendingTx) {
        inscribedCallback(pendingTx);
      }
    },
    [
      inscribedCallback,
      getUTXOs,
      changeAddress,
      inscribeUtf8,
      ordAddress,
      payPk,
      text,
      inscribeText,
    ]
  );

  return (
    <div className="max-w-lg mx-auto">
      <div className="w-full">
        <textarea
          className="w-full p-2 rounded h-64"
          onChange={changeText}
          value={text}
        />
      </div>
      <button
        disabled={submitDisabled}
        onClick={clickInscribe}
        className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
      >
        Inscribe Text
      </button>
    </div>
  );
};

export default InscribeText;
