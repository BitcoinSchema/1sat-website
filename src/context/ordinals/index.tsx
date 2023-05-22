import { FetchStatus } from "@/components/pages";
import { MAP } from "bmapjs/types/protocols/map";
import { Utxo } from "js-1sat-ord";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import * as http from "../../utils/httpClient";
import { ORDS_PER_PAGE } from "../wallet";

export const API_HOST = `https://ordinals.gorillapool.io`;

type GPFile = {
  hash: string;
  size: number;
  type: string;
};

export type GPInscription = {
  id: number;
  txid: string;
  vout: number;
  file: GPFile;
  origin: string;
  ordinal?: number;
  height: number;
  idx: number;
  lock: string;
};

export interface OrdUtxo extends Utxo {
  file?: GPFile;
  origin?: string;
  id?: number;
  height?: number;
  MAP?: MAP;
}

export interface Listing extends Utxo {
  id: number | undefined;
  origin: string;
  outPoint: string;
  MAP: MAP;
  file: GPFile;
  listing: boolean;
  price: number;
  payout: string; // base64 encoded
  spend: string;
}

export type BSV20 = {
  p: string;
  op: string;
  amt?: string;
  tick: string;
  max?: string;
  dec?: string;
  lim?: string;
  supply?: string;
  valid: boolean;
};

type ContextValue = {
  bsv20s?: BSV20[];
  getBsv20: (page: number) => Promise<void>;
  fetchBsv20Status: FetchStatus;
  activity?: Listing[];
  getActivity: (page: number) => Promise<void>;
  fetchActivityStatus: FetchStatus;
  getListings: (page: number) => Promise<void>;
  getListing: (outPoint: string) => Promise<void>;
  fetchListingsStatus: FetchStatus;
  fetchListingStatus: FetchStatus;
  fetchInscriptionsStatus: FetchStatus;
  listing?: OrdUtxo;
  listings?: Listing[];
  setFetchInscriptionsStatus: (status: FetchStatus) => void;
  getArtifactsByTxId: (txid: string) => Promise<OrdUtxo[]>;
  getArtifactsByOrigin: (txid: string) => Promise<OrdUtxo[]>;
  getArtifactByInscriptionId: (
    inscriptionId: number
  ) => Promise<OrdUtxo | undefined>;
};

const OrdinalsContext = React.createContext<ContextValue | undefined>(
  undefined
);

interface Props {
  children?: ReactNode;
}
export const OrdinalsProvider: React.FC<Props> = (props) => {
  const [fetchActivityStatus, setFetchActivityStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchListingsStatus, setFetchListingsStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchListingStatus, setFetchListingStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchInscriptionsStatus, setFetchInscriptionsStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  const [listing, setListing] = useState<OrdUtxo>();
  const [listings, setListings] = useState<Listing[]>();
  const [activity, setActivity] = useState<Listing[]>();

  const [bsv20s, setBsv20s] = useState<BSV20[]>();
  const [fetchBsv20Status, setFetchBsv20Status] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const getListing = useCallback(
    async (outPoint: string) => {
      setFetchListingStatus(FetchStatus.Loading);
      try {
        const { promise } = http.customFetch<any>(
          `${API_HOST}/api/market/${outPoint}`
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
    async (page: number) => {
      setFetchListingsStatus(FetchStatus.Loading);
      try {
        const offset = (page - 1) * ORDS_PER_PAGE;

        const { promise } = http.customFetch<any>(
          `${API_HOST}/api/market?limit=${ORDS_PER_PAGE}&offset=${offset}`
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

  const getActivity = useCallback(
    async (page: number) => {
      setFetchActivityStatus(FetchStatus.Loading);
      try {
        const offset = (page - 1) * ORDS_PER_PAGE;

        const { promise } = http.customFetch<any>(
          `${API_HOST}/api/market/recent?limit=${ORDS_PER_PAGE}&offset=${offset}`
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
    async (page: number) => {
      setFetchBsv20Status(FetchStatus.Loading);
      try {
        const offset = (page - 1) * ORDS_PER_PAGE;

        const { promise } = http.customFetch<any>(
          `${API_HOST}/api/bsv20?limit=${ORDS_PER_PAGE}&offset=${offset}`
        );

        const results = await promise;
        setFetchBsv20Status(FetchStatus.Success);

        setBsv20s(results);
      } catch (e) {
        setFetchBsv20Status(FetchStatus.Error);
        console.error("failed to get listings", e);
      }
    },
    [setBsv20s, setFetchBsv20Status]
  );

  const getInscriptionsById = useCallback(
    async (txidOrOrigin: string): Promise<GPInscription[]> => {
      let [txid, vout] = txidOrOrigin.split("_");
      let suffix = "";
      if (vout) {
        suffix += `origin/${txid}_${vout}`;
      } else {
        suffix += `txid/${txid}`;
      }

      setFetchInscriptionsStatus(FetchStatus.Loading);
      try {
        const r = await fetch(`${API_HOST}/api/inscriptions/${suffix}`);
        const inscriptions = (await r.json()) as GPInscription[];
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

  const getInscriptionByInscriptionId = useCallback(
    async (inscriptionId: number): Promise<GPInscription> => {
      setFetchInscriptionsStatus(FetchStatus.Loading);
      try {
        const r = await fetch(`${API_HOST}/api/inscriptions/${inscriptionId}`);
        const inscription = (await r.json()) as GPInscription;
        setFetchInscriptionsStatus(FetchStatus.Success);
        return inscription;
      } catch (e) {
        setFetchInscriptionsStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchInscriptionsStatus]
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
          file: i.file,
          origin: i.origin,
          id: i.id,
        } as OrdUtxo;
      });
    },
    [getInscriptionsById]
  );

  const getArtifactByInscriptionId = useCallback(
    async (inscriptionId: number): Promise<OrdUtxo | undefined> => {
      const gpInscription = await getInscriptionByInscriptionId(inscriptionId);

      if (!gpInscription) {
        return;
      }
      return {
        vout: gpInscription.vout,
        satoshis: 1,
        txid: gpInscription.txid,
        file: gpInscription.file,
        origin: gpInscription.origin,
        id: gpInscription.id,
      } as OrdUtxo;
    },
    [getInscriptionByInscriptionId]
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
