"use client";

import { useSignals } from "@preact/signals-react/runtime";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import { payPk } from "@/signals/wallet";

interface LogoProps {
	ubuntu: { className: string };
}

// The brand label varies by hostname. This used to come from headers() in
// the server Header, which forced every page into dynamic (uncacheable)
// rendering. Read it client-side instead: default to the production brand
// and correct after hydration for alpha/local hosts.
const Logo = ({ ubuntu }: LogoProps) => {
	useSignals();
	const [hostname, setHostname] = useState<string>("1sat.market");

	useEffect(() => {
		setHostname(window.location.host);
	}, []);

	const isMarket = hostname === "1sat.market";
	const isAlpha =
		hostname === "alpha.1satordinals.com" || hostname === "alpha.1sat.market";
	const isLocal = hostname === "localhost:3000";

	// When wallet is unlocked, go to wallet ordinals page
	const isWalletUnlocked = !!payPk.value;
	const href = isWalletUnlocked ? "/wallet/ordinals" : "/";

	return (
		<Link
			className={`flex items-center gap-2 font-medium ${ubuntu.className}`}
			href={href}
		>
			<Image src={oneSatLogo} alt="1Sat Ordinals" className="w-6 h-6" />
			<span className="hidden md:inline text-foreground font-mono text-sm uppercase tracking-wider">
				{isMarket || isAlpha
					? "1Sat.Market"
					: isLocal
						? "1Sat_Hackinals"
						: "1Sat_Ordinals"}
			</span>
			<span className="hidden md:inline px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-primary text-primary-foreground font-bold">
				{isAlpha ? "ALPHA" : "BETA"}
			</span>
		</Link>
	);
};

export default Logo;
