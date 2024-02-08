import JDenticon from "@/components/JDenticon";
import { API_HOST, AssetType } from "@/constants";
import { BSV20 } from "@/types/bsv20";
import * as http from "@/utils/httpClient";
import Link from "next/link";

interface Holder {
  address: string;
  amt: string;
}
const Page = async ({
  params,
}: {
  params: { type: AssetType; id: string };
}) => {
  const url =
    params.type === AssetType.BSV20
      ? `${API_HOST}/api/bsv20/tick/${params.id}/holders`
      : `${API_HOST}/api/bsv20/id/${params.id}/holders`;
  const detailsUrl =
    params.type === AssetType.BSV20
      ? `${API_HOST}/api/bsv20/tick/${params.id}`
      : `${API_HOST}/api/bsv20/id/${params.id}`;

  const { promise: promiseDetails } = http.customFetch<BSV20>(detailsUrl);
  const details = await promiseDetails;

  const { promise } = http.customFetch<Holder[]>(`${url}?limit=100`);
  console.log({ url: `${url}?limit=100` });
  const holders = (await promise)
    .sort((a, b) => {
      return parseInt(a.amt) > parseInt(b.amt) ? -1 : 1;
    })
    .map((h) => {
      return {
        ...h,
        amt: parseInt(h.amt) / 10 ** (details.dec || 0),
      };
    });

  return (
    <div className="mx-auto flex flex-col max-w-5xl w-full">
      <h1 className="text-xl">{params.id}</h1>
      <div className="w-full">
        {(holders || [])?.map((h) => (
          <div
            key={`${params.id}-holder-${h.address}`}
            className="flex items-center"
          >
            <Link className="tooltip" data-tip={h.address} href={`/activity/${h.address}/ordinals`}>
              <JDenticon hashOrValue={h.address} className="w-8 h-8 mr-2" />
            </Link>
            <div>{h.amt}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
