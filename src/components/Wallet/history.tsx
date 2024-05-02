"use client";

import { API_HOST } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import type { OrdUtxo } from "@/types/ordinals";
import { useSignals } from "@preact/signals-react/runtime";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FaSpinner } from "react-icons/fa";
import WalletTabs, { WalletTab } from "./tabs";

interface WalletHistoryProps {
  address?: string | undefined;
}

const WalletHistory: React.FC<WalletHistoryProps> = ({
  address: addressProp,
}) => {
  useSignals();

  const {
    data: bsv20History,
    isLoading: isLoadingBsv20History,
    isError: isBsv20HistoryError,
    error: bsv20Error,
  } = useQuery<OrdUtxo[]>({
    queryKey: ["history", addressProp, ordAddress.value],
    queryFn: async () => {
      if (!addressProp && !ordAddress.value) {
        return [] as OrdUtxo[];
      }
      const res = await fetch(
        `${API_HOST}/api/txos/address/${addressProp || ordAddress.value
        }/history?bsv20=true`
      );
      const json = await res.json();
      return json as OrdUtxo[];
    },
  });

  const {
    data: history,
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
  } = useQuery<OrdUtxo[]>({
    queryKey: ["history", addressProp, ordAddress.value],
    queryFn: async () => {
      if (!addressProp && !ordAddress.value) {
        return [] as OrdUtxo[];
      }
      const res = await fetch(
        `${API_HOST}/api/txos/address/${addressProp || ordAddress.value
        }/history`
      );
      const json = await res.json();
      return json as OrdUtxo[];
    },
  });

  if (isLoadingBsv20History || isLoadingHistory) {
    return (
      <div className="mx-auto animate-spin w-fit">
        <FaSpinner />
      </div>
    );
  }

  if (isBsv20HistoryError || isHistoryError) {
    return <div>Error {bsv20Error?.message || historyError?.message}</div>;
  }


  // {
  //   "txid": "45d0b39a861f470dda4bd72a311b757384e5cc6ecdfdd93f9218d9357af29540",
  //   "vout": 0,
  //   "outpoint": "45d0b39a861f470dda4bd72a311b757384e5cc6ecdfdd93f9218d9357af29540_0",
  //   "satoshis": 10000000,
  //   "accSats": "0",
  //   "height": 834816,
  //   "idx": "328",
  //   "owner": "1NVoMjzjAgskT5dqWtTXVjQXUns7RqYp2m",
  //   "spend": "77749e6e75c5d411f5005ebc7a53e427a4bd4c77e010b4090da6bcd7620f361e",
  //   "origin": null,
  //   "data": null
  // }

  return (
    <div className="overflow-x-auto">
      <div className={`${"mb-12"} mx-auto w-full max-w-5xl`}>
        <div className="flex flex-col items-center justify-center w-full h-full max-w-5xl">
          <WalletTabs
            type={WalletTab.History}
            address={addressProp}
          />
          <div className="w-full min-w-96 min-h-[80vh] tab-content bg-base-100 border-base-200 rounded-box p-2 md:p-6 flex flex-col md:flex-row md:max-w-5xl">
            <div className="w-full">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Txid</th>
                    <th>Spend</th>
                    <th>Origin</th>
                    <th>Sats</th>
                  </tr>
                </thead>
                <tbody>
                  {history?.map((tx) => (
                    <tr key={tx.txid}>
                      <td>{tx.txid}</td>
                      <td>{tx.spend}</td>
                      <td>
                        <Link
                          href={
                            tx.origin?.outpoint
                              ? `/outpoint/${tx.origin.outpoint}`
                              : "#"
                          }
                        >
                          {tx.origin?.outpoint}
                        </Link>
                      </td>
                      <td>{tx.satoshis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h2 className="text-2xl font-bold mt-8">BSV20 History</h2>
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Txid</th>
                    <th>Spend</th>
                    <th>Origin</th>
                    <th>Sats</th>
                  </tr>
                </thead>

                <tbody>
                  {bsv20History?.map((tx) => (
                    <tr key={tx.txid}>
                      <td>{tx.txid}</td>
                      <td>{tx.spend}</td>
                      <td>
                        <Link
                          href={
                            tx.origin?.outpoint
                              ? `/outpoint/${tx.origin.outpoint}`
                              : "#"
                          }
                        >
                          {tx.origin?.outpoint}
                        </Link>
                      </td>
                      <td>{tx.satoshis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletHistory;
