"use client";

import { WalletTab } from "@/components/Wallet/tabs";
import { API_HOST, toastErrorProps } from "@/constants";
import {
  ordPk,
  payPk,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { setPendingTxs } from "@/signals/wallet/client";
import type { Ticker } from "@/types/bsv20";
import type { PendingTransaction } from "@/types/preview";
import * as http from "@/utils/httpClient";
import { PrivateKey } from "@bsv/sdk";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { type Distribution, fetchTokenUtxos, type Payment, TokenType, type TokenUtxo, transferOrdTokens, type TransferOrdTokensConfig, type Utxo } from "js-1sat-ord";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";

interface TransferModalProps {
  onClose: () => void;
  amount?: number;
  address?: string;
  type: WalletTab;
  dec: number;
  id: string;
  balance: number;
  sym?: string;
  burn?: boolean;
}

const TransferBsv20Modal: React.FC<TransferModalProps> = ({
  type,
  balance,
  sym,
  id,
  amount: amt,
  dec,
  address: addr,
  onClose,
  burn
}) => {
  useSignals();
  const router = useRouter();
  // use signal for amount and address
  const amount = useSignal(amt?.toString());
  const address = useSignal(addr || "");

  const setAmountToBalance = useCallback(() => {
    amount.value = balance.toString();
    console.log(amount.value);
  }, [amount, balance]);

  const transferBsv20 = useCallback(
    async (
      sendAmount: number,
      paymentUtxos: Utxo[],
      inputTokens: TokenUtxo[],
      paymentPk: PrivateKey,
      changeAddress: string,
      ordPk: PrivateKey,
      ordAddress: string,
      payoutAddress: string,
      ticker: Ticker
    ): Promise<PendingTransaction> => {
      const distributions: Distribution[] = [{
        address: burn ? changeAddress : payoutAddress,
        amt: sendAmount
      }]

      const additionalPayments: Payment[] = [{
        to: ticker.fundAddress,
        amount: 2000, // 1000 * 2 inscriptions
      }]

      const config: TransferOrdTokensConfig = {
        protocol: ticker.tick ? TokenType.BSV20 : TokenType.BSV21,
        tokenID: (ticker.tick || ticker.id) as string,
        utxos: paymentUtxos,
        inputTokens,
        distributions,
        changeAddress: ordAddress,
        paymentPk,
        ordPk,
        additionalPayments,
        decimals: ticker.dec || 0,
      }
      console.log({ config })
      const { tx, spentOutpoints, tokenChange, payChange } = await transferOrdTokens(config)

      return {
        rawTx: tx.toHex(),
        size: tx.toBinary().length,
        fee: tx.getFee(),
        numInputs: tx.inputs.length,
        numOutputs: tx.outputs.length,
        txid: tx.id('hex'),
        spentOutpoints,
        payChange,
        tokenChange,
        marketFee: 0,
      };
    },
    [burn]
  );

  const submit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!ordAddress.value || !ordPk.value || !payPk.value || !fundingAddress.value) {
        toast.error("Missing keys", toastErrorProps);
        return;
      }
      if (!amount.value || (!address.value && !burn)) {
        toast.error("Missing amount or address", toastErrorProps);
        return;
      }
      if (!utxos.value || !utxos.value.length) {
        toast.error("No UTXOs", toastErrorProps);
        return;
      }

      if (Number.parseFloat(amount.value) > balance) {
        toast.error("Not enough Bitcoin!", toastErrorProps);
        return;
      }


      console.log(amount.value, address.value);
      // const amt = Math.floor(Number.parseFloat(amount.value) * 10 ** dec);
      // const bsv20TxoUrl = `${API_HOST}/api/bsv20/${ordAddress.value}/${
      // 	type === WalletTab.BSV20 ? "tick" : "id"
      // }/${id}?listing=false`;
      // const { promise } = http.customFetch<BSV20TXO[]>(bsv20TxoUrl);
      // const bsv20Utxos = await promise;

      const tokenUtxos = await fetchTokenUtxos(type === WalletTab.BSV20 ? TokenType.BSV20 : TokenType.BSV21, id, ordAddress.value)

      const { promise: promiseTickerDetails } = http.customFetch<Ticker>(
        `${API_HOST}/api/bsv20/${type === WalletTab.BSV20 ? "tick" : "id"
        }/${id}`
      );
      const ticker = await promiseTickerDetails;
      const transferTx = await transferBsv20(
        Number(amount.value),
        utxos.value,
        tokenUtxos,
        PrivateKey.fromWif(payPk.value),
        fundingAddress.value,
        PrivateKey.fromWif(ordPk.value),
        ordAddress.value,
        address.value, // recipient ordinal address
        ticker,
      );
      setPendingTxs([transferTx]);

      router.push("/preview");
    },
    [ordAddress.value, ordPk.value, payPk.value, fundingAddress.value, amount.value, address.value, burn, utxos.value, balance, type, id, transferBsv20, router]
  );

  const placeholderText = useMemo(() => {
    // ex 0.0000000 if dec = 8
    return dec ? `0.${"0".repeat(dec)}` : "0";
  }, [dec]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen backdrop-blur	bg-black bg-opacity-50 overflow-hidden"
      onClick={() => onClose()}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="w-full max-w-lg m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col border border-yellow-200/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-64 md:h-full overflow-hidden mb-4">
          <form onSubmit={submit}>
            <div className="flex justify-between">
              <div className="text-lg font-semibold">
                {burn ? "Burn" : "Transfer"} {type === WalletTab.BSV20 ? id : sym}{" "}
                {type}
              </div>
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                className="text-xs cursor-pointer text-[#aaa]"
                onClick={setAmountToBalance}
              >
                Balance: {balance}{" "}
                {type === WalletTab.BSV20 ? id : sym}
              </div>
            </div>

            <div className="flex flex-col w-full">
              <label className="text-sm font-semibold text-[#aaa] mb-2">
                Amount
              </label>
              <input
                type="number"
                placeholder={placeholderText}
                max={balance}
                className="input input-bordered w-full"
                value={amount.value || undefined}
                onChange={(e) => {
                  if (
                    e.target.value === "" ||
                    Number.parseFloat(e.target.value) <=
                    balance
                  ) {
                    amount.value = e.target.value;
                  }
                }}
              />
            </div>
            {!burn && <div className="flex flex-col mt-4">
              <label className="text-sm font-semibold text-[#aaa] mb-2">
                Address
              </label>
              <input
                type="text"
                placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                className="input input-bordered w-full"
                value={(burn ? fundingAddress.value : address.value) || ""}
                onChange={(e) => {
                  address.value = e.target.value;
                }}
              />
            </div>}
            <div className="modal-action">
              <button
                type="submit"
                className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white"
              >
                {burn ? "Burn" : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransferBsv20Modal;

// export const buildInscriptionSafe = (
// 	destinationAddress: P2PKHAddress | string,
// 	b64File?: string | undefined,
// 	mediaType?: string | undefined,
// ): Script => {
// 	let ordAsm = "";
// 	// This can be omitted for reinscriptions that just update metadata
// 	if (b64File !== undefined && mediaType !== undefined) {
// 		const ordHex = toHex("ord");
// 		const fsBuffer = Buffer.from(b64File, "base64");
// 		const fireShardHex = fsBuffer.toString("hex");
// 		const fireShardMediaType = toHex(mediaType);
// 		ordAsm = `OP_0 OP_IF ${ordHex} OP_1 ${fireShardMediaType} OP_0 ${fireShardHex} OP_ENDIF`;
// 	}

// 	let address: P2PKHAddress;
// 	// normalize destinationAddress
// 	if (typeof destinationAddress === "string") {
// 		address = P2PKHAddress.from_string(destinationAddress);
// 	} else {
// 		address = destinationAddress;
// 	}
// 	// Create ordinal output and inscription in a single output
// 	const inscriptionAsm = `${address.get_locking_script().to_asm_string()}${
// 		ordAsm ? ` ${ordAsm}` : ""
// 	}`;

// 	return Script.from_asm_string(inscriptionAsm);
// };