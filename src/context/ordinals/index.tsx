import { FetchStatus, toastErrorProps } from "@/components/pages";
import { SortListingsBy } from "@/components/pages/market/listings";
import { readFileAsBase64 } from "@/utils/file";

import { createChangeOutput, signPayment } from "@/utils/transaction";
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
import { RemoteSigner, Utxo, createOrdinal } from "js-1sat-ord";
import { head, sumBy } from "lodash";
import Router from "next/router";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import * as http from "../../utils/httpClient";
import { useBitsocket } from "../bitsocket";
import { ORDS_PER_PAGE, PendingTransaction, useWallet } from "../wallet";

export const API_HOST = `https://ordinals.gorillapool.io`;
export const ORDFS = `https://ordfs.network`;

// type MarketResponse = {
//   txid: string;
//   vout: number;
//   height: number;
//   idx: number;
//   price: number;
//   payout: string;
//   script: string;
//   origin: string;
// };

export const enum SortBy {
  PC = "pct_minted",
  Available = "available",
  Tick = "tick",
  Max = "max",
  Height = "height",
}

export const enum Dir {
  ASC = "asc",
  DESC = "desc",
}

type GPFile = {
  hash: string;
  size: number;
  type: string;
};

export enum Bsv20Status {
  Invalid = -1,
  Pending = 0,
  Valid = 1,
}

export class TxoData {
  types?: string[];
  insc?: Inscription;
  map?: { [key: string]: any };
  b?: File;
  sigma?: SIGMA[];
  list?: {
    price: number;
    payout: string;
  };
  bsv20?: BSV20;
}

export interface Claim {
  sub: string;
  type: string;
  value: string;
}

type Origin = {
  data?: TxoData;
  num?: number;
  outpoint: string;
  map?: { [key: string]: any };
};

export interface OrdUtxo extends Utxo {
  txid: string;
  vout: number;
  outpoint: string;
  satoshis: number;
  accSats: number;
  owner?: string;
  script: string;
  spend?: string;
  origin?: Origin;
  height: number;
  idx: number;
  data?: TxoData;
  //file?: GPFile;
  // origin?: string;
  // outpoint: string;
  // listing: boolean;
  // price?: number;
  // SIGMA?: SIGMA[];
  // num: number | undefined;
  // MAP?: any; // MAP
  // payout?: string; // base64 encoded == moved to data.list.payout
  // lock: string;
}

// {"vin":0,"valid":true,"address":"18z9RxyXLzNLsJa5WsheDiqBhSrgf9qEr3","algorithm":"BSM","signature":"HxEudhvOxqPMC867Y7sZ2/LUxT8srQw9zlQiINLaJhRiA4QFBCVnj9IKJglAgZuM8ncTT/zXcWS9h9PUkF61hHQ="}
export type SIGMA = {
  vin: number;
  valid: boolean;
  address: string;
  algorithm: string;
  signature: string;
};

type BaseType = {
  txid?: string;
  vout?: 0;
  height?: 792954;
  idx?: 23726;
};

export interface LRC20 extends BaseType {
  op: string;
  id: string;
  amt: number;
  p: "lrc-20";
}

export interface BSV20TXO extends BaseType {
  amt: string;
  tick: string;
  price: string;
  pricePer: string;
  pricePerUnit: string;
  spend: string;
  owner: string;
  op: string;
  payout: string | null;
  outpoint: string;
  reason: string | null;
  listing: boolean;
  id: string;
  status: Bsv20Status;
}
export interface BSV20 extends BaseType {
  // idx: string;
  // p: string;
  // op: string;
  // amt?: string;
  // tick: string;
  // max?: string;
  // dec?: string;
  // lim?: string;
  // supply?: string;
  // valid: boolean | null;
  // height?: number;
  // txid?: string;
  // reason?: string;
  // pctMinted: number;

  max?: string;
  lim?: string;
  dec?: number;
  supply?: string;

  available?: string;
  pct_minted?: string;
  reason?: null;
  pending?: string;

  id?: string;
  p: string;
  op: string;
  tick?: string;
  amt: string;
  status?: Bsv20Status;
}

export interface Ticker extends BSV20 {
  accounts: number;
  included: boolean;
  fundAddress: string;
  fundBalance: string;
  fundTotal: string;
  fundUsed: string;
  pendingOps: string;
}

