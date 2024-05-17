
"use client"

import { MARKET_API_HOST } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import * as http from "@/utils/httpClient";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useQuery } from "@tanstack/react-query";

type AirdropResult = {
  success: boolean;
  message: string;
};


const AirdropRecieve = ({ airdropId }: { airdropId: string }) => {
  useSignals();
  const password = useSignal<string | undefined>(undefined);
  const submitted = useSignal(false);

  const submit = () => {

    console.log("submit");
    if (!ordAddress.value) {
      return;
    }

    submitted.value = true;
  }

  // submit
  const { data, isLoading, isError } = useQuery<AirdropResult>({
    queryKey: ["airdrop", airdropId, submitted.value === true, password.value],
    queryFn: async () => {
      const url = `${MARKET_API_HOST}/airdrop/private/${airdropId}`;
      const { promise } = http.customFetch<AirdropResult>(url, {
        method: "POST",
        body: JSON.stringify({
          password: password.value,
        }),
      });
      return await promise;
    },
  });

  return <div>
    <h1>
      AirdropRecieve {airdropId}
    </h1>
    <div>Loading: {isLoading}</div>
    <div>Error: {isError}</div>
    <div>Submitted: {submitted.value}</div>
    <div>Data: {data?.message}</div>

    <input type="text" disabled={true} value={ordAddress.value || ""} />
    <input type="password" placeholder="password" value={password.value} onChange={(e) => {
      password.value = e.target.value
    }} />
    <button type="button" onClick={submit}>Submit</button>
  </div>
}

export default AirdropRecieve;