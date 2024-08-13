"use client";

import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import WithdrawalModal from "@/components/modal/withdrawal";
import { AssetType, MARKET_API_HOST } from "@/constants";
import {
	CurrencyDisplay,
	bsv20Utxos,
	currencyDisplay,
	exchangeRate,
	usdRate,
	utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { getBsv20Utxos, getUtxos } from "@/utils/address";
import { minFee } from "@/utils/bsv20";
import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import { FaExternalLinkAlt, FaFire, FaLock } from "react-icons/fa";
import { FaHashtag } from "react-icons/fa6";
import { GiPlainCircle } from "react-icons/gi";
import { toBitcoin } from "satoshi-bitcoin-ts";
import type { MarketData } from "./list";
import { useQuery } from "@tanstack/react-query";

type IconProps = {
	alt: string;
	icon: string | null;
	className?: string;
};

export const IconWithFallback: React.FC<IconProps> = (props) => {
	const ref = useRef(null);
	const { icon, alt, ...rest } = props;

	const imgSrc = useSignal(
		icon ? `/api/sanitize?url=https://ordfs.network/${icon}` : oneSatLogo,
	);
	// console.log({ icon, imgSrc: imgSrc.value });
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
			className={`opacity-0 rounded-lg transition ${
				props.className ? props.className : ""
			}`}
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

	const openPaymentModal = async (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		// open modal
		showPaymentModal.value = true;
		if (fundingAddress.value && ordAddress.value) {
			const bu = await getBsv20Utxos(ordAddress.value, 0, id);
			bsv20Utxos.value = (bsv20Utxos.value || []).concat(bu);
			utxos.value = await getUtxos(fundingAddress.value);
		}
	};

	const paidUp = computed(() => bsvNeeded.value <= 0);

	const bsvNeeded = computed(() => {
		const satoshis = Math.max(
			minFee - Number(ticker.fundTotal),
			(ticker.pendingOps || 0) * 1000 - Number.parseInt(ticker.fundBalance),
		);
		// console.log({
		//   satoshis,
		//   minFee,
		//   fundBalance: ticker.fundBalance,
		//   fundTotal: ticker.fundTotal,
		//   pendingOps: ticker.pendingOps,
		// });
		return toBitcoin(satoshis);
	});

	const isPow20 = useMemo(() => {
		return (
			POW20_IDS.includes(ticker.id) ||
      ticker.data?.insc?.json.contract === "pow-20" ||
			ticker.contract === "pow-20"
		);
	}, [ticker]);

	const isLtm = useMemo(() => {
		return (
			LTM_IDS.includes(ticker.id) ||
			ticker.data?.insc?.json.contract === "LockToMintBsv20" ||
      ticker.contract === "LockToMintBsv20"
		);
	}, [ticker]);
	// const bsv21SupplyContent = computed(() => {
	//   const totalSupply = ticker.amt;
	//   let text = `${totalSupply?.toLocaleString()} `;

	const { data: pow20Details } = useQuery<POW20Details>({
		queryKey: ["pow20", id],
		queryFn: () => fetchPOW20Details(id),
		enabled: !!id && isPow20,
	});

	const supplyContent = computed(() => {
		if (type === AssetType.BSV20) {
			return renderBSV20Supply();
		}
		if (type === AssetType.BSV21) {
			if (isPow20) {
				return renderPOW20Supply();
			}
			return renderBSV21Supply();
		}
		return null;
	});

	const renderBSV20Supply = () => {
    if (!ticker.supply) return null;
    if (!ticker.max) return null;
		const totalSupply =
			Number.parseInt(ticker.supply || ticker.amt || "0") /
			(ticker.dec ? 10 ** ticker.dec : 1);
		const maxSupply = Number.parseInt(ticker.max) / 10 ** (ticker.dec || 0);
		const mintedOut =
			Number.parseInt(ticker.supply) === Number.parseInt(ticker.max);
		const btnDisabled = !ticker.included || paidUp.value;

		return (
			<>
				{!mintedOut && (
					<Link
						href={`/inscribe?tab=bsv20&tick=${ticker.tick}`}
						className={btnDisabled ? "cursor-default" : ""}
					>
						<button
							type="button"
							disabled={btnDisabled}
							className="btn btn-sm btn-accent mr-4"
						>
							Mint {ticker.tick}
						</button>
					</Link>
				)}
				<div data-tip="Circulating Supply / Max Supply" className="tooltip">
					{`${totalSupply.toLocaleString()} / ${maxSupply.toLocaleString()}`}
				</div>
			</>
		);
	};

	const renderBSV21Supply = () => {
		const totalSupply =
			Number.parseInt(ticker.supply || ticker.amt || "0") /
			(ticker.dec ? 10 ** ticker.dec : 1);

		return (
			<>
				<div data-tip="Total Supply" className="tooltip">
					{`${totalSupply.toLocaleString()}`}
				</div>
			</>
		);
	};

	// Add this function outside your component
const calculateCurrentDifficulty = (
  startingDifficulty: number,
  remainingSupply: number,
  totalSupply: number
): number => {
  const pctAvail = (remainingSupply * 100) / totalSupply;
  console.log("Starting Difficulty:", startingDifficulty, "Remaining Supply:", pctAvail, "Total Supply:", totalSupply, "Current Supply:", remainingSupply);

  if (pctAvail < 20) {
    return startingDifficulty + 4;
  }
  if (pctAvail < 40) {
    return startingDifficulty + 3;
  }
  if (pctAvail < 60) {
    return startingDifficulty + 2;
  }
  if (pctAvail < 80) {
    return startingDifficulty + 1;
  }
  return startingDifficulty;
};

// In your TickerHeading component, update the renderPOW20Supply function:
const renderPOW20Supply = () => {
  if (!pow20Details) return null;

  const totalSupply = Number(pow20Details.origin.data.insc.json.maxSupply);
  const remainingSupply = pow20Details.data.bsv20.amt;
  const decimals = Number(pow20Details.origin.data.insc.json.decimals);
  const startingDifficulty = Number(pow20Details.origin.data.insc.json.difficulty);

  const adjustedTotalSupply = totalSupply / (10 ** decimals);
  const adjustedRemainingSupply = remainingSupply / (10 ** decimals);

  const currentDifficulty = calculateCurrentDifficulty(startingDifficulty, remainingSupply, totalSupply);

  const supplyText = pow20Details.owner
    ? `Minted Out / ${adjustedTotalSupply.toLocaleString()}`
    : `${adjustedRemainingSupply.toLocaleString()} / ${adjustedTotalSupply.toLocaleString()}`;

  return (
    <>
      {!pow20Details.owner && <Link href={"/mine"}>
        <button type="button" className="btn btn-sm btn-accent mr-4">
          Mine {ticker.sym}
        </button>
      </Link>}
      <div data-tip="Remaining Supply / Total Supply" className="tooltip">
        {supplyText}
      </div>
      {!pow20Details.owner && <div data-tip="Current Mining Difficulty" className="tooltip ml-4">
        Difficulty: {currentDifficulty}
      </div>}
    </>
  );
};

	const usdPrice = computed(() => {
		if (!ticker.price || !usdRate.value) {
			return 0;
		}
		// console.log({ price: ticker.price, usdRate: usdRate.value });
		return ticker.price / usdRate.value;
	});

	return (
		<>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
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
					id
						? "active text-xl text-base-content"
						: "cursor-pointer hover:text-secondary-content"
				}`}
			>
				<th className={"truncate text-ellipsis"}>
					<div className="flex items-center">
						{type === AssetType.BSV21 && (
							<IconWithFallback
								icon={ticker.icon || null}
								alt={ticker.sym || ""}
								className="mr-2 w-8 h-8"
							/>
						)}
						{ticker.num && (
							<div className="whitespace-nowrap items-end content-end text-right mr-4">
								<FaHashtag className="m-0 mb-1 w-3 h-3 text-[#555]" />
								{ticker.num}
							</div>
						)}
						<span className="text-4xl mr-4">{ticker.tick || ticker.sym}</span>
					</div>
				</th>
				{currencyDisplay.value === CurrencyDisplay.BSV && (
					<th>
						{ticker.price?.toLocaleString("en-US", {
							minimumFractionDigits: 0,
							maximumFractionDigits: 8,
							useGrouping: false,
						}) || ""}{" "}
						<span className="text-accent">sat/token</span>
					</th>
				)}
				{currencyDisplay.value === CurrencyDisplay.USD && (
					<th>
						{usdPrice.value.toLocaleString("en-US", {
							style: "currency",
							currency: "USD",
							minimumFractionDigits: 0,
							maximumFractionDigits: 8,
						})}
						<span className="text-accent">/token</span>
					</th>
				)}
				<th>
					<span
						className={`ml-2 text-xl ${
							ticker.pctChange > 0 ? "text-emerald-400" : "text-orange-700"
						}`}
					>
						{change}
					</span>
				</th>
				<th className="w-full text-right">
					{currencyDisplay.value === CurrencyDisplay.BSV
						? `${
								ticker.marketCap > 0
									? toBitcoin(
											Math.floor(ticker.marketCap / 10 ** ticker.dec),
										).toLocaleString()
									: 0
							} BSV`
						: `${
								ticker.marketCap > 0
									? (
											toBitcoin(
												Math.floor(ticker.marketCap / 10 ** ticker.dec),
											) * exchangeRate.value
										).toLocaleString("en-US", {
											style: "currency",
											currency: "USD",
											minimumFractionDigits: 0,
											maximumFractionDigits: 8,
										})
									: 0
							}`}
					<br />
				</th>
				{type === AssetType.BSV21 && (
					<th className="text-center w-12">
						{isPow20 ? (
							<div className="tooltip mx-auto" data-tip="POW-20">
								<FaFire className="text-orange-400" />
							</div>
						) : isLtm ? (
							<div className="tooltip mx-auto" data-tip="Lock-to-Mint">
								<FaLock className="text-blue-400" />
							</div>
						) : (
							<div className="tooltip mx-auto">
								<GiPlainCircle className="text-gray-800" />
							</div>
						)}
					</th>
				)}
				<th className="break-normal text-right w-48 hover:text-info transition">
					<Link href={`/holders/${type}/${ticker.tick || ticker.id}`}>
						{(ticker.accounts || 0).toLocaleString()}
					</Link>
				</th>
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
						colSpan={type === AssetType.BSV21 ? 3 : 2}
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
					<td className="" colSpan={type === AssetType.BSV21 ? 5 : 4}>
						<div
							className="tooltip tooltip-right"
							data-tip={`${ticker.pendingOps} pending operations`}
						>
							{bsvNeeded.value > 0
								? `Needs ${bsvNeeded} BSV`
								: "Funded. Processing..."}
						</div>
					</td>
					<td className="transition cursor-pointer text-right">
						<button
							type="button"
							className="btn btn-warning btn-sm whitespace-nowrap"
							onClick={openPaymentModal}
						>
							Fund {ticker.tick || ticker.sym}
						</button>
						{showPaymentModal.value && (
							<WithdrawalModal
								address={ticker.fundAddress}
								amount={bsvNeeded.value >= 0 ? bsvNeeded.value : 0}
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

//
const ONESAT_POW20_ID =
	"a54d3af24a03bcc28f6b3f2dd0ad249ee042b2f4b95810ae5184ab617a74b8b9_0";
const DOTI_POW20_ID =
	"ca9d9498af9bb8c670180bc2b7a291c452ef7848e22e19edb69cc49b2addae18_0";
export const POW20_IDS = [ONESAT_POW20_ID, DOTI_POW20_ID];
// Known LTM contracts without the contract field
const BAMBOO_LTM_ID =
	"1bff350b55a113f7da23eaba1dc40a7c5b486d3e1017cda79dbe6bd42e001c81_0";
export const LTM_IDS = [BAMBOO_LTM_ID];

// Add this function to fetch POW20 details
const fetchPOW20Details = async (id?: string): Promise<POW20Details> => {
	const response = await fetch(`${MARKET_API_HOST}/mine/pow20/latest/${id}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
};

type POW20Details = {
	txid: string;
	vout: number;
	outpoint: string;
	satoshis: number;
	accSats: string;
	height: number;
	idx: string;
	owner: string | null;
	spend: string;
	spend_height: number | null;
	spend_idx: number | null;
	origin: {
		outpoint: string;
		data: {
			insc: {
				file: {
					hash: string;
					size: number;
					type: string;
				};
				json: {
					p: string;
					op: string;
					amt: string;
					dec: string;
					sym: string;
					icon: string;
					contract: string;
					decimals: string;
					maxSupply: string;
					difficulty: string;
					startingReward: string;
				};
			};
			bsv20: {
				id: string;
				op: string;
				amt: number;
				listing: boolean;
			};
			types: string[];
		};
		num: string;
	};
	data: {
		insc: {
			file: {
				hash: string;
				size: number;
				type: string;
			};
			json: {
				p: string;
				id: string;
				op: string;
				amt: string;
			};
		};
		bsv20: {
			id: string;
			op: string;
			amt: number;
			listing: boolean;
		};
		types: string[];
	};
	script: string;
};
