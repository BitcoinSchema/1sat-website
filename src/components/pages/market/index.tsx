import FeaturedCollections from "@/components/Collections/featured";
import OrdinalListings, { OrdViewMode } from "@/components/OrdinalListings";
import { AssetType, SortBy } from "@/constants";
import type { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import TokenMarket from "../TokenMarket";
import MarketTabs from "./tabs";
import MarketLayout from "./MarketLayout";

export interface MarketPageProps {
	collections?: OrdUtxo[];
	tokenListingsv2?: BSV20TXO[];
	modelListings?: OrdUtxo[];
	selectedAssetType?: AssetType;
	title?: string;
	showTabs?: boolean;
	id?: string;
	term?: string;
	sort?: SortBy;
	dir?: "asc" | "desc";
}

const Listings = async ({
	id,
	term,
	sort,
	dir,
	selectedAssetType,
}: {
	id?: string;
	term?: string;
	sort: SortBy;
	dir: "asc" | "desc";
	selectedAssetType?: AssetType;
}) => {
	switch (selectedAssetType) {
		case AssetType.Ordinals:
			return <OrdinalListings mode={OrdViewMode.List} term={term} />;
		case AssetType.BSV20:
			return (
				<TokenMarket
					type={AssetType.BSV20}
					id={id}
					term={term}
					sort={sort}
					dir={dir}
				/>
			);
		case AssetType.BSV21:
			return (
				<TokenMarket
					type={AssetType.BSV21}
					id={id}
					term={term}
					sort={sort}
					dir={dir}
				/>
			);
		default:
			return null;
	}
};

const MarketPage: React.FC<MarketPageProps> = async (props) => {
	const { selectedAssetType } = props;
	let showTabs = props.showTabs;
	if (props.showTabs === undefined) {
		showTabs = true;
	}

	return (
		<MarketLayout>
			{/* Featured Collections (Ordinals only) */}
			{selectedAssetType === AssetType.Ordinals && (
				<div className="px-4 md:px-6 py-6 border-b border-border">
					<h2 className="font-serif text-lg mb-4 text-foreground italic">
						Featured Collections
					</h2>
					<FeaturedCollections />
				</div>
			)}

			{/* Tabs */}
			{showTabs && (
				<MarketTabs selectedTab={selectedAssetType || AssetType.Ordinals} />
			)}

			{/* Listings Content */}
			<Listings
				id={props.id}
				dir={props.dir || "asc"}
				term={props.term}
				sort={props.sort || SortBy.MostRecentSale}
				selectedAssetType={selectedAssetType}
			/>
		</MarketLayout>
	);
};

export default MarketPage;
