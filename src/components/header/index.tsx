import SearchBar from "../SearchBar";
import Logo from "./Logo";
import StatusIndicator from "./StatusIndicator";
import UnifiedMenu from "./UnifiedMenu";

// NOTE: do not read headers() here — the Header renders in the root layout,
// so any dynamic API use forces every page on the site into uncacheable
// dynamic rendering. The Logo reads the hostname client-side instead.
const Header = ({ ubuntu }: { ubuntu: { className: string } }) => {
	return (
		<header
			className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm"
			style={{ paddingTop: "env(safe-area-inset-top)" }}
		>
			<div className="relative flex h-14 items-center px-3 sm:px-4 md:px-6 gap-2">
				<div className="flex items-center gap-3 min-w-0">
					<Logo ubuntu={ubuntu} />
				</div>

				<div className="hidden sm:flex absolute left-1/2 transform -translate-x-1/2">
					<div className="w-full max-w-xl">
						<SearchBar />
					</div>
				</div>

				<div className="flex items-center gap-2 ml-auto">
					<div className="w-12 flex justify-center">
						<StatusIndicator />
					</div>
					<UnifiedMenu />
				</div>
			</div>
		</header>
	);
};

export default Header;
