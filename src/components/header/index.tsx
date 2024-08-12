import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "../SearchBar";
import Wallet from "../Wallet/menu";
import MarketMenu from "../marketMenu";

const Header = ({ ubuntu }: { ubuntu: { className: string } }) => {
	const headersList = headers();
	const hostname = headersList.get("host") || "";

	// if the domain is 1sat.market, isMarket will be true
	const isMarket = hostname === "1sat.market";

	// if the domain is alpha.1satordinals.com, isAlpha will be true
	const isAlpha = hostname === "alpha.1satordinals.com" || hostname === "alpha.1sat.market";

	const isLocal = hostname === "localhost:3000";

	return (
		<header className="mb-12 z-10">
			<div className="navbar bg-base-100 relative p-0">
				<div className="navbar-start">
					<div className="px-2 min-w-12">
						<Link
							className={`text-2xl flex items-center z-20 font-medium ${ubuntu.className} relative`}
							href="/"
						>
							<div className="relative">
								<Image
									style={{
										boxShadow: "0 0 0 0 rgba(0, 0, 0, 1)",
										transform: "scale(1)",
										animation: "pulse 2s infinite",
									}}
									src={oneSatLogo}
									alt={"1Sat Ordinals"}
									className="w-6 h-6 cursor-pointer rounded mr-2"
								/>
							</div>
							<span className="md:block hidden text-nowrap">
								{isMarket || isAlpha
									? "1Sat.Market"
										: isLocal
											? "1Sat Hackinals"
											: "1Sat Ordinals"}
							</span>
							<div className="absolute -top-1 -right-12 bg-yellow-400 text-black text-xs font-bold py-1 px-2 rounded-sm transform rotate-12 shadow-md">
								{isAlpha ? 'ALPHA' : 'BETA'}
							</div>
						</Link>
					</div>
				</div>
				<SearchBar />
				<div className="navbar-end">
					<MarketMenu />
					<Wallet />
				</div>
			</div>
		</header>
	);
};

export default Header;