type Stats = {
  ord: number;
  latest?: number;
  "bsv20-deploy": number;
  bsv20v2: number;
  locks: number;
  opns: number;
  market: number;
  market_spends: number;
};

export interface Inscription {
  json?: any;
  text?: string;
  words?: string[];
  file: GPFile;
}

type ContextValue = {
  bsv20s?: BSV20[];
  getBsv20: (page: number, sortBy: SortBy, dir: Dir) => Promise<void>;
  fetchBsv20Status: FetchStatus;
  activity?: OrdUtxo[];
  getActivity: (page: number) => Promise<void>;
  fetchActivityStatus: FetchStatus;
  getListings: (
    page: number,
    sortBy: SortListingsBy,
    dir: Dir
  ) => Promise<void>;
  getListing: (outPoint: string) => Promise<void>;
  fetchListingsStatus: FetchStatus;
  fetchListingStatus: FetchStatus;
  fetchInscriptionsStatus: FetchStatus;
  listing?: OrdUtxo;
  listings?: OrdUtxo[];
  filteredListings?: OrdUtxo[];
  setFetchInscriptionsStatus: (status: FetchStatus) => void;
  getArtifactsByTxId: (txid: string) => Promise<OrdUtxo[]>;
  getArtifactsByOrigin: (txid: string) => Promise<OrdUtxo[]>;
  getArtifactByOrigin: (txid: string) => Promise<OrdUtxo>;
  getArtifactByInscriptionId: (
    inscriptionId: string
  ) => Promise<OrdUtxo | undefined>;
  fetchStatsStatus: FetchStatus;
  stats?: Stats | undefined;
  getStats: () => void;
  buyArtifact: (outPoint: string) => Promise<void>;
  cancelListing: (ordUtxo: OrdUtxo) => Promise<void>;
  inscribeUtf8: (
    text: string,
    contentType: string,
    utxo: Utxo,
    iterations?: number
  ) => Promise<PendingTransaction>;
  inscribeStatus: FetchStatus;
  inscribeFile: (
    utxo: Utxo,
    file: File,
    metadata?: any // MAP
  ) => Promise<PendingTransaction | undefined>;
};

const OrdinalsContext = React.createContext<ContextValue | undefined>(
  undefined
);

