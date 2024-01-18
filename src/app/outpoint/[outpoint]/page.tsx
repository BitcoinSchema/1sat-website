import OutpointPage from "@/components/pages/outpoint";
import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Outpoint = async ({ params }: { params: { outpoint: string } })  => {
  const url = `${API_HOST}/api/inscriptions/${params.outpoint}`;
  const { promise } = http.customFetch<OrdUtxo>(url);
  const listing = await promise;

  const urlHistory = `${API_HOST}/api/inscriptions/${listing.origin?.outpoint}/history`;
  const { promise: promiseHistory } = http.customFetch<OrdUtxo[]>(urlHistory);
  const history = await promiseHistory;

  const spendOutpoints = history.filter((h) => h.spend).map((h) => h.outpoint);
  const urlSpends = `${API_HOST}/api/txos/outpoints`;
  const { promise: promiseSpends } = http.customFetch<OrdUtxo[]>(urlSpends, {
    method: "POST",
    body: JSON.stringify(spendOutpoints),
  });
  const spends = await promiseSpends;
  return (
    <OutpointPage listing={listing} history={history} spends={spends} />
  );
};
export default Outpoint;
