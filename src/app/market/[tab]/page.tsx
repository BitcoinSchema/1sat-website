import MarketPage from "@/components/pages/market";
import { API_HOST, AssetType } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Market = async ({ params }: { params: { tab: AssetType } }) => {
  switch (params.tab) {
    case AssetType.Ordinals:
      // TODO: Featured ordinals 
      const urlImages = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&type=image/png`;
      const { promise } = http.customFetch<OrdUtxo[]>(urlImages);
      const imageListings = await promise;
      return (
        <MarketPage
          imageListings={imageListings}
          selectedAssetType={AssetType.Ordinals}
        />
      );
    case AssetType.BSV20:
      return (
        <MarketPage
          selectedAssetType={AssetType.BSV20}
        />
      );
    case AssetType.BSV20V2:
      return (
        <MarketPage
          selectedAssetType={AssetType.BSV20V2}
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
        <MarketPage
          lrc20Listings={lrc20Listings}
          lrc20Tokens={lrc20Tokens}
          selectedAssetType={AssetType.LRC20}
        />
      );
    default:
      return null;
  }
};
export default Market;
