"use client";

import {
  SCAM_ITEM_BLACKLIST,
  SCAM_LISTING_USER_BLACKLIST,
  indexerBuyFee,
  marketAddress,
  marketRate,
  minimumMarketFee,
} from "@/constants";
import { payPk, showUnlockWalletModal, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Listing } from "@/types/bsv20";
import type { OrdUtxo } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import { useIDBStorage } from "@/utils/storage";
import { PrivateKey } from "@bsv/sdk";
import { useSignals } from "@preact/signals-react/runtime";
import {
  type ExistingListing,
  type MAP,
  type Payment,
  type PurchaseOrdListingConfig,
  type PurchaseOrdTokenListingConfig,
  type Royalty,
  TokenType,
  type TokenUtxo,
  fetchPayUtxos,
  purchaseOrdListing,
  purchaseOrdTokenListing,
} from "js-1sat-ord";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { IoMdWarning } from "react-icons/io";
import { toBitcoin } from "satoshi-token";
interface BuyArtifactModalProps {
  onClose: () => void;
  listing: Listing | OrdUtxo;
  price: bigint;
  content: React.ReactNode;
  showLicense: boolean;
  indexerAddress?: string;
}

const BuyArtifactModal: React.FC<BuyArtifactModalProps> = ({
  onClose,
  listing,
  price,
  content,
  showLicense,
  indexerAddress,
}: BuyArtifactModalProps) => {
  console.log({ listing });
  // const { buyArtifact } = useOrdinals();
  useSignals();
  const router = useRouter();

  const [pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    [],
  );

  const handleUnlockWallet = (e: React.FormEvent) => {
    e.preventDefault();
    showUnlockWalletModal.value = true;
    onClose();
  };

  const buyArtifact = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // I1 - Ordinal
      // I2 - Funding
      // O1 - Ordinal destination
      // O2 - Payment to lister
      // O3 - Market Fee
      // O4 - Change

      // detailed log
      console.log(
        "Buying artifact",
        listing,
        price,
        fundingAddress.value,
        ordAddress.value,
      );

      if (!fundingAddress.value) {
        console.error("no funding address");
        return;
      }

      if (!ordAddress.value) {
        console.error("no funding address");
        return;
      }

      if (!payPk.value) {
        console.error("no pay pk");
        return;
      }

      // get fresh utxos
      const fundingUtxos = await fetchPayUtxos(fundingAddress.value);
      utxos.value = fundingUtxos;

      const existingListing: ExistingListing = {
        payout: ((listing as Listing).payout ||
          (listing as OrdUtxo).data?.list?.payout) as string,
        listingUtxo: {
          satoshis: listing.satoshis,
          txid: listing.txid,
          vout: listing.vout,
          script: listing.script,
        },
      };

      // calculate market fee
      let marketFee = Number(price) * marketRate;
      if (marketFee === 0) {
        marketFee = minimumMarketFee;
      }

      const additionalPayments: Payment[] = [
        {
          to: marketAddress,
          amount: Math.ceil(marketFee),
        },
      ];

      const metaData: MAP = {
        app: "1sat.market",
        type: "ord",
        op: "purchase",
      }

      const config: PurchaseOrdListingConfig = {
        utxos: fundingUtxos,
        paymentPk: PrivateKey.fromWif(payPk.value),
        listing: existingListing,
        ordAddress: ordAddress.value,
        additionalPayments,
        metaData,
      };

      if (listing.origin?.data?.map?.royalties) {
        const royalties = JSON.parse(
          listing.origin?.data?.map?.royalties,
        ) as Royalty[];
        if (royalties) {
          config.royalties = royalties;
          for (const royalty of royalties) {
            if (royalty.type === "paymail") {
              // TODO: resolve the paymail address, change the type to address

            }
          }
        }
      }

      const { tx, spentOutpoints, payChange } =
        await purchaseOrdListing(config);

      setPendingTxs([
        {
          rawTx: tx.toHex(),
          txid: tx.id("hex"),
          size: tx.toBinary().length,
          fee: tx.getFee(),
          numInputs: tx.inputs.length,
          numOutputs: tx.outputs.length,
          spentOutpoints,
          payChange,
          returnTo: "/market/ordinals",
        },
      ]);

      onClose();
      router.push("/preview");
    },
    [listing, price, fundingAddress.value, ordAddress.value, payPk.value, router, onClose],
  );

  const buyBsv20 = useCallback(async () => {
    if (!fundingAddress.value) {
      console.error("no funding address");
      return;
    }

    if (!ordAddress.value) {
      console.error("no funding address");
      return;
    }

    if (!payPk.value) {
      console.error("no pay pk");
      return;
    }

    if (!indexerAddress) {
      console.error("no indexer address");
      return;
    }

    // get fresh utxos
    const fundingUtxos = await fetchPayUtxos(fundingAddress.value);
    utxos.value = fundingUtxos;

    const tokenType = (listing as Listing).tick ? "bsv20" : "bsv21";
    const tickOrId = (listing as Listing).tick || (listing as Listing).id;

    const listingUtxo: TokenUtxo = {
      satoshis: 1,
      txid: listing.txid,
      vout: listing.vout,
      script: listing.script,
      amt: (listing as Listing).amt,
      id: tickOrId as string,
      payout: (listing as Listing).payout,
      price: Number.parseInt((listing as Listing).price),
      isListing: true,
    };

    // calculate market fee
    let marketFee = Number(price) * marketRate;
    if (marketFee === 0) {
      marketFee = minimumMarketFee;
    }

    const additionalPayments: Payment[] = [
      {
        to: marketAddress,
        amount: Math.ceil(marketFee),
      },
      {
        to: indexerAddress,
        amount: indexerBuyFee,
      },
    ];

    const metaData: MAP = {
      app: "1sat.market",
      type: "ord",
      op: "purchase",
    }

    const config: PurchaseOrdTokenListingConfig = {
      utxos: fundingUtxos,
      paymentPk: PrivateKey.fromWif(payPk.value),
      listingUtxo,
      ordAddress: ordAddress.value,
      additionalPayments,
      protocol: (listing as Listing).tick ? TokenType.BSV20 : TokenType.BSV21,
      tokenID: ((listing as Listing).tick
        ? (listing as Listing).tick
        : (listing as Listing).id) as string,
      metaData,
    };
    const { tx, spentOutpoints, payChange } =
      await purchaseOrdTokenListing(config);


    setPendingTxs([
      {
        rawTx: tx.toHex(),
        txid: tx.id("hex"),
        size: tx.toBinary().length,
        fee: tx.getFee(),
        numInputs: tx.inputs.length,
        numOutputs: tx.outputs.length,
        spentOutpoints,
        payChange,
        returnTo: `/market/${tokenType}/${tickOrId}`,
      },
    ]);

    onClose();
    router.push("/preview");
  }, [
    fundingAddress.value,
    indexerAddress,
    listing,
    onClose,
    ordAddress.value,
    payPk.value,
    price,
    router,
  ]);

  const isBsv20Listing =
    (listing as Listing).tick !== undefined ||
    (listing as Listing).id !== undefined;

  const scamListing = useMemo(
    () =>
      !!listing.origin?.outpoint &&
      SCAM_ITEM_BLACKLIST.includes(listing.origin.outpoint),
    [listing],
  );

  const knownScammer = useMemo(() => {
    return listing.owner && listing.owner && SCAM_LISTING_USER_BLACKLIST.some((u) => u.address === listing.owner)
  }, [listing.owner]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="z-[60] flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 overflow-hidden"
      onClick={() => onClose()}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="w-full max-w-lg m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-64 md:h-96 overflow-hidden modal-content">
          {content}
        </div>
        {scamListing && (
          <div className="rounded mb-4 p-2 text-xs text-red-200">
            <h1>FLAGGED</h1>
            <IoMdWarning className="inline-block mr-2" />
            This item has been identified as potentially inauthentic, or a duplicate of an original work and is not available for purchase.
          </div>
        )}
        {knownScammer && (
          <div className="rounded mb-4 p-2 text-xs text-red-200">
            <h1>FLAGGED</h1>
            <IoMdWarning className="inline-block mr-2" />
            This seller has been identified as a known scammer and their listings are not available for purchase.
          </div>
        )}
        {!scamListing && showLicense && (
          <div className="rounded mb-4 p-2 text-xs text-[#777]">
            <h1>License</h1>
            <IoMdWarning className="inline-block mr-2" />
            You are about to purchase this inscription, granting you ownership
            and control of the associated token. This purchase does not include
            a license to any artwork or IP that may be depicted here and no
            rights are transferred to the purchaser unless specified explicitly
            within the transaction itself.
          </div>
        )}
        <form
          className="modal-action"
        >
          {!scamListing && <button
            type="button"
            onClick={ordAddress.value
              ? isBsv20Listing
                ? buyBsv20
                : buyArtifact
              : handleUnlockWallet}
            className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#222]"
          >
            {"Buy -"}{" "}
            {price && price > 0
              ? price > 1000
                ? `${toBitcoin(price.toString())} BSV`
                : `${price} sat`
              : 0}
          </button>}
        </form>
      </div>
    </div>
  );
};

export default BuyArtifactModal;
