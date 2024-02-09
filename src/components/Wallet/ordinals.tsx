import { AssetType } from "@/constants";
import OrdinalListings from "../OrdinalListings";
import WalletTabs from "./tabs";

const WalletOrdinals = ({ address: addressProp }: { address?: string }) => {
  // get unspent ordAddress

  // useEffect(() => {
  //   const fire = async () => {
  //     const u = await getOrdUtxos(addressProp || ordAddress.value!, nextOffset.value);
  //     nextOffset.value += resultsPerPage;

  //     if (u.length > 0) {
  //       ordUtxos.value = (ordUtxos.value || []).concat(...u);
  //     } else {
  //       reachedEndOfListings.value = true;
  //     }
  //   };

  //   if (ordAddress.value && (!init.value || isInView && !reachedEndOfListings.value)) {
  //     init.value = true;
  //     fire();
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [addressProp, isInView, reachedEndOfListings, init, ordAddress]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <WalletTabs type={AssetType.Ordinals} address={addressProp} />
      <div className="h-full tab-content block bg-base-100 border-base-300 rounded-box p-2 md:p-6 w-[95vw] md:w-[64rem] mb-12">
        <OrdinalListings />
      </div>
    </div>
  );
};

export default WalletOrdinals;
