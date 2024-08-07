import Collections from "@/components/Collections";

const Collection = async () => {
  return (
    <div className="max-w-7xl mx-auto w-full">
      <Collections />
    </div>
  );
};
export default Collection;

export async function generateMetadata() {

	return {
		title: "1Sat Ordinals Market Collections",
		description: "Native Bitcoin SV decentralized marketplace directly on Layer 1. The best place to find 1Sat NFTs, and Fungible tokens with way more utility than your average blockchain! Mint your own tokens, or buy and sell on the marketplace.",
		openGraph: {
			title: "1Sat Ordinals marketplace collections",
			description: "Explore 1Sat Ordinals NFT Collections on the best on-chain marketplace.",
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: "1Sat Ordinals marketplace Collections",
			description: "Explore 1Sat Ordinals NFT Collections on the best on-chain marketplace.",
		},
	};
}
