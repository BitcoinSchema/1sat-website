// InscribeButton.tsx
import { FetchStatus, toastErrorProps } from "@/constants";
import { ordPk, payPk, pendingTxs } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { getUtxos } from "@/utils/address";
import { inscribeFile } from "@/utils/inscribe";
import * as mime from "mime";
import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import type { MetaMap } from "./image";
import type { PreMAP } from "js-1sat-ord";

interface InscribeButtonProps {
  selectedFile: File | null;
  inscribeStatus: FetchStatus;
  selectedCollection: string | undefined;
  metadata: MetaMap[] | undefined;
  inscribedCallback: () => void;
}

const InscribeButton: React.FC<InscribeButtonProps> = ({
  selectedFile,
  inscribeStatus,
  selectedCollection,
  metadata,
  inscribedCallback,
}) => {
  const mapData = useMemo(() => {
    const md = metadata?.reduce((acc, curr) => {
      acc[curr.key] = curr.value as string;
      return acc;
    }, {} as { [key: string]: string });
    if (md) {
      md.app = "1sat.market";
      md.type = "ord";
      md.name = "Name Goes Here";
      if (selectedCollection) {
        md.subType = "collectionItem";
        md.subTypeData = JSON.stringify({
          collectionId: selectedCollection,
        });
      }
      return md;
    }
  // eslint-disable-next-line react-hooks-signals/exhaustive-deps-signals
  }, [metadata, selectedCollection]);

  const clickInscribe = useCallback(async () => {
    if (!selectedFile || !payPk.value || !ordPk.value || !ordAddress.value || !fundingAddress.value) {
      toast.error("Missing required fields", toastErrorProps);
      return;
    }

    const utxos = await getUtxos(fundingAddress.value);
    if (!utxos) {
      console.error("no utxo");
      return;
    }

    // metadata
    const m = metadata && Object.keys(metadata).length > 0 ? mapData : undefined;
    let file: File | undefined;
    if (selectedFile.type === "") {
      const newType = mime.getType(selectedFile.name);
      if (newType !== null) {
        file = new File([selectedFile], selectedFile.name, { type: newType });
      }
    }
    if (!file) {
      file = selectedFile;
    }
    const pendingTx = await inscribeFile(utxos, file, m as PreMAP);
    if (pendingTx) {
      pendingTxs.value = [pendingTx];
      inscribedCallback();
    }
  }, [selectedFile, payPk.value, ordPk.value, ordAddress.value, fundingAddress.value, metadata, mapData, inscribedCallback]);

  const submitDisabled = useMemo(() => {
    return !selectedFile || inscribeStatus === FetchStatus.Loading;
  }, [selectedFile, inscribeStatus]);

  return (
    <button
      disabled={submitDisabled}
      type="submit"
      onClick={clickInscribe}
      className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
    >
      {selectedCollection ? "Mint Collection Item" : "Inscribe Image"}
    </button>
  );
};

export default InscribeButton;