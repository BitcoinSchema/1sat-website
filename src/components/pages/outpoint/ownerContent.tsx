"use client";

import JDenticon from "@/components/JDenticon";
import { WalletTab } from "@/components/Wallet/tabs";
import CancelListingModal from "@/components/modal/cancelListing";
import TransferBsv20Modal from "@/components/modal/transferBsv20";
import { toastErrorProps } from "@/constants";
import { ordPk, payPk, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Listing } from "@/types/bsv20";
import type { OrdUtxo } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import { useIDBStorage } from "@/utils/storage";
import { PrivateKey, Script, Utils } from "@bsv/sdk";
import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import {
  type BurnMAP,
  type BurnOrdinalsConfig,
  type MAP,
  type Payment,
  type SendOrdinalsConfig,
  type SendUtxosConfig,
  type Utxo,
  burnOrdinals,
  sendOrdinals,
  sendUtxos,
} from "js-1sat-ord";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { FaFire, FaPaperPlane } from "react-icons/fa6";
import { toBitcoin } from "satoshi-token";
const { toBase58Check } = Utils;

const OwnerContent = ({ artifact }: { artifact: OrdUtxo }) => {
  useSignals();

  const [pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    [],
  );
  const showCancelModal = useSignal(false);
  const showSendModal = useSignal<string | undefined>(undefined);
  const router = useRouter();

  const address = useMemo(() => {
    const script = Script.fromBinary(Utils.toArray(artifact.script, "base64"));
    const pubkeyHash = script.chunks[2].data;
    if (!pubkeyHash || pubkeyHash.length !== 20) {
      return undefined;
    }
    return toBase58Check(pubkeyHash);
  }, [artifact]);

  const isUtxo = computed(() => {
    return !!(
      artifact.origin === null &&
      artifact.data === null &&
      artifact.spend === "" &&
      artifact.satoshis > 1 &&
      address === ordAddress.value
    );
  });

  const isRun = computed(() => {
    return !!artifact.origin?.outpoint && !artifact.origin.data && artifact.satoshis === 1
  });

  console.log({ address, artifact, ordAddress: ordAddress.value, isUtxo: isUtxo.value, isRun: isRun.value })
  const transferOrdinal = useCallback(
    async (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      to: string,
      meta: MAP | undefined,
    ) => {

      // const paymentUtxo = (utxos.value || []).sort(
      // 	(a, b) => b.satoshis - a.satoshis,
      // )[0];

      const artifactUtxo = {
        txid: artifact.txid,
        vout: artifact.vout,
        satoshis: artifact.satoshis,
        script: artifact.script,
      } as Utxo;

      if (to === ordAddress.value && !meta) {
        alert("Cannot send to self");
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

      const paymentUtxos = utxos.value;
      if (!paymentUtxos) {
        toast.error("No payment utxos", toastErrorProps);
        return;
      }

      const sendOrdinalsConfig: SendOrdinalsConfig = {
        paymentUtxos,
        ordinals: [artifactUtxo],
        paymentPk: PrivateKey.fromWif(payPk.value),
        ordPk: PrivateKey.fromWif(ordPk.value),
        destinations: [{ address: to }],
      };
      if (meta) {
        sendOrdinalsConfig.metaData = meta;
      }

      // console.log({ artifactUtxo, paymentUtxos });
      const { tx, spentOutpoints, payChange } =
        await sendOrdinals(sendOrdinalsConfig);

      setPendingTxs([{
        rawTx: tx.toHex(),
        fee: tx.getFee(),
        txid: tx.id("hex"),
        spentOutpoints,
        payChange,
        metadata: meta,
        returnTo: "/wallet/ordinals",
      } as PendingTransaction,
      ]);

      router.push("/preview");

      return;
    },
    [artifact.txid, artifact.vout, artifact.satoshis, artifact.script, ordAddress.value, payPk.value, ordPk.value, fundingAddress.value, utxos.value, setPendingTxs, router],
  );

  const recover = useCallback(
    async (address: string, utxo: Utxo) => {
      if (!ordPk.value) {
        return;
      }

      if (!utxos.value) {
        toast.error("No utxos", toastErrorProps);
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

      const paymentPk = PrivateKey.fromWif(ordPk.value);
      // intentionally keep payments empty, we get the change back
      const payments: Payment[] = [];
      const config: SendUtxosConfig = {
        utxos: [utxo],
        paymentPk,
        payments,
        changeAddress: address,
      };

      const { tx, spentOutpoints, payChange } = await sendUtxos(config);
      const rawTx = tx.toHex();
      setPendingTxs([
        {
          rawTx,
          size: Math.ceil(rawTx.length / 2),
          fee: 20,
          numInputs: tx.inputs.length,
          numOutputs: tx.outputs.length,
          txid: tx.id("hex"),
          spentOutpoints,
          payChange,
          returnTo: "/",
        },
      ]);

      router.push("/preview");
    },
    [ordPk.value, utxos.value, setPendingTxs, router],
  );

  const burnOrdinal = useCallback(
    async (
      e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      meta: BurnMAP,
    ) => {
      if (!ordPk.value) {
        toast.error("No ord key", toastErrorProps);
        return;
      }
      console.log("burning ordinal", artifact);
      const burnOrdinalsConfig: BurnOrdinalsConfig = {
        ordinals: [
          {
            txid: artifact.txid,
            vout: artifact.vout,
            satoshis: artifact.satoshis,
            script: artifact.script,
          },
        ],
        ordPk: PrivateKey.fromWif(ordPk.value),
        metaData: meta,
      };
      const { tx, spentOutpoints } = await burnOrdinals(burnOrdinalsConfig);

      setPendingTxs([
        {
          rawTx: tx.toHex(),
          fee: tx.getFee(),
          txid: tx.id("hex"),
          metadata: meta,
          size: tx.toBinary().length,
          numInputs: tx.inputs.length,
          numOutputs: tx.outputs.length,
          spentOutpoints,
          returnTo: "/wallet/ordinals",
        } as PendingTransaction,
      ]);

      router.push("/preview");

      console.log({ tx });
    },
    [artifact, ordPk.value, router, setPendingTxs],
  );

  const recoverUtxo = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      console.log("recover utxo");
      const artifactUtxo = {
        txid: artifact.txid,
        vout: artifact.vout,
        satoshis: artifact.satoshis,
        script: artifact.script,
      } as Utxo;

      if (!fundingAddress.value) {
        console.log("No funding address");
        return;
      }

      await recover(fundingAddress.value, artifactUtxo);

      return;
    },
    [artifact, recover, fundingAddress.value],
  );

  console.log("script", Buffer.from("dqkUU0wSTSHRRED/Yg1SeW4PDsSSHouIrA==", 'base64').toString('hex'))

  return (
    <div>
      <div className="flex items-center">
        <JDenticon hashOrValue={artifact.owner} className="mr-2 w-10 h-10" />
        <div className="flex flex-col">
          <div className="text-lg">{artifact.owner}</div>
          <div className="text-sm text-[#aaa] mb-4">
            {artifact.owner === ordAddress.value ? "You own this item" : ""}
          </div>
        </div>
      </div>
      {artifact.owner === ordAddress.value && (
        <div>
          {isUtxo.value ? (
            <div className="bg-warning text-warning-content rounded p-4">
              <p>
                This appears to be a spendable UTXO output without an
                inscription. This was probably sent to your Ordinals address by
                mistake.
              </p>
              <p>Do you want to transfer it to your funding address?</p>
              <div className="modal-action">
                <button
                  type="button"
                  disabled={!!artifact.spend && artifact.spend !== ""}
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
              disabled={!!artifact.data?.list && (!!artifact.spend && artifact.spend !== "")}
              type="button"
              className="btn disabled:text-[#555] my-2"
              onClick={(e) => {
                // if its a bsv20, transfer with a different function
                if (artifact.data?.bsv20) {
                  alert("Transfer BSV20 tokens from your wallet page");
                  router.push(
                    `/wallet/${artifact.data.bsv20.id ? "bsv21" : "bsv20"}`,
                  );
                  // showSendModal.value = artifact.data?.bsv20.tick || artifact.data?.bsv20.id;
                  return;
                }
                const to = window.prompt(
                  "Enter the address to send the ordinal to",
                );
                if (!to) {
                  return;
                }
                const meta: MAP | undefined = undefined;
                // let addMoreTags = true;

                // while (addMoreTags) {
                // 	if (!meta) {
                // 		const typeStr = window.prompt(
                // 			"Enter the MAP type for this transaction (required)",
                // 		);
                // 		if (!typeStr) {
                // 			alert("Type is required");
                // 			return;
                // 		}
                // 		meta = {
                // 			app: "1sat.market",
                // 			type: typeStr,
                // 		};
                // 	}

                // 	const metaKeyStr = window.prompt("Enter the meta key");
                // 	if (!metaKeyStr) {
                // 		addMoreTags = false;
                // 		break;
                // 	}

                // 	const metaValueStr = window.prompt("Enter the meta value");
                // 	if (!metaValueStr) {
                // 		addMoreTags = false;
                // 		break;
                // 	}

                // 	if (metaKeyStr && metaValueStr) {
                // 		meta[metaKeyStr] = metaValueStr;
                // 	}

                // 	addMoreTags = window.confirm(
                // 		"Add another tag to this transaction?",
                // 	);
                // }

                // Call transferOrdinal even if the user cancels adding more tags
                transferOrdinal(e, to, meta);
              }}
            >
              <FaPaperPlane className="w-4 mr-1" />
              Send Ordinal
            </button>
          )}

          {!isUtxo.value && (
            <button
              type="button"
              disabled={!!artifact.spend && artifact.spend !== ""}
              className="btn btn-error my-2 ml-2"
              onClick={(e) => {
                if (artifact.data?.bsv20) {
                  alert("Burn BSV20 tokens from your wallet page");
                  router.push(
                    `/wallet/${artifact.data.bsv20.id ? "bsv21" : "bsv20"}`,
                  );
                  return;
                }

                const meta: BurnMAP = {
                  app: "1sat.market",
                  type: "ord",
                  op: "burn",
                };

                const confirm = window.confirm(
                  "Are you sure you want to burn this ordinal?",
                );
                if (!confirm) {
                  return;
                }

                burnOrdinal(e, meta);
              }}
            >
              <FaFire className="w-4 mr-1" /> Burn Ordinal
            </button>
          )}
        </div>
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
      {showSendModal.value !== undefined &&
        showSendModal.value ===
        (artifact.data?.bsv20?.tick || artifact.data?.bsv20?.id) && (
          <TransferBsv20Modal
            onClose={() => {
              showSendModal.value = undefined;
            }}
            type={artifact.data?.bsv20?.id ? WalletTab.BSV21 : WalletTab.BSV20}
            id={
              (artifact.data?.bsv20?.tick || artifact.data?.bsv20?.id) as string
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