interface Props {
  children?: ReactNode;
}
export const OrdinalsProvider: React.FC<Props> = (props) => {
  const { lastSettledEvent } = useBitsocket();
  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchActivityStatus, setFetchActivityStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchListingsStatus, setFetchListingsStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchStatsStatus, setFetchStatsStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchListingStatus, setFetchListingStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchInscriptionsStatus, setFetchInscriptionsStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  const [listing, setListing] = useState<OrdUtxo>();
  const [listings, setListings] = useState<OrdUtxo[]>();
  const [activity, setActivity] = useState<OrdUtxo[]>();
  const [stats, setStats] = useState<Stats>();
  const [bsv20s, setBsv20s] = useState<BSV20[]>();
  const [fetchBsv20Status, setFetchBsv20Status] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const {
    changeAddress,
    fundingUtxos,
    ordAddress,
    payPk,
    ordPk,
    setPendingTransaction,
  } = useWallet();

  type ChainInfo = {
    chain: string;
    blocks: number;
    headers: number;
    bestblockhash: string;
    difficulty: number;
    mediantime: number;
    verificationprogress: number;
    chainwork: string;
    pruned: boolean;
  };

  const lastSettledBlock = useMemo(() => {
    if (lastSettledEvent) {
      return parseInt(lastSettledEvent as any);
    }
    return 0;
  }, [lastSettledEvent]);

  useEffect(() => {
    if (lastSettledBlock > 0 && lastSettledBlock !== stats?.ord) {
      const newStats = {
        ...stats,
        ord: lastSettledBlock,
      } as Stats;
      setStats(newStats);
    }
  }, [lastSettledBlock, setStats, stats]);

  const getStats = useCallback(async () => {
    setFetchStatsStatus(FetchStatus.Loading);
    // https://api.whatsonchain.com/v1/bsv/main/chain/info
    const resp = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/chain/info`
    );

    const chainInfo = (await resp.json()) as ChainInfo;

    const resp2 = await fetch(`${API_HOST}/api/stats`);
    try {
      // {"settled":822461,"market":822866,"ord":822866,"bsv20v2":822866,"bsv20-deploy":822866,"locks":822866,"market_spends":822866,"opns":822866}
      const s = (await resp2.json()) as Stats;

      setStats({ ...s, latest: chainInfo.blocks });
      setFetchStatsStatus(FetchStatus.Success);
    } catch (e) {
      setFetchStatsStatus(FetchStatus.Error);
    }
  }, [setFetchStatsStatus, setStats]);

  useEffect(() => {
    const fire = async () => {
      await getStats();
    };
    if (fetchStatsStatus === FetchStatus.Idle) {
      fire();
    }
  }, [fetchStatsStatus, getStats]);

  const getListing = useCallback(
    async (outPoint: string) => {
      setFetchListingStatus(FetchStatus.Loading);
      try {
        const { promise } = http.customFetch<any>(
          `${API_HOST}/api/inscriptions/${outPoint}`
        );

        const result = await promise;
        setFetchListingStatus(FetchStatus.Success);

        setListing(result);
      } catch (e) {
        setFetchListingStatus(FetchStatus.Error);
        console.error("failed to get listings", e);
      }
    },
    [setFetchListingStatus, setListing]
  );

  const getListings = useCallback(
    async (page: number, sortBy: SortListingsBy, dir: Dir) => {
      setFetchListingsStatus(FetchStatus.Loading);
      try {
        const offset = (page - 1) * ORDS_PER_PAGE;

        const { promise } = http.customFetch<OrdUtxo[]>(
          `${API_HOST}/api/market?limit=${ORDS_PER_PAGE}&offset=${offset}&sort=${sortBy}&dir=${dir}`
        );

        const results = await promise;
        setFetchListingsStatus(FetchStatus.Success);
        setListings(results);
      } catch (e) {
        setFetchListingsStatus(FetchStatus.Error);
        console.error("failed to get listings", e);
      }
    },
    [setFetchListingsStatus, setListings]
  );

  const filteredListings = useMemo(() => {
    // console.log("Listings:", listings)
    return (listings || []).filter(
      (l) =>
        !txidBlacklist.includes(l.txid) &&
        l.origin?.data?.insc?.file.hash &&
        !fileHashBlacklist.includes(l.origin?.data!.insc.file.hash) &&
        (!l.origin.data.sigma ||
          !l.origin.data.sigma.some((s) => sigmaBlacklist.includes(s.address)))
    );
  }, [listings]);

  const blockedListings = useMemo(() => {
    return (listings || []).filter(
      (l) =>
        txidBlacklist.includes(l.txid) ||
        (l.origin?.data?.sigma &&
          l.origin.data.sigma.some((s) => sigmaBlacklist.includes(s.address)))
    );
  }, [listings]);

  const suspiciousListings = useMemo(() => {
    return (listings || []).filter(
      (l) =>
        l &&
        l.origin?.data?.sigma &&
        l.origin?.data?.sigma.some((s) => sigmaGreylist.includes(s.address))
    );
  }, [listings]);

  // useEffect(() => {
  //   console.log({ blockedListings, suspiciousListings });
  // }, [blockedListings, suspiciousListings]);

  const inscribeFile = useCallback(
    async (utxo: Utxo, file: File, metadata?: any) => {
      if (!file?.type || !utxo) {
        throw new Error("File or utxo not provided");
      }

      setInscribeStatus(FetchStatus.Loading);
      try {
        const fileAsBase64 = await readFileAsBase64(file);
        try {
          setInscribeStatus(FetchStatus.Loading);

          const tx = await handleInscribing(
            payPk!,
            fileAsBase64,
            file.type,
            ordAddress!,
            changeAddress!,
            utxo,
            metadata
          );
          const satsIn = utxo!.satoshis;
          const satsOut = Number(tx.satoshis_out());
          if (satsIn && satsOut) {
            const fee = satsIn - satsOut;

            if (fee < 0) {
              console.error("Fee inadequate");
              toast.error("Fee Inadequate", toastErrorProps);
              setInscribeStatus(FetchStatus.Error);
              throw new Error("Fee inadequate");
            }
            const result = {
              rawTx: tx.to_hex(),
              size: tx.get_size(),
              fee,
              numInputs: tx.get_ninputs(),
              numOutputs: tx.get_noutputs(),
              txid: tx.get_id_hex(),
              inputTxid: tx.get_input(0)?.get_prev_tx_id_hex(),
              metadata,
            } as PendingTransaction;
            console.log(Object.keys(result));

            setPendingTransaction(result);
            setInscribeStatus(FetchStatus.Success);
            return result;
          }
        } catch (e) {
          console.error(e);
          setInscribeStatus(FetchStatus.Error);
          throw e;
        }
      } catch (e) {
        setInscribeStatus(FetchStatus.Error);
        toast.error("Failed to inscribe " + e, toastErrorProps);
        console.error(e);
        throw e;
      }
    },
    [setInscribeStatus, payPk, ordAddress, changeAddress, setPendingTransaction]
  );

  const inscribeUtf8 = useCallback(
    async (text: string, contentType: string, utxo: Utxo, iterations = 1) => {
      const fileAsBase64 = Buffer.from(text).toString("base64");
      const tx = await handleInscribing(
        payPk!,
        fileAsBase64,
        contentType,
        ordAddress!,
        changeAddress!,
        utxo
      );

      const result = {
        rawTx: tx.to_hex(),
        size: tx.get_size(),
        fee: utxo!.satoshis - Number(tx.satoshis_out()),
        numInputs: tx.get_ninputs(),
        numOutputs: tx.get_noutputs(),
        txid: tx.get_id_hex(),
        inputTxid: tx.get_input(0)!.get_prev_tx_id_hex(),
        iterations,
      } as PendingTransaction;
      setPendingTransaction(result);
      return result;
    },
    [setPendingTransaction, payPk, ordAddress, changeAddress]
  );

  const getActivity = useCallback(
    async (page: number) => {
      setFetchActivityStatus(FetchStatus.Loading);
      try {
        const offset = (page - 1) * ORDS_PER_PAGE;

        const { promise } = http.customFetch<any>(
          `${API_HOST}/api/market?limit=${ORDS_PER_PAGE}&offset=${offset}`
        );

        const results = await promise;
        setFetchActivityStatus(FetchStatus.Success);

        setActivity(results);
      } catch (e) {
        setFetchActivityStatus(FetchStatus.Error);
        console.error("failed to get listings", e);
      }
    },
    [setActivity, setFetchActivityStatus]
  );

  const getBsv20 = useCallback(
    async (page: number, sortBy: SortBy, dir: Dir) => {
      setFetchBsv20Status(FetchStatus.Loading);
      try {
        const offset = (page - 1) * ORDS_PER_PAGE;

        console.log("Searching for BSV20 inscriptions", { offset });

        // example
        //           `${API_HOST}/api/inscriptions/search?q=${Buffer.from(JSON.stringify({map: {type: 'collection'}})).toString('base64')}`

        // Available values : pct_minted, available, tick, max, height
        const { promise } = http.customFetch<BSV20[]>(
          `${API_HOST}/api/bsv20?limit=${ORDS_PER_PAGE}&offset=${offset}&sort=${sortBy}&dir=${dir}`
        );

        const results = await promise;
        setFetchBsv20Status(FetchStatus.Success);
        console.log({ results });

        // now get each of the tickers in the list
        // const tickers = await Promise.all(results.map(async (r: any) => {
        //   const { promise } = http.customFetch<any>(
        //     `${API_HOST}/api/bsv20/tick/${encodeURIComponent(r.origin.)}`
        //   );
        //   return await promise;
        // }));

        // console.log({tickers})

        setBsv20s(results);
      } catch (e) {
        setFetchBsv20Status(FetchStatus.Error);
        console.error("failed to get listings", e);
      }
    },
    [setBsv20s, setFetchBsv20Status]
  );

  const getInscriptionsById = useCallback(
    async (txidOrOrigin: string): Promise<OrdUtxo[]> => {
      let [txid, vout] = txidOrOrigin.split("_");
      let suffix = "";
      if (vout) {
        suffix += `${txid}_${vout}`;
      } else {
        suffix += `txid/${txid}`;
      }

      setFetchInscriptionsStatus(FetchStatus.Loading);
      try {
        const r = await fetch(`${API_HOST}/api/inscriptions/${suffix}`);
        const results = await r.json();
        const inscriptions = Array.isArray(results)
          ? (results as OrdUtxo[])
          : [results as OrdUtxo];
        // const inscriptions = await r.json()) as OrdUtxo[];
        setFetchInscriptionsStatus(FetchStatus.Success);
        // let utxo = res.find((u: any) => u.value > 1);
        // TODO: How to get script?

        return inscriptions;
      } catch (e) {
        setFetchInscriptionsStatus(FetchStatus.Error);

        throw e;
      }
    },
    []
  );

  const getInscriptionByOrigin = useCallback(
    async (origin: string): Promise<OrdUtxo> => {
      setFetchInscriptionsStatus(FetchStatus.Loading);
      try {
        const r = await fetch(`${API_HOST}/api/inscriptions/${origin}/latest`);
        const inscription = (await r.json()) as OrdUtxo;
        setFetchInscriptionsStatus(FetchStatus.Success);
        return inscription;
      } catch (e) {
        setFetchInscriptionsStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchInscriptionsStatus]
  );

  const getInscriptionByInscriptionId = useCallback(
    async (inscriptionId: string): Promise<OrdUtxo> => {
      setFetchInscriptionsStatus(FetchStatus.Loading);
      try {
        const r = await fetch(`${API_HOST}/api/origins/num/${inscriptionId}`);
        const inscription = (await r.json()) as OrdUtxo;
        setFetchInscriptionsStatus(FetchStatus.Success);
        return inscription;
      } catch (e) {
        setFetchInscriptionsStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchInscriptionsStatus]
  );

  const getArtifactByOrigin = useCallback(
    async (origin: string): Promise<OrdUtxo> => {
      return getInscriptionByOrigin(origin);
    },
    [getInscriptionByOrigin]
  );

  const getArtifactsByTxId = useCallback(
    async (txidOrOrigin: string): Promise<OrdUtxo[]> => {
      const gpInscriptions = await getInscriptionsById(txidOrOrigin);

      if (!gpInscriptions) {
        return [];
      }
      return gpInscriptions.map((i) => {
        return {
          vout: i.vout,
          satoshis: 1,
          txid: i.txid,
          file: i.origin?.data?.insc?.file,
          origin: i.origin?.outpoint,
          num: i.origin?.num,
          outpoint: i.outpoint,
          accSats: i.accSats,
          script: i.script,
          height: i.height,
          idx: i.idx,
        } as OrdUtxo;
      });
    },
    [getInscriptionsById]
  );

  const getArtifactByInscriptionId = useCallback(
    async (inscriptionId: string): Promise<OrdUtxo | undefined> => {
      return await getInscriptionByInscriptionId(inscriptionId);
    },
    [getInscriptionByInscriptionId]
  );

  const cancelListing = useCallback(
    async (listingUtxo: OrdUtxo) => {
      if (!payPk || !ordAddress || !ordPk || !changeAddress) {
        return;
      }

      const paymentUtxo = head(
        fundingUtxos?.sort((a, b) => (a.satoshis > b.satoshis ? -1 : 1))
      );

      if (!paymentUtxo) {
        console.log("no payment utxo");
        return;
      }
      const paymentPk = PrivateKey.from_wif(payPk);
      const ordinalPk = PrivateKey.from_wif(ordPk);
      console.log("cancel listing", listingUtxo);
      const listingTxid = head(listingUtxo.outpoint.split("_"));
      if (!listingTxid) {
        console.log("no listing txid");
        return;
      }

      const cancelTx = new Transaction(1, 0);

      const { promise } = http.customFetch<OrdUtxo>(
        `${API_HOST}/api/market/${listingUtxo.outpoint}`
      );

      const { script } = await promise;

      let ordIn = new TxIn(
        Buffer.from(listingTxid, "hex"),
        0,
        Script.from_asm_string("")
      );
      cancelTx.add_input(ordIn);

      let utxoIn = new TxIn(
        Buffer.from(paymentUtxo.txid, "hex"),
        paymentUtxo.vout,
        Script.from_asm_string("")
      );
      cancelTx.add_input(utxoIn);

      const destinationAddress = P2PKHAddress.from_string(ordAddress);
      const satOut = new TxOut(
        BigInt(1),
        destinationAddress.get_locking_script()
      );
      cancelTx.add_output(satOut);

      const changeOut = createChangeOutput(
        cancelTx,
        changeAddress,
        paymentUtxo.satoshis
      );
      cancelTx.add_output(changeOut);

      // sign listing to cancel
      const sig = cancelTx.sign(
        ordinalPk,
        SigHash.SINGLE | SigHash.ANYONECANPAY | SigHash.FORKID,
        0,
        Script.from_bytes(Buffer.from(script, "base64")),
        // TODO: Use actual satoshis amount from listing utxo
        BigInt(1)
      );

      ordIn.set_unlocking_script(
        Script.from_asm_string(
          `${sig.to_hex()} ${ordinalPk.to_public_key().to_hex()} OP_1`
        )
      );

      cancelTx.set_input(0, ordIn);

      utxoIn = signPayment(cancelTx, paymentPk, 1, paymentUtxo, utxoIn);
      cancelTx.set_input(1, utxoIn);

      setPendingTransaction({
        rawTx: cancelTx.to_hex(),
        size: cancelTx.get_size(),
        // TODO: Fee comes from locked utxo so we havent calculated it here?
        fee: 0,
        numInputs: cancelTx.get_ninputs(),
        numOutputs: cancelTx.get_noutputs(),
        txid: cancelTx.get_id_hex(),
        marketFee: 0,
        inputTxid: paymentUtxo.txid,
      });

      Router.push("/preview");
    },
    [
      ordPk,
      fundingUtxos,
      changeAddress,
      ordAddress,
      payPk,
      setPendingTransaction,
    ]
  );

  const buyArtifact = useCallback(
    async (outPoint: string) => {
      if (!fundingUtxos || !payPk || !ordAddress || !changeAddress) {
        return;
      }

      // I1 - Ordinal
      // I2 - Funding
      // O1 - Ordinal destination
      // O2 - Payment to lister
      // O3 - Market Fee
      // O4 - Change

      const purchaseTx = new Transaction(1, 0);

      const { promise } = http.customFetch<OrdUtxo>(
        `${API_HOST}/api/txos/${outPoint}?script=true`
      );

      const { script, data, vout, txid } = await promise;
      const { payout, price } = data!.list!;

      console.log(
        { script, payout, vout, txid, price },
        sumBy(fundingUtxos, "satoshis")
      );

      // make sure funding UTXOs can cover price, otherwise show error
      if (
        (price === 0 ? minimumMarketFee + price : price * 1.04) >=
        sumBy(fundingUtxos, "satoshis") + P2PKHInputSize * fundingUtxos.length
      ) {
        toast.error("Not enough Bitcoin!", toastErrorProps);
        Router.push("/wallet");
      }
      const listingInput = new TxIn(
        Buffer.from(txid, "hex"),
        vout,
        Script.from_asm_string("")
      );
      purchaseTx.add_input(listingInput);

      // output 0
      const buyerOutput = new TxOut(
        BigInt(1),
        P2PKHAddress.from_string(ordAddress).get_locking_script()
      );
      purchaseTx.add_output(buyerOutput);

      // output 1
      const payOutput = TxOut.from_hex(
        Buffer.from(payout, "base64").toString("hex")
      );
      purchaseTx.add_output(payOutput);

      // output 2 - change
      const dummyChangeOutput = new TxOut(
        BigInt(0),
        P2PKHAddress.from_string(changeAddress).get_locking_script()
      );
      purchaseTx.add_output(dummyChangeOutput);

      // output 3 - marketFee
      const dummyMarketFeeOutput = new TxOut(
        BigInt(0),
        P2PKHAddress.from_string(marketAddress).get_locking_script()
      );
      purchaseTx.add_output(dummyMarketFeeOutput);

      // OMFG this has to be "InputOutput" and then second time is InputOutputs
      let preimage = purchaseTx.sighash_preimage(
        SigHash.InputOutput,
        0,
        Script.from_bytes(Buffer.from(script, "base64")),
        BigInt(1) //TODO: use amount from listing
      );

      listingInput.set_unlocking_script(
        Script.from_asm_string(
          `${purchaseTx.get_output(0)!.to_hex()} ${purchaseTx
            .get_output(2)!
            .to_hex()}${purchaseTx.get_output(3)!.to_hex()} ${Buffer.from(
            preimage
          ).toString("hex")} OP_0`
        )
      );
      purchaseTx.set_input(0, listingInput);

      // calculate market fee
      let marketFee = price * marketRate;
      if (marketFee === 0) {
        marketFee = minimumMarketFee;
      }

      // Calculate the network fee
      // account for funding input and market output (not added to tx yet)
      let paymentUtxos: Utxo[] = [];
      let satsCollected = 0;
      // initialize fee and satsNeeded (updated with each added payment utxo)
      let fee = calculateFee(1, purchaseTx);
      let satsNeeded = fee + price + marketFee;
      // collect the required utxos
      const sortedFundingUtxos = fundingUtxos.sort((a, b) =>
        a.satoshis > b.satoshis ? -1 : 1
      );
      for (let utxo of sortedFundingUtxos) {
        if (satsCollected < satsNeeded) {
          satsCollected += utxo.satoshis;
          paymentUtxos.push(utxo);

          // if we had to add additional
          fee = calculateFee(paymentUtxos.length, purchaseTx);
          satsNeeded = fee + price + marketFee;
        }
      }

      // Replace dummy change output
      const changeAmt = satsCollected - satsNeeded;

      const changeOutput = new TxOut(
        BigInt(changeAmt),
        P2PKHAddress.from_string(changeAddress).get_locking_script()
      );

      purchaseTx.set_output(2, changeOutput);

      // add output 3 - market fee
      const marketFeeOutput = new TxOut(
        BigInt(marketFee),
        P2PKHAddress.from_string(marketAddress).get_locking_script()
      );
      purchaseTx.set_output(3, marketFeeOutput);

      preimage = purchaseTx.sighash_preimage(
        SigHash.InputOutputs,
        0,
        Script.from_bytes(Buffer.from(script, "base64")),
        BigInt(1)
      );
      //                             f.set_unlocking_script(m.Xf.from_asm_string("".concat(n.get_output(0).to_hex(), " ").concat(n.get_output(2).to_hex()).concat(n.get_output(3).to_hex(), " ").concat(V.from(k).toString("hex"), " OP_0"))),

      listingInput.set_unlocking_script(
        Script.from_asm_string(
          `${purchaseTx.get_output(0)!.to_hex()} ${purchaseTx
            .get_output(2)!
            .to_hex()}${purchaseTx.get_output(3)!.to_hex()} ${Buffer.from(
            preimage
          ).toString("hex")} OP_0`
        )
      );
      purchaseTx.set_input(0, listingInput);

      // create and sign inputs (payment)
      const paymentPk = PrivateKey.from_wif(payPk);

      paymentUtxos.forEach((utxo, idx) => {
        const fundingInput = new TxIn(
          Buffer.from(utxo.txid, "hex"),
          utxo.vout,
          Script.from_asm_string(utxo.script)
        );
        purchaseTx.add_input(fundingInput);

        const sig = purchaseTx.sign(
          paymentPk,
          SigHash.InputsOutputs,
          1 + idx,
          Script.from_asm_string(utxo.script),
          BigInt(utxo.satoshis)
        );

        fundingInput.set_unlocking_script(
          Script.from_asm_string(
            `${sig.to_hex()} ${paymentPk.to_public_key().to_hex()}`
          )
        );

        purchaseTx.set_input(1 + idx, fundingInput);
      });

      setPendingTransaction({
        rawTx: purchaseTx.to_hex(),
        size: purchaseTx.get_size(),
        fee,
        price,
        numInputs: purchaseTx.get_ninputs(),
        numOutputs: purchaseTx.get_noutputs(),
        txid: purchaseTx.get_id_hex(),
        marketFee,
        // TODO: support multiple txids here
        inputTxid: head(paymentUtxos)!.txid,
      });

      Router.push("/preview");
    },
    [changeAddress, fundingUtxos, ordAddress, payPk, setPendingTransaction]
  );

  const value = useMemo(
    () => ({
      bsv20s,
      getBsv20,
      fetchBsv20Status,
      activity,
      getActivity,
      fetchActivityStatus,
      listing,
      listings,
      fetchListingsStatus,
      fetchListingStatus,
      getListings,
      getListing,
      fetchInscriptionsStatus,
      getArtifactsByTxId,
      getArtifactByInscriptionId,
      setFetchInscriptionsStatus,
      getArtifactsByOrigin: getArtifactsByTxId,
      getArtifactByOrigin,
      fetchStatsStatus,
      stats,
      getStats,
      buyArtifact,
      inscribeUtf8,
      inscribeFile,
      inscribeStatus,
      cancelListing,
      filteredListings,
    }),
    [
      bsv20s,
      getBsv20,
      fetchBsv20Status,
      activity,
      getActivity,
      fetchActivityStatus,
      fetchListingStatus,
      listing,
      listings,
      fetchListingsStatus,
      getListings,
      getListing,
      getArtifactsByTxId,
      fetchInscriptionsStatus,
      getArtifactByInscriptionId,
      setFetchInscriptionsStatus,
      getArtifactByOrigin,
      fetchStatsStatus,
      stats,
      getStats,
      buyArtifact,
      inscribeUtf8,
      inscribeFile,
      inscribeStatus,
      cancelListing,
      filteredListings,
    ]
  );

  return <OrdinalsContext.Provider value={value} {...props} />;
};

export const useOrdinals = (): ContextValue => {
  const context = useContext(OrdinalsContext);
  if (context === undefined) {
    throw new Error("useOrdinals must be used within an OrdinalsProvider");
  }
  return context;
};

// Constants
const marketAddress = `15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z`;
const minimumMarketFee = 10000;
const marketRate = 0.04;
const P2PKHInputSize = 148;

const calculateFee = (numPaymentUtxos: number, purchaseTx: Transaction) => {
  const byteSize = Math.ceil(
    P2PKHInputSize * numPaymentUtxos + purchaseTx.to_bytes().byteLength
  );
  return Math.ceil(byteSize * 0.05);
};

const handleInscribing = async (
  payPk: string,
  fileAsBase64: string,
  fileContentType: string,
  ordAddress: string,
  changeAddress: string,
  fundingUtxo: Utxo,
  metadata?: any // MAP
) => {
  const paymentPk = PrivateKey.from_wif(payPk);

  // inscription
  const inscription = {
    dataB64: fileAsBase64,
    contentType: fileContentType,
  };

  // const idKey = PrivateKey.from_wif(
  //   "L1tFiewYRivZciv146HnCPBWzV35BR65dsJWZBYkQsKJ8UhXLz6q"
  // );
  console.log("Inscribing with", { metadata });
  const signer = {
    // idKey // optional id key
    keyHost: "http://localhost:21000",
  } as RemoteSigner;

  try {
    const tx = await createOrdinal(
      fundingUtxo,
      ordAddress,
      paymentPk,
      changeAddress,
      0.9,
      inscription,
      metadata, // optional metadata
      undefined
    );
    return tx;
  } catch (e) {
    throw e;
  }
};

const sigmaBlacklist = [
  "1AFyyfCgx1UtDy1jb9nsXmCFHK6jrnYN2J", // malicious html inscriptions c23a4c99d83d00dffe83bd7453e552ded916c0ed4f5236561c0620959c8b03e7 (his ord address?) funding address is   1HfS57RPC5oSoUMrxHgMwMvJRxJ6oah1Vd
];

const sigmaGreylist = [
  "154YFnNM3cyPN3bY64X8M1stut5Ey54Nun", // malicious inscription listing 7940b0b590df5b97d35d82e1f042374bbb08592ec6f08135e0198187ebf6150a but is this a platform or user signature?
];

const txidBlacklist = [
  "c23a4c99d83d00dffe83bd7453e552ded916c0ed4f5236561c0620959c8b03e7", // malicious html inscription
  "f23e1800f7b989511a48c3110279126cd42e037b6b3e653f89e908953e4e4e4e", // malicious html inscription
  "7940b0b590df5b97d35d82e1f042374bbb08592ec6f08135e0198187ebf6150a", // malicious html inscription
];

const fileHashBlacklist = [
  "e13e4ba81fe85a34b37f99c7083cd210bcc54c617a7e1c500e02ad412b0a7f70",
]; // infinite loop inscription #27349134
