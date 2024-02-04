"use client";

import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import WithdrawalModal from "@/components/modal/withdrawal";
import { AssetType } from "@/constants";
import { minFee } from "@/utils/bsv20";
import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { MarketData } from "./list";

type IconProps = {
  alt: string;
  icon: string | null;
};

const IconWithFallback: React.FC<IconProps> = (props) => {
  const ref = useRef(null);
  const isInView = useInView(ref);
  const { icon, alt, ...rest } = props;
  const imgSrc = useSignal(icon ? `https://ordfs.network/${icon}` : oneSatLogo);

  return (
    <Image
      {...rest}
      ref={ref}
      alt={alt}
      src={imgSrc.value}
      onError={(e) => {
        imgSrc.value = oneSatLogo;
      }}
      onLoad={(e) => {
        e.currentTarget.classList.remove("opacity-0");
      }}
      width={100}
      height={100}
      className={`opacity-0 mr-2 w-6 h-6 rounded-lg transition`}
    />
  );
};

IconWithFallback;

const TickerHeading = ({
  ticker,
  id,
  type,
}: {
  ticker: MarketData;
  id?: string;
  type: AssetType;
}) => {
  useSignals();
  const router = useRouter();
  const showPaymentModal = useSignal(false);
  const change = computed(() => {
    // Check if there are any sales to calculate the change

    // Format the change for display, adding a plus sign for positive changes
    if (!ticker.pctChange || ticker.pctChange === 0) {
      return "0.00%";
    }
    return ticker.pctChange > 0
      ? `+${ticker.pctChange.toFixed(2)}%`
      : `${ticker.pctChange.toFixed(2)}%`;
    // Assuming 'change' should be used hereafter
  });

  //             src={`https://ordfs.network/${ticker.icon}`}

  // balance can be negative indicating a funding deficit
  // in this case fundUsed will be greater than fundTotal

  const openPaymentModal = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    // open modal
    showPaymentModal.value = true;
  };

  const paidUp = computed(() => bsvNeeded.value <= 0);

  const bsvNeeded = computed(() => {
    const satoshis = Math.max(
      minFee - Number(ticker.fundTotal),
      ticker.pendingOps * 1000
    );
    return toBitcoin(satoshis);
  });

  const supplyContent = computed(() => {
    const totalSupply = ticker.supply || ticker.amt;
    let text = `${parseInt(totalSupply!)?.toLocaleString()} `;
    if (type === AssetType.BSV20) {
      text += `/ ${parseInt(ticker.max!)?.toLocaleString()}`;
    }
    const mintedOut = parseInt(ticker.supply!) === parseInt(ticker.max!);
    return (
      <>
        {type === AssetType.BSV20 && <Link href={`/inscribe?tab=bsv20&tick=${ticker.tick}`}>
          <button
            disabled={!ticker.included || (mintedOut && type === AssetType.BSV20)}
            className="btn btn-sm btn-accent mr-4"
          >
            Mint {ticker.tick}
          </button>
        </Link>}
        <div data-tip="Circulating Supply" className="tooltip">
          {text}
        </div>
      </>
    );
  });

  return (
    <>
      <tr
        onClick={(e) => {
          if (id) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          router.push(`/market/${type}/${ticker.tick || ticker.id}`);
        }}
        className={`transition ${
          !!id
            ? "active text-xl text-base-content"
            : "cursor-pointer hover:text-secondary-content"
        }`}
      >
        <th className="truncase text-ellipsis">
          <div className="flex items-center">
            {type === AssetType.BSV20V2 && (
              <IconWithFallback
                icon={ticker.icon || null}
                alt={ticker.sym || ""}
              />
            )}
            {ticker.tick || ticker.sym}
          </div>
        </th>
        <td>
          {parseInt(ticker.price).toLocaleString()}{" "}
          <span className="text-accent">sat/token</span>
        </td>
        <td>
          <span
            className={`ml-2 ${
              ticker.pctChange > 0 ? "text-emerald-400" : "text-orange-700"
            }`}
          >
            {change}
          </span>
        </td>
        <td className="w-full text-right">
          {toBitcoin(parseInt(ticker.marketCap || "0"))} BSV
          <br />
        </td>
        <td className="break-normal text-right w-96 hover:text-info transition">
          <Link href={`/holders/${type}/${ticker.tick || ticker.id}`}>
            {(ticker.accounts || 0).toLocaleString()}
          </Link>
        </td>
      </tr>
      {id && (
        <tr className="bg-base-200">
          <td
            colSpan={3}
            className="font-mono text-sm text-neutral-content/50 bg-[#111]"
          >
            {supplyContent.value}
          </td>
          <td
            colSpan={2}
            className="text-right text-neutral-content/50 valign-center bg-[#111]"
          >
            <Link
              href={`/outpoint/${ticker.txid}_${ticker.vout}/token`}
              className="hover:text-info transition"
            >
              Deployment Inscription{" "}
              <FaExternalLinkAlt className="inline-block ml-2" />
            </Link>
          </td>
        </tr>
      )}
      {(ticker.pendingOps > 0 || !paidUp.value) && (
        <tr className="group text-warning bg-warning-content">
          <td className="" colSpan={4}>
            <div
              className="tooltip tooltip-right"
              data-tip={`${ticker.pendingOps} pending operations`}
            >
              Needs {bsvNeeded} BSV
            </div>
          </td>
          <td className="transition cursor-pointer text-right">
            <button
              className="btn btn-warning btn-sm"
              onClick={openPaymentModal}
            >
              Fund {ticker.tick || ticker.sym}
            </button>
            {showPaymentModal.value && (
              <WithdrawalModal
                address={ticker.fundAddress}
                amount={bsvNeeded.value}
                onClose={() => {
                  console.log("close modal");
                  showPaymentModal.value = false;
                }}
              />
            )}
          </td>
        </tr>
      )}
    </>
  );
};

export default TickerHeading;