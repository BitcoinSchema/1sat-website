"use client";

import type {
  CombinedHolder,
  Holder,
} from "@/components/pages/TokenMarket/list";
import { Meteors } from "@/components/ui/meteors";
import {
  API_HOST,
  AssetType,
  FetchStatus,
  MARKET_API_HOST,
  SATS_PER_KB,
  toastErrorProps,
} from "@/constants";
import { ordPk, payPk, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Ticker } from "@/types/bsv20";
import type { PendingTransaction } from "@/types/preview";
import * as http from "@/utils/httpClient";
import { useIDBStorage } from "@/utils/storage";
import { PrivateKey } from "@bsv/sdk";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import type {
  Distribution,
  Payment,
  TokenUtxo,
  TransferOrdTokensConfig,
  Utxo,
} from "js-1sat-ord";
import {
  TokenInputMode,
  TokenSelectionStrategy,
  TokenType,
  fetchTokenUtxos,
  selectTokenUtxos,
  transferOrdTokens,
} from "js-1sat-ord";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { toBitcoin, toToken, toTokenSat } from "satoshi-token";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, HelpCircle, Loader2, ArrowLeft } from "lucide-react";

interface TransferModalProps {
  onClose: () => void;
  amount?: number;
  address?: string;
  type: AssetType;
  dec: number;
  id: string;
  balance: number;
  sym?: string;
  open: boolean;
}

type Destination = {
  address: string;
  amt?: number | string;
  pct?: number;
  receiveAmt: number;
};

enum Allocation {
  Equal = "equal",
  Weighted = "weighted",
}

type AllocationOption = {
  value: Allocation;
  label: string;
};

const ALLOCATION_OPTIONS: AllocationOption[] = [
  {
    value: Allocation.Equal,
    label: "Equal",
  },
  {
    value: Allocation.Weighted,
    label: "Weighted",
  },
];

