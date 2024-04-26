import NewListingPage from "@/components/pages/market/new";
import { AssetType } from "@/constants";
import { getCapitalizedAssetType } from "@/utils/assetType";

const Market = async ({ params }: { params: { tab: AssetType } }) => {
	// switch (params.tab) {
	//   case AssetType.Ordinals:
	//     // TODO: Featured ordinals
	//     const urlImages = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&type=image/png`;
	//     const { promise } = http.customFetch<OrdUtxo[]>(urlImages);
	//     const imageListings = await promise;
	//     return (
	//       <MarketPage
	//         imageListings={imageListings}
	//         selectedAssetType={AssetType.Ordinals}
	//       />
	//     );
	//   case AssetType.BSV20:
	//     return (
	//       <MarketPage
	//         selectedAssetType={AssetType.BSV20}
	//       />
	//     );
	//   case AssetType.BSV21:
	//     return (
	//       <MarketPage
	//         selectedAssetType={AssetType.BSV21}
	//       />
	//     );
	//   case AssetType.LRC20:
	//     const q = {
	//       insc: {
	//         json: {
	//           p: "lrc-20",
	//         },
	//       },
	//     };

	//     const urlLrc20 = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&q=${btoa(
	//       JSON.stringify(q)
	//     )}`;
	//     const { promise: promiseLrc20 } = http.customFetch<OrdUtxo[]>(urlLrc20);
	//     const lrc20Listings = await promiseLrc20;

	//     const lrc20TokenIds = lrc20Listings
	//       .filter((l) => !!l.origin?.data?.insc?.json?.id)
	//       .map((l) => l.origin?.data?.insc?.json?.id!);

	//     const urlLrc20Tokens = `${API_HOST}/api/txos/outpoints`;
	//     const { promise: promiseLrc20Tokens } = http.customFetch<OrdUtxo[]>(
	//       urlLrc20Tokens,
	//       {
	//         method: "POST",
	//         body: JSON.stringify(lrc20TokenIds),
	//       }
	//     );
	//     const lrc20Tokens = await promiseLrc20Tokens;

	//     return (

	//     );
	//   default:
	//     return null;
	// }
	return <NewListingPage type={params.tab} />;
};
export default Market;

export async function generateMetadata({
	params,
}: {
	params: { tab: AssetType };
}) {
	const assetType = getCapitalizedAssetType(params.tab);

	return {
		title: `Create New ${assetType} Listing - 1SatOrdinals`,
		description: `Create a new listing for ${assetType} on 1SatOrdinals.`,
		openGraph: {
			title: `Create New ${assetType} Listing - 1SatOrdinals`,
			description: `Create a new listing for ${assetType} on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary",
			title: `Create New ${assetType} Listing - 1SatOrdinals`,
			description: `Create a new listing for ${assetType} on 1SatOrdinals.`,
		},
	};
}
