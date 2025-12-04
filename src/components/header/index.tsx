import { headers } from "next/headers";
import SearchBar from "../SearchBar";
import Wallet from "../Wallet/menu";
import MarketMenu from "../marketMenu";
import Logo from "./Logo";
import StatusIndicator from "./StatusIndicator";

const Header = async ({ ubuntu }: { ubuntu: { className: string } }) => {
	const headersList = await headers();
	const hostname = headersList.get("host") || "";

	return (
		<header
			className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm"
			style={{ paddingTop: "env(safe-area-inset-top)" }}
		>
			<div className="flex h-14 items-center justify-between px-4 md:px-6">
				{/* Logo / Brand */}
				<div className="flex items-center gap-4">
					<Logo ubuntu={ubuntu} hostname={hostname} />
				</div>

				{/* Search */}
				<div className="flex-1 flex justify-center px-4 max-w-xl">
					<SearchBar />
				</div>

				{/* Right Actions */}
				<div className="flex items-center gap-2">
					<StatusIndicator />
					<MarketMenu />
					<Wallet />
				</div>
			</div>
		</header>
	);
};

export default Header;
