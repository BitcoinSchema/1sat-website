"use client";

import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import WithdrawalModal from "@/components/modal/withdrawal";
import { API_HOST, AssetType, MARKET_API_HOST } from "@/constants";
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
import { Button } from "@/components/ui/button";
import { useMemo, useRef } from "react";
import { FaExternalLinkAlt, FaFire, FaLock } from "react-icons/fa";
import { FaHashtag } from "react-icons/fa6";
import { GiPlainCircle } from "react-icons/gi";
import { toBitcoin } from "satoshi-token";
import type { MarketData } from "./list";
import { useQuery } from "@tanstack/react-query";
import type { OrdUtxo } from "@/types/ordinals";

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
			onError={(_e) => {
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
			(ticker.pendingOps || 0) * 1000 - Number.parseInt(ticker.fundBalance, 10),
		);
		// console.log({
		//   satoshis,
		//   minFee,
		//   fundBalance: ticker.fundBalance,
		//   fundTotal: ticker.fundTotal,
		//   pendingOps: ticker.pendingOps,
		// });
		return satoshis ? toBitcoin(satoshis) : satoshis;
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

	const { data: pow20Details } = useQuery<OrdUtxo>({
		queryKey: ["pow20", id],
		queryFn: () => fetchPOW20Details(id),
		enabled: !!id && isPow20,
	});

	const { data: ltmDetails } = useQuery<OrdUtxo>({
		queryKey: ["ltm", id],
		queryFn: () => fetchLtmDetails(id),
		enabled: !!id && isLtm,
	});

  // useEffect(() => {
  //   console.log({ltmDetails});
  // }, [ltmDetails]);

	const supplyContent = computed(() => {
		if (type === AssetType.BSV20) {
			return renderBSV20Supply();
		}
		if (type === AssetType.BSV21) {
			if (isPow20) {
				return renderPOW20Supply();
			}
      if (isLtm) {
        return renderLTMSupply();
      }
			return renderBSV21Supply();
		}
		return null;
	});

	const renderBSV20Supply = () => {
		if (!ticker.supply) return null;
		if (!ticker.max) return null;
		const totalSupply =
			Number.parseInt(ticker.supply || ticker.amt || "0", 10) /
			(ticker.dec ? 10 ** ticker.dec : 1);
		const maxSupply = Number.parseInt(ticker.max, 10) / 10 ** (ticker.dec || 0);
		const mintedOut =
			Number.parseInt(ticker.supply, 10) === Number.parseInt(ticker.max, 10);
		const btnDisabled = !ticker.included || paidUp.value;

		return (
			<>
				{!mintedOut && (
					<Link
						href={`/inscribe?tab=bsv20&tick=${ticker.tick}`}
						className={btnDisabled ? "cursor-default" : ""}
						onClick={(e) => {
							if (btnDisabled) {
								e.preventDefault();
							}
						}}
						aria-disabled={btnDisabled}
						tabIndex={btnDisabled ? -1 : 0}
					>
						<Button
							type="button"
							size="sm"
							disabled={btnDisabled}
							className="mr-4"
						>
							Mint {ticker.tick}
						</Button>
					</Link>
				)}
				<span title="Circulating Supply / Max Supply" className="text-muted-foreground">
					{`${totalSupply.toLocaleString()} / ${maxSupply.toLocaleString()}`}
				</span>
			</>
		);
	};

	const renderBSV21Supply = () => {
		const totalSupply =
			Number.parseInt(ticker.supply || ticker.amt || "0", 10) /
			(ticker.dec ? 10 ** ticker.dec : 1);

		return (
			<span title="Total Supply" className="text-muted-foreground">
				{`${totalSupply.toLocaleString()}`}
			</span>
		);
	};

	const renderPOW20Supply = () => {
		if (!pow20Details) return null;
		if (!pow20Details.data?.bsv20) return null;
		if (!pow20Details.origin?.data?.insc?.json.maxSupply) return null;

		const totalSupply = Number(pow20Details.origin.data.insc.json.maxSupply);
		const remainingSupply = pow20Details.data.bsv20.amt;
		const decimals = Number(pow20Details.origin.data.insc.json.decimals);
		const startingDifficulty = Number(
			pow20Details.origin.data.insc.json.difficulty,
		);

		const adjustedTotalSupply = totalSupply / 10 ** decimals;
		const adjustedRemainingSupply = Number(remainingSupply) / 10 ** decimals;

		const currentDifficulty = calculateCurrentDifficulty(
			startingDifficulty,
			Number(remainingSupply),
			totalSupply,
		);

		const supplyText = pow20Details.owner
			? `Minted Out / ${adjustedTotalSupply.toLocaleString()}`
			: `${adjustedRemainingSupply.toLocaleString()} / ${adjustedTotalSupply.toLocaleString()}`;

		return (
			<>
				{!pow20Details.owner && (
					<Link href={"/mine"}>
						<button type="button" className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-orange-900/30 text-orange-400 border border-orange-500/50 hover:bg-orange-900/50 transition mr-4">
							Mine {ticker.sym}
						</button>
					</Link>
				)}
				<span title="Remaining Supply / Total Supply" className="text-muted-foreground">
					{supplyText}
				</span>
				{!pow20Details.owner && (
					<span title="Current Mining Difficulty" className="text-muted-foreground ml-4">
						Difficulty: {currentDifficulty}
					</span>
				)}
			</>
		);
	};

	const renderLTMSupply = () => {
		if (!ltmDetails) return null;
		if (!ltmDetails.data?.bsv20) return null;
		if (!ltmDetails.origin?.data?.insc?.json.amt) return null;

		const totalSupply = ltmDetails.origin.data.insc.json.amt;
		const remainingSupply = ltmDetails.data.bsv20.amt;
		const decimals = ltmDetails.origin.data.insc.json.dec;
		console.log({totalSupply, remainingSupply, decimals});
		const adjustedTotalSupply = totalSupply / 10 ** decimals;
		const adjustedRemainingSupply = Number(remainingSupply) / 10 ** decimals;

		const supplyText = remainingSupply === "0"
			? `Minted Out / ${adjustedTotalSupply.toLocaleString()}`
			: `${adjustedRemainingSupply.toLocaleString()} / ${adjustedTotalSupply.toLocaleString()}`;

		return (
			<>
				{remainingSupply === "0" && (
					<Link href={"https://locktomint.com"} target="_blank">
						<button type="button" className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-blue-900/30 text-blue-400 border border-blue-500/50 hover:bg-blue-900/50 transition mr-4">
							Mint {ticker.sym}
						</button>
					</Link>
				)}
				<span title="Remaining Supply / Total Supply" className="text-muted-foreground">
					{supplyText}
				</span>
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
			<tr
				onClick={(e) => {
					if (id) {
						e.preventDefault();
						e.stopPropagation();
						return;
					}
					router.push(`/market/${type}/${ticker.tick || ticker.id}`);
				}}
				className={`transition border-b border-border ${
					id
						? "bg-muted/50 text-xl text-foreground"
						: "cursor-pointer hover:bg-muted/30 text-muted-foreground hover:text-foreground"
				}`}
			>
				<td className="truncate text-ellipsis px-4 py-3">
					<div className="flex items-center">
						{type === AssetType.BSV21 && (
							<IconWithFallback
								icon={ticker.icon || null}
								alt={ticker.sym || ""}
								className="mr-2 w-8 h-8"
							/>
						)}
						{ticker.num && (
							<div className="whitespace-nowrap items-end content-end text-right mr-4 text-muted-foreground">
								<FaHashtag className="m-0 mb-1 w-3 h-3 text-muted-foreground/50 inline" />
								{ticker.num}
							</div>
						)}
						<span className="text-2xl md:text-4xl mr-4 font-bold text-foreground">{ticker.tick || ticker.sym}</span>
					</div>
				</td>
				{currencyDisplay.value === CurrencyDisplay.BSV && (
					<td className="px-4 py-3 text-muted-foreground">
						{ticker.price?.toLocaleString("en-US", {
							minimumFractionDigits: 0,
							maximumFractionDigits: 8,
							useGrouping: false,
						}) || ""}{" "}
						<span className="text-primary">sat/token</span>
					</td>
				)}
				{currencyDisplay.value === CurrencyDisplay.USD && (
					<td className="px-4 py-3 text-muted-foreground">
						{usdPrice.value.toLocaleString("en-US", {
							style: "currency",
							currency: "USD",
							minimumFractionDigits: 0,
							maximumFractionDigits: 8,
						})}
						<span className="text-primary">/token</span>
					</td>
				)}
				<td className="px-4 py-3">
					<span
						className={`ml-2 text-xl ${
							ticker.pctChange > 0 ? "text-emerald-400" : "text-destructive"
						}`}
					>
						{change}
					</span>
				</td>
				<td className="px-4 py-3 w-full text-right text-muted-foreground">
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
				</td>
				{type === AssetType.BSV21 && (
					<td className="px-4 py-3 text-center w-12">
						{isPow20 ? (
							<span title="POW-20" className="mx-auto">
								<FaFire className="text-orange-400" />
							</span>
						) : isLtm ? (
							<span title="Lock-to-Mint" className="mx-auto">
								<FaLock className="text-blue-400" />
							</span>
						) : (
							<span className="mx-auto">
								<GiPlainCircle className="text-muted-foreground/30" />
							</span>
						)}
					</td>
				)}
				<td className="px-4 py-3 break-normal text-right w-48 text-muted-foreground hover:text-primary transition">
					<Link href={`/holders/${type}/${ticker.tick || ticker.id}`}>
						{(ticker.accounts || 0).toLocaleString()}
					</Link>
				</td>
			</tr>
			{id && (
				<tr className="bg-muted/30 border-b border-border">
					<td
						colSpan={3}
						className="px-4 py-3 font-mono text-sm text-muted-foreground"
					>
						{supplyContent.value}
					</td>
					<td
						colSpan={type === AssetType.BSV21 ? 3 : 2}
						className="px-4 py-3 text-right text-muted-foreground"
					>
						<Link
							href={`/outpoint/${ticker.txid}_${ticker.vout}/token`}
							className="hover:text-primary transition"
						>
							Deployment Inscription{" "}
							<FaExternalLinkAlt className="inline-block ml-2" />
						</Link>
					</td>
				</tr>
			)}
			{(ticker.pendingOps > 0 || !paidUp.value) && (
				<tr className="group bg-yellow-900/20 border-b border-yellow-500/30">
					<td className="px-4 py-3 text-yellow-400" colSpan={type === AssetType.BSV21 ? 5 : 4}>
						<span title={`${ticker.pendingOps} pending operations`}>
							{bsvNeeded.value > 0
								? `Needs ${bsvNeeded} BSV`
								: "Funded. Processing..."}
						</span>
					</td>
					<td className="px-4 py-3 transition cursor-pointer text-right">
						<button
							type="button"
							className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-yellow-900/30 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-900/50 transition whitespace-nowrap"
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
const fetchPOW20Details = async (id?: string): Promise<OrdUtxo> => {
	const response = await fetch(`${MARKET_API_HOST}/mine/pow20/latest/${id}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
};

// Add this function to fetch POW20 details
const fetchLtmDetails = async (id?: string): Promise<OrdUtxo> => {
	const url = `${API_HOST}/api/inscriptions/${id}/latest?script=false`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
};

const calculateCurrentDifficulty = (
	startingDifficulty: number,
	remainingSupply: number,
	totalSupply: number,
): number => {
	const pctAvail = (remainingSupply * 100) / totalSupply;
	console.log(
		"Starting Difficulty:",
		startingDifficulty,
		"Remaining Supply:",
		pctAvail,
		"Total Supply:",
		totalSupply,
		"Current Supply:",
		remainingSupply,
	);

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