const AirdropTokensModal: React.FC<TransferModalProps> = ({
  type,
  balance,
  sym,
  id,
  amount: amt,
  dec,
  address: addr,
  onClose,
  open = false,
}) => {
  useSignals();
  const router = useRouter();
  const airdroppingStatus = useSignal<FetchStatus>(FetchStatus.Idle);
  const amount = useSignal(amt?.toString() || "0");
  const addresses = useSignal<string>(addr || "");
  const excludeAdresses = useSignal<string>("");
  const destinationTickers = useSignal("");
  const destinationBsv21Ids = useSignal("");
  const numOfHolders = useSignal("25");
  const allocation = useSignal<Allocation>(Allocation.Equal);
  const isEqualAllocation = allocation.value === Allocation.Equal;
  const reviewMode = useSignal(false);
  const destinations = useSignal<Destination[]>([]);
  const changeTokenAmount = useSignal(0n);
  const indexingFees = useSignal(0);

  const [pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    [],
  );
  const setAmountToBalance = useCallback(() => {
    amount.value = balance.toString();
  }, [amount, balance]);

  const handleReview = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      reviewMode.value = true;
    },
    [reviewMode],
  );

  const airdropBsv20 = useCallback(
    async (
      tokensToSend: number,
      protocol: TokenType,
      paymentUtxos: Utxo[],
      inputTokens: TokenUtxo[],
      paymentPk: PrivateKey,
      changeAddress: string,
      ordPk: PrivateKey,
      ordAddress: string,
      ticker: Ticker,
      extraAddresses: string,
      excludedAdresses: string,
    ): Promise<PendingTransaction> => {
      // totals for airdrop review
      indexingFees.value = 0;
      changeTokenAmount.value = 0n;

      if (
        destinationTickers.value.length === 0 &&
        destinationBsv21Ids.value.length === 0
      ) {
        toast.error("No destinations found", toastErrorProps);
        throw new Error("No destinations found");
      }
      let distributions: Distribution[] = [];
      const omitAddresses = (excludedAdresses || "")
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const plusAddresses = (extraAddresses || "")
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      // make sure additional holders are not excluded
      if (plusAddresses.some((a) => omitAddresses.includes(a))) {
        toast.error(
          "Additional addresses contain excluded addresses",
          toastErrorProps,
        );
        throw new Error("Additional addresses contain excluded addresses");
      }
      if (isEqualAllocation) {
        distributions = await calculateEqualDistributions(
          toTokenSat(tokensToSend, ticker.dec || 0),
          destinationTickers.value,
          destinationBsv21Ids.value,
          Number.parseInt(numOfHolders.value),
          plusAddresses,
          omitAddresses,
          ticker.dec || 0,
        );
      } else {
        distributions = await calculateWeightedDistributions(
          toTokenSat(tokensToSend, ticker.dec || 0),
          destinationTickers.value,
          destinationBsv21Ids.value,
          Number.parseInt(numOfHolders.value),
          omitAddresses,
          ticker.dec || 0,
        );
      }

      // Update the destinations signal
      destinations.value = distributions.map((d) => ({
        address: d.address as string,
        receiveAmt: Number(d.tokens),
      }));

      const indexerAddress = ticker.fundAddress;
      const additionalPayments: Payment[] = [
        {
          to: indexerAddress,
          amount: 1000 * (distributions.length + 1),
        },
      ];

      const transferConfig: TransferOrdTokensConfig = {
        inputTokens,
        paymentPk,
        ordPk,
        distributions,
        protocol,
        tokenID: (ticker.tick || ticker.id) as string,
        utxos: paymentUtxos,
        additionalPayments,
        changeAddress,
        tokenChangeAddress: ordAddress,
        decimals: ticker.dec || 0,
        tokenInputMode: TokenInputMode.Needed,
        splitConfig: {
          outputs: 2,
          threshold: 900,
        },
        satsPerKb: SATS_PER_KB,
      };

      const { tx, spentOutpoints, payChange, tokenChange } =
        await transferOrdTokens(transferConfig);
      console.log({ tokenChange })
      changeTokenAmount.value =
        tokenChange?.reduce(
          (acc, tc) => BigInt(tc?.amt || "0") + acc,
          0n,
        ) || 0n;
      indexingFees.value = tx.outputs[tx.outputs.length - 2].satoshis || 0;
      return {
        rawTx: tx.toHex(),
        size: tx.toBinary().length,
        fee:
          paymentUtxos[0].satoshis -
          Number(tx.outputs.reduce((sum, o) => sum + (o.satoshis || 0), 0)),
        numInputs: tx.inputs.length,
        numOutputs: tx.outputs.length,
        txid: tx.id("hex"),
        spentOutpoints,
        payChange,
        tokenChange,
        marketFee: 0,
      };
    },
    [
      destinationBsv21Ids.value,
      destinationTickers.value,
      numOfHolders.value,
      isEqualAllocation,
      indexingFees,
      changeTokenAmount,
      destinations,
    ],
  );

  const submit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (reviewMode.value) {
        router.push("/preview");
        return;
      }

      const isDestinationMissing =
        !destinationTickers.value &&
        !destinationBsv21Ids.value &&
        !(isEqualAllocation && addresses.value?.length);

      if (!amount.value || isDestinationMissing) {
        return;
      }

      if (Number(amount.value) > balance) {
        toast.error("Not enough Bitcoin!", toastErrorProps);
        return;
      }

      airdroppingStatus.value = FetchStatus.Loading;

      console.log(amount.value, addresses.value);
      if (Number(amount.value) <= 0) {
        toast.error("Amount must be greater than 0", toastErrorProps);
        airdroppingStatus.value = FetchStatus.Error;
        return;
      }

      try {
        const { promise: promiseTickerDetails } = http.customFetch<Ticker>(
          `${API_HOST}/api/bsv20/${type === AssetType.BSV20 ? "tick" : "id"}/${id}`,
        );
        const ticker = await promiseTickerDetails;

        //const bsv20TxoUrl = `${API_HOST}/api/bsv20/${ordAddress.value}/${type === AssetType.BSV20 ? "tick" : "id"}/${id}?listing=false`;
        // const { promise } = http.customFetch<BSV20TXO[]>(bsv20TxoUrl);

        // const tokenUtxos = (await promise) || [];

        // const inputTokens = tokenUtxos.map((txo) => {
        //   console.log("InputTokens", { txo });
        //   // Convert ASM to a base64 encoded script
        //   return {
        //     txid: txo.txid,
        //     vout: txo.vout,
        //     amt: txo.amt.toString(),
        //     id: txo.tick || txo.id,
        //     script: txo.script,
        //     satoshis: 1,
        //   } as TokenUtxo;
        // });

        if (!payPk.value) {
          throw new Error("Missing payment private key");
        }
        if (!ordPk.value) {
          throw new Error("Missing ordinal private key");
        }

        if (!fundingAddress.value) {
          throw new Error("Missing funding address");
        }

        if (!ordAddress.value) {
          throw new Error("Missing ordinal address");
        }

        const paymentPk = PrivateKey.fromWif(payPk.value);
        // const payScript = Buffer.from(new P2PKH().lock(fundingAddress.value).toHex(), 'hex').toString('base64')
        // console.log({payScript})
        const paymentUtxos = utxos.value || [];

        // prepare inputs
        let enough = false;
        const protocol = ticker.tick ? TokenType.BSV20 : TokenType.BSV21;
        let offset = 0;
        const inputTokens: TokenUtxo[] = [];
        while (!enough && amount.value) {
          const utxos = await fetchTokenUtxos(
            protocol,
            (ticker.tick || ticker.id) as string,
            ordAddress.value,
            100,
            offset,
          );
          inputTokens.push(...utxos);
          offset += utxos.length;

          const results = selectTokenUtxos(
            inputTokens,
            Number(amount.value),
            ticker.dec || 0,
            {
              inputStrategy: TokenSelectionStrategy.LargestFirst,
              outputStrategy: TokenSelectionStrategy.LargestFirst,
            },
          );
          console.log({ results });

          enough = results.isEnough;
          if (utxos.length === 0) {
            console.log("No more utxos to select");
            break;
          }
        }

        // const sendAmountTokenSats = Math.floor(Number(amount.value) * 10 ** dec);

        const transferTx = await airdropBsv20(
          Number(amount.value),
          protocol,
          paymentUtxos,
          inputTokens,
          paymentPk,
          fundingAddress.value,
          PrivateKey.fromWif(ordPk.value),
          ordAddress.value,
          ticker,
          addresses.value,
          excludeAdresses.value,
        );
        airdroppingStatus.value = FetchStatus.Success;

        // Get only the PendingTransaction fields from the ReviewPendingTransaction which extends it with extra stuff we dont need right now
        setPendingTxs([transferTx]);

        if (!reviewMode.value) {
          // If not in review mode, call handleReview instead
          await handleReview(e);
          return;
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to create airdrop", toastErrorProps);
        airdroppingStatus.value = FetchStatus.Error;
      }
    },
    [reviewMode.value, destinationTickers.value, destinationBsv21Ids.value, isEqualAllocation, addresses.value, amount.value, balance, airdroppingStatus, router, type, id, payPk.value, ordPk.value, fundingAddress.value, ordAddress.value, utxos.value, airdropBsv20, excludeAdresses.value, setPendingTxs, handleReview],
  );

  const loadTemplate = useCallback(async () => {
    // ${MARKET_API_HOST}/airdrop/3
    const url = `${MARKET_API_HOST}/airdrop/3`;
    const { promise } = http.customFetch<string[]>(url);
    const template = await promise;
    addresses.value = template.join(",");
  }, [addresses]);

  // placeholder should show the number of decimals as zeroes
  const amtPlaceholder = useMemo(() => {
    return dec > 0 ? `0.${"0".repeat(dec)}` : "0";
  }, [dec]);

  const [clickedInside, setClickedInside] = useState(false);

  const handleModalClick = () => {
    if (!clickedInside) {
      onClose();
    }
    setClickedInside(false);
  };

  const handleModalContentMouseDown = () => {
    setClickedInside(true);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between w-full font-mono text-lg uppercase tracking-widest text-zinc-200">
            <span className="flex items-center gap-3">
              <Rocket className="w-5 h-5 text-green-500" />
              {reviewMode.value ? "Review Airdrop" : `Airdrop ${sym || id}`}
            </span>
            <button
              type="button"
              className="text-xs font-mono text-zinc-500 hover:text-green-400 transition cursor-pointer"
              onClick={setAmountToBalance}
            >
              Balance: {balance} {type === AssetType.BSV21 ? sym : id}
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 relative">
          {!reviewMode.value && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder={amtPlaceholder}
                  max={balance}
                  value={amount.value === "0" ? "" : amount.value}
                  onChange={(e) => {
                    if (
                      e.target.value === "" ||
                      Number.parseFloat(e.target.value) <= balance
                    ) {
                      amount.value = e.target.value;
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span>{allocation.value} Allocation</span>
                  <span className="text-zinc-600 text-xs normal-case">
                    {allocation.value === Allocation.Equal
                      ? "- distribute tokens equally to all addresses"
                      : "- based on % of total supply held by each address"}
                  </span>
                </Label>
                <select
                  className="flex h-9 w-full border border-zinc-800 bg-zinc-900 px-3 py-1 font-mono text-sm text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500"
                  value={allocation.value}
                  onChange={(e) => {
                    allocation.value = e.target.value as Allocation;
                  }}
                >
                  {ALLOCATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>BSV20 Destination Tickers (comma separated)</Label>
                <Input
                  type="text"
                  placeholder="RUG, PEPE, EGG, LOVE, SHGR"
                  value={destinationTickers.value}
                  onChange={(e) => {
                    destinationTickers.value = e.target.value;
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>BSV21 Destination Token IDs (comma separated)</Label>
                <Input
                  type="text"
                  placeholder="e6d40ba206340aa94ed40fe1a8adcd722c08c9438b2c1dd16b4527d561e848a2_0"
                  value={destinationBsv21Ids.value}
                  onChange={(e) => {
                    destinationBsv21Ids.value = e.target.value;
                  }}
                />
              </div>

              {(destinationTickers.value.length > 0 ||
                destinationBsv21Ids.value.length > 0) && (
                <div className="space-y-2">
                  <Label className="flex items-center justify-end gap-2">
                    <HelpCircle className="w-3 h-3 text-zinc-500" title="Holders per ticker, largest first." />
                    Number of Holders
                  </Label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={numOfHolders.value === "0" ? "" : numOfHolders.value}
                    max={1000}
                    onChange={(e) => {
                      numOfHolders.value = e.target.value;
                    }}
                  />
                </div>
              )}

              <div className="border-t border-zinc-800 my-4" />

              {isEqualAllocation && (
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    Addresses (comma separated)
                    <button
                      type="button"
                      className="text-green-500 hover:text-green-400 transition cursor-pointer"
                      onClick={loadTemplate}
                    >
                      Load Registered Users
                    </button>
                  </Label>
                  <Input
                    type="text"
                    placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                    value={addresses.value}
                    onChange={(e) => {
                      addresses.value = e.target.value;
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Exclude Addresses (comma separated)</Label>
                <Input
                  type="text"
                  placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                  value={excludeAdresses.value}
                  onChange={(e) => {
                    excludeAdresses.value = e.target.value;
                  }}
                />
              </div>
            </div>
          )}

          {reviewMode.value && (
            <div className="space-y-4">
              <div className="flex justify-between font-mono text-xs uppercase tracking-wider text-zinc-500">
                <span>Destination ({destinations.value.length})</span>
                <span>Amount</span>
              </div>
              <div className="border border-zinc-800 bg-zinc-900/50 max-h-48 overflow-y-auto">
                {destinations.value.map((dest) => (
                  <div
                    key={`destination-${dest.address}`}
                    className="flex justify-between px-3 py-2 border-b border-zinc-800 last:border-b-0 font-mono text-xs text-zinc-400"
                  >
                    <span className="truncate max-w-[280px]">{dest.address}</span>
                    <span className="whitespace-nowrap text-zinc-200">
                      {dest.receiveAmt} {sym || id}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-mono text-sm border-t border-zinc-800 pt-3">
                <span className="text-zinc-500">Indexing Fees</span>
                <span className="text-zinc-200">{toBitcoin(indexingFees.value || 0)} BSV</span>
              </div>
              {changeTokenAmount.value > 0n && (
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-zinc-500">Change Tokens</span>
                  <span className="text-zinc-200">
                    {changeTokenAmount.value.toString()} {sym || id}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            {reviewMode.value && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reviewMode.value = false;
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              type="submit"
              disabled={airdroppingStatus.value === FetchStatus.Loading}
            >
              {airdroppingStatus.value === FetchStatus.Loading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {reviewMode.value
                ? airdroppingStatus.value === FetchStatus.Loading
                  ? "Raining..."
                  : "Confirm"
                : "Review"}
            </Button>
          </div>

          <Meteors number={20} />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AirdropTokensModal;

async function fetchTokenDetails(tokenId: string): Promise<Ticker> {
  const hasUnderscore = tokenId.includes("_");
  const url = `${API_HOST}/api/bsv20/${hasUnderscore ? "id" : "tick"}/${tokenId}`;
  const response = await fetch(url);
  return (await response.json()) as Ticker;
}

async function fetchHolders(
  tokenId: string,
  numHolders: number,
): Promise<Holder[]> {
  const hasUnderscore = tokenId.includes("_");
  const url = `${API_HOST}/api/bsv20/${hasUnderscore ? "id" : "tick"}/${tokenId}/holders?limit=${numHolders}`;
  const response = await fetch(url);
  return (await response.json()) as Holder[];
}

const calculateEqualDistributions = async (
  sendAmountTokenSats: number,
  bsv20Tickers: string,
  bsv21Ids: string,
  numHolders: number,
  additionalAddresses: string[],
  excludeAdresses: string[],
  decimals: number,
): Promise<Distribution[]> => {
  const allTokens = [...bsv20Tickers.split(","), ...bsv21Ids.split(",")]
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const tokenDetails = await Promise.all(allTokens.map(fetchTokenDetails));
  const holderSets = await Promise.all(
    tokenDetails.map((details) =>
      fetchHolders((details.id || details.tick) as string, numHolders),
    ),
  );

  const holders = holderSets.flat();

  // add additional addresses to holders
  const additionalHolders = additionalAddresses.map((address) => {
    return { address, amt: "0" };
  });

  const finalHolders = holders.concat(additionalHolders).filter((holder) => {
    return !excludeAdresses.includes(holder.address);
  });

  const totalHolders = finalHolders.length;

  const tsatPerHolder = Math.floor(sendAmountTokenSats / totalHolders);
  const distributions: Distribution[] = [];

  for (const holder of finalHolders) {
    distributions.push({
      address: holder.address,
      tokens: toToken(tsatPerHolder, decimals),
    });
  }

  return distributions;
};

const calculateWeightedDistributions = async (
  sendAmountTokenSats: number,
  bsv20Tickers: string,
  bsv21Ids: string,
  numHolders: number,
  excludeAdresses: string[],
  decimals: number,
): Promise<Distribution[]> => {
  const allTokens = [...bsv20Tickers.split(","), ...bsv21Ids.split(",")]
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const allTokenDetails = await Promise.all(allTokens.map(fetchTokenDetails));
  let allHolders: CombinedHolder[] = [];
  let totalWeightedHoldings = 0;

  for (const details of allTokenDetails) {
    const holders = await fetchHolders(
      details.id || (details.tick as string),
      numHolders,
    );
    const maxSupply = BigInt(details.supply || details.amt);
    const tokenTick = (details.tick || details.id) as string;

    for (const holder of holders) {
      const holderAmt = BigInt(holder.amt);
      const weightedAmt = Number(holderAmt) / Number(maxSupply);
      totalWeightedHoldings += weightedAmt;

      const existingHolder = allHolders.find(
        (h) => h.address === holder.address,
      );
      if (existingHolder) {
        existingHolder.totalWeightedAmt += weightedAmt;
        existingHolder.tokens[tokenTick] = {
          amt: Number(holderAmt),
          weightedAmt,
        };
      } else {
        allHolders.push({
          address: holder.address,
          totalWeightedAmt: weightedAmt,
          tokens: { [tokenTick]: { amt: Number(holderAmt), weightedAmt } },
        });
      }
    }
  }

  allHolders.sort((a, b) => b.totalWeightedAmt - a.totalWeightedAmt);

  // Remove excluded addresses
  allHolders = allHolders.filter(
    (holder) => !excludeAdresses.includes(holder.address),
  );

  const distributions: Distribution[] = [];
  let totalAllocated = 0;

  for (const holder of allHolders) {
    const weightedAmt = Math.floor(
      (sendAmountTokenSats * holder.totalWeightedAmt) / totalWeightedHoldings,
    );
    if (weightedAmt > 0) {
      distributions.push({
        address: holder.address,
        tokens: toToken(weightedAmt, decimals),
      });
      totalAllocated += weightedAmt;
    }
  }

  return distributions;
};
