import { useOrdinals } from "@/context/ordinals";
import { PendingTransaction, useWallet } from "@/context/wallet";
import { Utxo } from "js-1sat-ord";
import { head } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { FetchStatus } from "..";

interface InscribeHtmlProps {
  inscribedCallback: (pendingTx: PendingTransaction) => void;
}

const InscribeHtml: React.FC<InscribeHtmlProps> = ({ inscribedCallback }) => {
  const [text, setText] = useState<string>();
  const { inscribeUtf8 } = useOrdinals();
  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const { payPk, ordAddress, changeAddress, getUTXOs } = useWallet();

  const changeText = useCallback(
    (e: any) => {
      setText(e.target.value);
      // TODO: Show HTML preview
    },
    [setText]
  );
  const submitDisabled = useMemo(() => {
    return inscribeStatus === FetchStatus.Loading;
  }, [inscribeStatus]);

  const inscribeHtml = useCallback(
    async (utxo: Utxo) => {
      if (!text) {
        return;
      }
      try {
        setInscribeStatus(FetchStatus.Loading);

        const pendingTx = await inscribeUtf8(text, "text/html", utxo);

        setInscribeStatus(FetchStatus.Success);

        if (pendingTx) {
          inscribedCallback(pendingTx);
        }
      } catch (e) {
        console.log(e);
        setInscribeStatus(FetchStatus.Error);
      }
    },
    [inscribedCallback, inscribeUtf8, text]
  );

  const clickInscribe = useCallback(async () => {
    if (!payPk || !ordAddress || !changeAddress) {
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

    try {
      await inscribeHtml(u);
    } catch (e) {
      console.log(e);
    }
  }, [getUTXOs, changeAddress, ordAddress, payPk, inscribeHtml]);

  const previewHtml = useMemo(() => {
    if (!text) {
      return (
        <div className="flex items-center justify-center text-center w-full h-full text-[#333]">
          Preview
        </div>
      );
    }
    return (
      <iframe
        sandbox=" "
        className="w-full rounded h-full"
        src={`data:text/html;charset=utf-8,${encodeURIComponent(text)}`}
      />
    );
  }, [text]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="w-full flex flex-col md:flex-row">
        <div className="md:w-1/2 md:mr-2 h-64">
          <textarea
            className="w-full p-2 rounded h-full"
            onChange={changeText}
            value={text}
          />
        </div>
        {previewHtml && (
          <hr className="block md:hidden my-2 h-2 border-0 bg-[#222]" />
        )}
        <div className="md:w-1/2 md:ml-2">{previewHtml}</div>
      </div>
      <button
        disabled={submitDisabled}
        type="submit"
        onClick={clickInscribe}
        className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
      >
        Inscribe HTML
      </button>
    </div>
  );
};

export default InscribeHtml;
