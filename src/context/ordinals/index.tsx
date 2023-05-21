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
  price: number;
  payout: string; // base64 encoded
  spend: string;
}

type ContextValue = {
  getListings: () => Promise<void>;
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
    [setListing]
  );

  const getListings = useCallback(async () => {
    setFetchListingsStatus(FetchStatus.Loading);
    try {
      const { promise } = http.customFetch<any>(`${API_HOST}/api/market`);

      const results = await promise;
      setFetchListingsStatus(FetchStatus.Success);

      setListings(results);
    } catch (e) {
      setFetchListingsStatus(FetchStatus.Error);
      console.error("failed to get listings", e);
    }
  }, [setListings]);

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
