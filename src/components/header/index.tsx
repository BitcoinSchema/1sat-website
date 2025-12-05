import { headers } from "next/headers";
import MarketMenu from "../marketMenu";
import SearchBar from "../SearchBar";
import Wallet from "../Wallet/menu";
import Logo from "./Logo";
import StatusIndicator from "./StatusIndicator";
import { ThemeToggle } from "./ThemeToggle";

const Header = async ({ ubuntu }: { ubuntu: { className: string } }) => {
	const headersList = await headers();
	const hostname = headersList.get("host") || "";

	return (
		<header
			className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm"
			style={{ paddingTop: "env(safe-area-inset-top)" }}
		>
			<div className="flex h-14 items-center justify-between px-3 sm:px-4 md:px-6 gap-2">
				<div className="flex items-center gap-3 min-w-0">
					<Logo ubuntu={ubuntu} hostname={hostname} />
				</div>

				<div className="flex flex-1 items-center gap-2 min-w-0">
					<div className="hidden sm:flex flex-1 min-w-0">
						<SearchBar />
					</div>
				</div>

				<div className="flex items-center gap-2">
					<StatusIndicator />
					<ThemeToggle />
					<MarketMenu />
					<Wallet />
				</div>
			</div>
		</header>
	);
};

export default Header;
