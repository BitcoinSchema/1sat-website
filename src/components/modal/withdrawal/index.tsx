"use client";

import { SATS_PER_KB, toastErrorProps } from "@/constants";
import { payPk, utxos } from "@/signals/wallet";
import type { PendingTransaction } from "@/types/preview";
import { useIDBStorage } from "@/utils/storage";
import { PrivateKey } from "@bsv/sdk";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  type Payment,
  type SendUtxosConfig,
  type Utxo,
  sendUtxos,
} from "js-1sat-ord";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { Loader2, Upload } from "lucide-react";
import { toBitcoin, toSatoshi } from "satoshi-token";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DespotModalProps {
  onClose: () => void;
  amount?: number;
  address?: string;
}

const WithdrawalModal: React.FC<DespotModalProps> = ({
  amount: amt,
  address: addr,
  onClose,
}) => {
  useSignals();
  const router = useRouter();

  const [pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    [],
  );
  const amount = useSignal(amt?.toString());
  const address = useSignal(addr || "");

  const balance = computed(() => {
    if (!utxos.value) {
      return 0;
    }
    const amt = utxos.value.reduce(
      (acc, utxo) => acc + (utxo.satoshis || 0),
      0,
    );
    return Number.isNaN(amt) ? 0 : amt;
  });

  const setAmountToBalance = useCallback(() => {
    amount.value = `${balance.value > 0 ? toBitcoin(balance.value) : 0}`;
    console.log(amount.value);
  }, [amount, balance.value]);

  const send = useCallback(
    async (address: string, satoshis: number) => {
      if (!payPk.value) {
        return;
      }

      if (!address?.startsWith("1")) {
        console.error("inivalid receive address");
        return;
      }
      toast(`Sending to ${address}`, {
        style: {
          background: "#333",
          color: "#fff",
          fontSize: "0.8rem",
        },
      });

      if (!utxos.value || !utxos.value.length) {
        toast.error("No utxos to send", toastErrorProps);
      }

      const paymentPk = PrivateKey.fromWif(payPk.value);
      const payments: Payment[] = [
        {
          to: address,
          amount: satoshis,
        },
      ];
      const sendConfig: SendUtxosConfig = {
        utxos: utxos.value as Utxo[],
        paymentPk,
        payments,
        satsPerKb: SATS_PER_KB,
      };
      try {
        const { tx, spentOutpoints, payChange } = await sendUtxos(sendConfig);
        const rawTx = tx.toHex();
        setPendingTxs([
          {
            rawTx,
            size: Math.ceil(rawTx.length / 2),
            fee: tx.getFee(),
            numInputs: tx.inputs.length,
            numOutputs: tx.outputs.length,
            txid: tx.id("hex"),
            spentOutpoints,
            payChange,
          },
        ]);

        router.push("/preview");
        if (onClose) {
          onClose();
        }
      } catch (e) {
        toast.error("Error creating tx", toastErrorProps);
      }
    },
    [payPk.value, utxos.value, setPendingTxs, router, onClose],
  );

  const submit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      console.log({ e });
      e.preventDefault();
      if (!amount.value || !address.value) {
        return;
      }
      if (toSatoshi(amount.value) > balance.value) {
        toast.error("Not enough Bitcoin!", toastErrorProps);
        return;
      }

      // // check if address is valid @1sat.app paymail address
      // if (address.value.includes("@1sat.app")) {
      // 	// try to resolve paymail address to bitcoin address
      // 	// POST https://opns-paymail-production.up.railway.app/v1/bsvalias/p2p-payment-destination/shruggr@1sat.app

      // 	//const url = `https://opns-paymail-production.up.railway.app/v1/bsvalias/p2p-payment-destination/${address.value}`;
      //   const handle = address.value.split('@')[0];
      //   const url = `https://ordinals.gorillapool.io/api/opns/${handle}`
      // 	// const headers = {
      // 	// 	Accept: "application/json",
      // 	// 	"Content-Type": "application/json",
      // 	// };
      // 	const resp = await fetch(url, {
      // 		// headers,
      // 		// method: "POST",
      // 		// body: JSON.stringify({
      // 		// 	satoshis: toSatoshi(amount.value),
      // 		// }),
      // 	});
      // 	type PaymailResponse = {
      // 		outputs: {
      // 			satoshis: number;
      // 			script: string;
      // 		}[];
      // 		reference: string;
      // 	};
      //   // {
      //   //   "outpoint": "d10057af8e5365d259a3401b542ca94f9a210f8ff8dd04346b0d3661bf46b84b_2",
      //   //   "origin": "d10057af8e5365d259a3401b542ca94f9a210f8ff8dd04346b0d3661bf46b84b_2",
      //   //   "domain": "shruggr",
      //   //   "owner": "1MUqT79bq5xbNWHbb96qvv12U56WN8oiyr",
      //   //   "map": null
      //   // }
      //   type OpNSResponse = {
      //     outpoint: string;
      //     origin: string;
      //     domain: string;
      //     owner: string;
      //     map: null;
      //   }
      // 	const json = (await resp.json()) as OpNSResponse;
      // 	console.log(json);

      //   address.value = json.owner;

      // 	// get address from script
      // 	// const s = json.outputs[0].script;
      // 	// const script = Script.from_hex(s).to_asm_string();
      // 	// const pubKeyHash = script.split(" ")[2];
      // 	// address.value = P2PKHAddress.from_pubkey_hash(
      // 	// 	Buffer.from(pubKeyHash, "hex"),
      // 	// ).to_string();

      // 	// later this will return
      // 	//   {
      // 	//     "outputs": [
      // 	//         {
      // 	//             "satoshis": 1,
      // 	//             "script": "76a914e0a630d5395b510c5ce3647b12cafe2c9dc8b1a988ac"
      // 	//         }
      // 	//     ],
      // 	//     "reference": "1234567890"
      // 	// }
      // 	// which is OP_DUP OP_HASH160 e0a630d5395b510c5ce3647b12cafe2c9dc8b1a9 OP_EQUALVERIFY OP_CHECKSIG
      // 	return;
      // }

      console.log(amount.value, address.value);
      await send(address.value, toSatoshi(amount.value));
    },
    [amount.value, address.value, balance.value, send],
  );

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between w-full font-mono text-lg uppercase tracking-widest text-zinc-200">
            <span className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-green-500" />
              Withdraw
            </span>
            {balance.value !== undefined ? (
              <button
                type="button"
                className="text-xs font-mono text-zinc-500 hover:text-green-400 transition cursor-pointer"
                onClick={setAmountToBalance}
              >
                Balance: {balance.value > 0 ? toBitcoin(balance.value) : 0} BSV
              </button>
            ) : (
              <Loader2 className="animate-spin w-4 h-4 text-zinc-500" />
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              Amount
            </Label>
            <Input
              type="text"
              placeholder="0.00000000"
              className="bg-zinc-900 border-zinc-800 rounded-none font-mono text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-green-500"
              value={amount.value || ""}
              onChange={(e) => {
                if (
                  e.target.value === "" ||
                  Number.parseFloat(e.target.value) <= balance.value
                ) {
                  amount.value = e.target.value;
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              Address
            </Label>
            <Input
              type="text"
              placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
              className="bg-zinc-900 border-zinc-800 rounded-none font-mono text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-green-500"
              value={address.value}
              onChange={(e) => {
                address.value = e.target.value;
              }}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <Button
              type="submit"
              disabled={
                Number.parseFloat(amount.value || "0") <= 0 || !address.value
              }
              className="rounded-none bg-green-900/30 text-green-400 border border-green-500/50 hover:bg-green-900/50 font-mono uppercase tracking-wider text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalModal;
