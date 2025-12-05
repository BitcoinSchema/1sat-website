"use client";

import { WalletTab } from "@/components/Wallet/tabs";
import { API_HOST, SATS_PER_KB, toastErrorProps } from "@/constants";
import {
  ordPk,
  payPk,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Ticker } from "@/types/bsv20";
import type { PendingTransaction } from "@/types/preview";
import * as http from "@/utils/httpClient";
import { useIDBStorage } from "@/utils/storage";
import { PrivateKey } from "@bsv/sdk";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { type Distribution, type Payment, TokenInputMode, TokenSelectionStrategy, TokenType, type TokenUtxo, type TransferOrdTokensConfig, type Utxo, fetchTokenUtxos, selectTokenUtxos, transferOrdTokens } from "js-1sat-ord";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Flame } from "lucide-react";

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

  const [_pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    [],
  );
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
      tokenUtxos: TokenUtxo[],
      paymentPk: PrivateKey,
      changeAddress: string,
      ordPk: PrivateKey,
      ordAddress: string,
      payoutAddress: string,
      ticker: Ticker
    ): Promise<PendingTransaction> => {
      const distributions: Distribution[] = [{
        address: burn ? changeAddress : payoutAddress,
        tokens: sendAmount
      }]

      const additionalPayments: Payment[] = [{
        to: ticker.fundAddress,
        amount: 2000, // 1000 * 2 inscriptions
      }]

      const { selectedUtxos: inputTokens } = selectTokenUtxos(tokenUtxos, sendAmount, ticker.dec || 0, {
        inputStrategy: TokenSelectionStrategy.SmallestFirst,
        outputStrategy: TokenSelectionStrategy.LargestFirst,
      })

      const config: TransferOrdTokensConfig = {
        protocol: ticker.tick ? TokenType.BSV20 : TokenType.BSV21,
        tokenID: (ticker.tick || ticker.id) as string,
        utxos: paymentUtxos,
        inputTokens,
        distributions,
        tokenChangeAddress: ordAddress,
        changeAddress,
        paymentPk,
        ordPk,
        additionalPayments,
        decimals: ticker.dec || 0,
        inputMode: TokenInputMode.Needed,
        splitConfig: {
          outputs: inputTokens.length === 1 ? 2 : 1,
          threshold: sendAmount,
        },
        satsPerKb: SATS_PER_KB,
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
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-background border-border rounded-lg max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between w-full font-mono text-lg uppercase tracking-widest text-foreground">
            <span className="flex items-center gap-3">
              {burn ? (
                <Flame className="w-5 h-5 text-orange-500" />
              ) : (
                <Send className="w-5 h-5 text-primary" />
              )}
              {burn ? "Burn" : "Transfer"} {type === WalletTab.BSV20 ? id : sym}
            </span>
            <button
              type="button"
              className="text-xs font-mono text-muted-foreground hover:text-primary transition cursor-pointer"
              onClick={setAmountToBalance}
            >
              Balance: {balance} {type === WalletTab.BSV20 ? id : sym}
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder={placeholderText}
              max={balance}
              step={dec ? `0.${"0".repeat(dec - 1)}1` : "1"}
              value={amount.value || ""}
              onChange={(e) => {
                const regex = new RegExp(`^\\d*\\.?\\d{0,${dec}}$`);
                if (!regex.test(e.target.value)) {
                  e.target.value = e.target.value.slice(0, -1);
                }
                if (
                  e.target.value === "" ||
                  Number.parseFloat(e.target.value) <= balance
                ) {
                  amount.value = e.target.value;
                }
              }}
            />
          </div>

          {!burn && (
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                type="text"
                placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                value={address.value || ""}
                onChange={(e) => {
                  address.value = e.target.value;
                }}
              />
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="submit"
              variant={burn ? "destructive" : "default"}
            >
              {burn ? "Burn" : "Send"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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