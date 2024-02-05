import ListingsPage from "@/components/pages/listings";
import { API_HOST, AssetType } from "@/constants";
import { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Listings = async ({ params }: { params: { tab: AssetType } }) => {
  switch (params.tab) {
    case AssetType.Ordinals:
      const urlImages = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&type=image/png`;
      const { promise } = http.customFetch<OrdUtxo[]>(urlImages);
      const imageListings = await promise;
      return (
        <ListingsPage
          imageListings={imageListings}
          selectedAssetType={AssetType.Ordinals}
        />
      );
    case AssetType.BSV20:
      return (
        <ListingsPage
          selectedAssetType={AssetType.BSV20}
        />
      );
    case AssetType.BSV21:
      const urlV2Tokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v2`;
      const { promise: promiseBsv20v2 } =
        http.customFetch<BSV20TXO[]>(urlV2Tokens);
      const tokenListingsv2 = await promiseBsv20v2;
      return (
        <ListingsPage
          tokenListingsv2={tokenListingsv2}
          selectedAssetType={AssetType.BSV21}
        />
      );
    case AssetType.LRC20:
      const q = {
        insc: {
          json: {
            p: "lrc-20",
          },
        },
      };

      const urlLrc20 = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&q=${btoa(
        JSON.stringify(q)
      )}`;
      const { promise: promiseLrc20 } = http.customFetch<OrdUtxo[]>(urlLrc20);
      const lrc20Listings = await promiseLrc20;

      const lrc20TokenIds = lrc20Listings
        .filter((l) => !!l.origin?.data?.insc?.json?.id)
        .map((l) => l.origin?.data?.insc?.json?.id!);

      const urlLrc20Tokens = `${API_HOST}/api/txos/outpoints`;
      const { promise: promiseLrc20Tokens } = http.customFetch<OrdUtxo[]>(
        urlLrc20Tokens,
        {
          method: "POST",
          body: JSON.stringify(lrc20TokenIds),
        }
      );
      const lrc20Tokens = await promiseLrc20Tokens;

      return (
        <ListingsPage
          lrc20Listings={lrc20Listings}
          lrc20Tokens={lrc20Tokens}
          selectedAssetType={AssetType.LRC20}
        />
      );
    default:
      return null;
  }
};
export default Listings;
