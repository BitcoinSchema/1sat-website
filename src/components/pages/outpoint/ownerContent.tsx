"use client";

import JDenticon from "@/components/JDenticon";
import { WalletTab } from "@/components/Wallet/tabs";
import CancelListingModal from "@/components/modal/cancelListing";
import TransferBsv20Modal from "@/components/modal/transferBsv20";
import {
  bsvWasmReady,
  ordPk,
  payPk,
  pendingTxs,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Listing } from "@/types/bsv20";
import type { OrdUtxo } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import { sendOrdinal, type Utxo } from "@/utils/js-1sat-ord";
import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { toBitcoin } from "satoshi-bitcoin-ts";

const OwnerContent = ({ artifact }: { artifact: OrdUtxo }) => {
  useSignals();
  const showCancelModal = useSignal(false);
  const showSendModal = useSignal<string | undefined>(undefined);
  const router = useRouter();

  // TODO: Check the destination address matches the ordAddress

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const address = useMemo(() => {
    if (bsvWasmReady.value === false) {
      return "";
    }
    const script = Script.from_bytes(
      Buffer.from(artifact.script, "base64")
    );
    const pubkeyHash = script.to_asm_string().split(" ")[2];
    if (!pubkeyHash) {
      return undefined;
    }
    const buff = Buffer.from(pubkeyHash, "hex");
    if (!buff || buff.length !== 20) {
      return undefined;
    }

    const address = P2PKHAddress.from_pubkey_hash(buff);

    return address.to_string();
  }, [artifact, bsvWasmReady.value]);

  const isUtxo = computed(() => {
    return !!(
      artifact.origin === null &&
      artifact.data === null &&
      artifact.spend === "" &&
      artifact.satoshis > 1 &&
      address === ordAddress.value
    );
  });

  const transferOrdinal = useCallback(
    async (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      to: string
    ) => {
      console.log("transferOrdinal");

      const paymentUtxo = (utxos.value || []).sort(
        (a, b) => b.satoshis - a.satoshis
      )[0];

      const scriptAsm = Script.from_bytes(
        Buffer.from(artifact.script, "base64")
      ).to_asm_string();
      const artifactUtxo = {
        txid: artifact.txid,
        vout: artifact.vout,
        satoshis: artifact.satoshis,
        script: scriptAsm,
      } as Utxo;

      if (to === ordAddress.value) {
        console.log("Cannot send to self");
        return;
      }

      if (!payPk.value || !ordPk.value) {
        console.log("No private key");
        return;
      }

      if (!fundingAddress.value) {
        console.log("No funding address");
        return;
      }

      const tx = await sendOrdinal(
        paymentUtxo,
        artifactUtxo,
        PrivateKey.from_wif(payPk.value),
        fundingAddress.value,
        0.05,
        PrivateKey.from_wif(ordPk.value),
        to,
        undefined,
        undefined,
        undefined
      );

      pendingTxs.value = [
        {
          rawTx: tx.to_hex(),
          fee: 0,
          txid: tx.get_id_hex(),
        } as PendingTransaction,
      ];

      router.push("/preview");

      return;
    },
    [artifact, router, pendingTxs.value, ordPk.value, payPk.value]
  );

  const recover = useCallback(
    async (address: string, utxo: Utxo) => {
      if (!ordPk.value) {
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

      const feeSats = 20;
      const paymentPk = PrivateKey.from_wif(ordPk.value);
      const tx = new Transaction(1, 0);

      tx.add_output(
        new TxOut(
          BigInt(utxo.satoshis - feeSats),
          P2PKHAddress.from_string(address).get_locking_script()
        )
      );

      // build txins from our UTXOs
      let idx = 0;
      let totalSats = 0;
      const u = utxo;
      console.log({ u });
      const inx = new TxIn(
        Buffer.from(u.txid, "hex"),
        u.vout,
        Script.from_asm_string("")
      );
      console.log({ inx });
      inx.set_satoshis(BigInt(u.satoshis));
      tx.add_input(inx);

      const sig = tx.sign(
        paymentPk,
        SigHash.InputOutputs,
        idx,
        Script.from_asm_string(u.script),
        BigInt(u.satoshis)
      );

      console.log({ sig: sig.to_hex() });

      inx.set_unlocking_script(
        Script.from_asm_string(
          `${sig.to_hex()} ${paymentPk.to_public_key().to_hex()}`
        )
      );

      tx.set_input(idx, inx);
      idx++;

      totalSats += u.satoshis;

      const rawTx = tx.to_hex();
      // const { rawTx, fee, size, numInputs, numOutputs } = resp;

      pendingTxs.value = [
        {
          rawTx,
          size: Math.ceil(rawTx.length / 2),
          fee: 20,
          numInputs: tx.get_ninputs(),
          numOutputs: tx.get_noutputs(),
          txid: tx.get_id_hex(),
          inputTxid: tx.get_input(0)!.get_prev_tx_id_hex(),
        },
      ];

      router.push("/preview");
    },
    [router, pendingTxs.value, ordPk.value]
  );

  const recoverUtxo = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      console.log("recover utxo");

      const b64Script = artifact.script;

      const asmScript = Script.from_bytes(
        Buffer.from(b64Script, "base64")
      ).to_asm_string();

      const artifactUtxo = {
        txid: artifact.txid,
        vout: artifact.vout,
        satoshis: artifact.satoshis,
        script: asmScript,
      } as Utxo;

      if (!fundingAddress.value) {
        console.log("No funding address");
        return;
      }

      await recover(fundingAddress.value, artifactUtxo);

      return;
    },
    [artifact, recover, fundingAddress.value]
  );

  return (
    <div>
      <div className="flex items-center">
        <JDenticon
          hashOrValue={artifact.owner}
          className="mr-2 w-10 h-10"
        />
        <div className="flex flex-col">
          <div className="text-lg">{artifact.owner}</div>
          <div className="text-sm text-[#aaa] mb-4">
            {artifact.owner === ordAddress.value
              ? "You own this item"
              : ""}
          </div>
        </div>
      </div>

      {isUtxo.value ? (
        <div className="bg-warning text-warning-content rounded p-4">
          <p>
            This appears to be a spendable UTXO output without an
            inscription. This was probably sent to your Ordinals
            address by mistake.
          </p>
          <p>Do you want to transfer it to your funding address?</p>
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={(e) => {
                recoverUtxo(e);
              }}
            >
              Recover {toBitcoin(artifact.satoshis)} BSV
            </button>
          </div>
        </div>
      ) : (
        <button
          disabled={!!artifact.data?.list}
          type="button"
          className="btn disabled:text-[#555] my-2"
          onClick={(e) => {
            // if its a bsv20, transfer with a different function
            if (artifact.data?.bsv20) {
              alert(
                "Transfer BSV20 tokens from your wallet page"
              );
              router.push(
                `/wallet/${artifact.data.bsv20.id ? "bsv21" : "bsv20"
                }`
              );
              // showSendModal.value = artifact.data?.bsv20.tick || artifact.data?.bsv20.id;
              return;
            }
            const to = window.prompt(
              "Enter the address to send the ordinal to"
            );
            if (!to) {
              return;
            }
            transferOrdinal(e, to);
          }}
        >
          Send Ordinal
        </button>
      )}

      {/* <button
				type="button"
				className="btn"
				onClick={() => {
					showCancelModal.value = true;
				}}
			>
				Cancel Listing
			</button> */}

      {artifact && showCancelModal.value && (
        <CancelListingModal
          onClose={() => {
            showCancelModal.value = false;
          }}
          onCancelled={(newOutpoint) => {
            console.log("listing cancelled");
            showCancelModal.value = false;
            router.push(`/outpoint/${newOutpoint}`);
          }}
          listing={artifact as Listing}
        />
      )}
      {showSendModal.value !== undefined && showSendModal.value ===
        (artifact.data?.bsv20?.tick || artifact.data?.bsv20?.id) && (
          <TransferBsv20Modal
            onClose={() => {
              showSendModal.value = undefined
            }}
            type={
              artifact.data?.bsv20?.id
                ? WalletTab.BSV21
                : WalletTab.BSV20
            }
            id={
              (artifact.data?.bsv20?.tick ||
                artifact.data?.bsv20?.id)!
            }
            dec={artifact.data?.bsv20?.dec || 0}
            balance={Number.parseInt(artifact.data?.bsv20?.amt || "0")}
            sym={artifact.data?.bsv20?.sym}
          />
        )}
    </div>
  );
};

export default OwnerContent;
