import Timeline from "@/components/Timeline";
import { API_HOST } from "@/constants";
import { OutpointTab } from "@/types/common";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";

interface Props {
  outpoint: string;
}

const OutpointTimeline = async ({ outpoint }: Props) => {
  let history: OrdUtxo[] = [];
  let spends: OrdUtxo[] = [];

  const url = `${API_HOST}/api/inscriptions/${outpoint}`;
  const { promise } = http.customFetch<OrdUtxo>(url);
  const listing = await promise;

  if (listing.origin?.outpoint) {
    const urlHistory = `${API_HOST}/api/inscriptions/${listing.origin?.outpoint}/history`;
    const { promise: promiseHistory } = http.customFetch<OrdUtxo[]>(urlHistory);
    history = await promiseHistory;

    const spendOutpoints = history
      .filter((h) => h.spend)
      .map((h) => h.outpoint);
    const urlSpends = `${API_HOST}/api/txos/outpoints`;
    const { promise: promiseSpends } = http.customFetch<OrdUtxo[]>(urlSpends, {
      method: "POST",
      body: JSON.stringify(spendOutpoints),
    });
    spends = await promiseSpends;
  }

  return (
    <OutpointPage
      artifact={listing}
      history={history}
      spends={spends}
      outpoint={outpoint}
      content={<Timeline history={history} spends={spends} listing={listing} />}
      activeTab={OutpointTab.Timeline}      
    />
  );
};

export default OutpointTimeline;
