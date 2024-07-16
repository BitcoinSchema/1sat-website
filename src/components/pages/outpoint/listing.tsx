import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import ListingContent from "./listingContent";
import { OutpointTab } from "./tabs";

interface Props {
  outpoint: string;
}

const OutpointListing = async ({ outpoint }: Props) => {
  let artifact: OrdUtxo | undefined;
  let bsv20: OrdUtxo | undefined;
  try {
    const url = `${API_HOST}/api/bsv20/outpoint/${outpoint}`;
    const { promise } = http.customFetch<OrdUtxo>(url);
    bsv20 = await promise;
  } catch (e) {
    console.log(e);
  }

  try {
    const url = `${API_HOST}/api/inscriptions/${outpoint}`;
    const { promise } = http.customFetch<OrdUtxo>(url);
    artifact = await promise;
  } catch (e) {
    console.log(e);
  }

  // console.log({ artifact, bsv20 });
  // const listing = artifact?.data?.list || bsv20?.data?.list;
  // const content = listing ? (
  // 	<ListingContent artifact={artifact || bsv20!} />
  // ) : (
  // 	<div>Not a listing</div>
  // );

  return (
    <OutpointPage
      artifact={artifact || bsv20!}
      outpoint={outpoint}
      content={<ListingContent artifact={artifact || bsv20!} />}
      activeTab={OutpointTab.Listing}
    />
  );
};

export default OutpointListing;
