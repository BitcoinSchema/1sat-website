import { useOrdinals } from "@/context/ordinals";
import { PendingTransaction, useWallet } from "@/context/wallet";
import { Utxo } from "js-1sat-ord";
import { head } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { RiSettings2Fill } from "react-icons/ri";
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
  const [customContentType, setCustomContentType] = useState<string>();

  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);

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

      const pendingTx = await inscribeUtf8(
        text,
        customContentType || "text/plain",
        utxo
      );

      setInscribeStatus(FetchStatus.Success);

      return pendingTx;
    },
    [inscribeUtf8, customContentType]
  );
  const toggleOptionalFields = useCallback(() => {
    setShowOptionalFields(!showOptionalFields);
  }, [showOptionalFields]);

  const changeContentType = useCallback(
    (e: any) => {
      setCustomContentType(e.target.value);
    },
    [setCustomContentType]
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
      {!showOptionalFields && (
        <div
          className="my-2 flex items-center justify-end cursor-pointer text-blue-500 hover:text-blue-400 transition"
          onClick={toggleOptionalFields}
        >
          <RiSettings2Fill className="mr-2" /> More Options
        </div>
      )}
      {showOptionalFields && (
        <div className="my-2">
          <label className="block mb-4">
            <div className="my-2 flex items-center justify-between">
              Custom Content Type
            </div>
            <div className="w-full text-sm p-2 rounded bg-[#111] mb-4 text-red-300">
              Warning, this can make your ordinal display incorrectly. Use UTF8
              content types only. Do not change this unless you&apos;re sure
              this is what you need to do. Some examples:
              <ul className="list-disc list-inside mt-4">
                <li>text/markdown</li>
                <li>text/css</li>
                <li>application/json</li>
                <li>application/javascript</li>
              </ul>
            </div>
            <input
              className="text-white w-full rounded p-2 text-sm"
              type="text"
              placeholder={"text/markdown"}
              value={customContentType || ""}
              onChange={changeContentType}
            />
          </label>
        </div>
      )}

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
