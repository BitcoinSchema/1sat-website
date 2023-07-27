import { FetchStatus } from "@/components/pages";
import { toBase64 } from "@/utils/string";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import * as http from "../../utils/httpClient";

export type MAP = {
  [key: string]: any;
};

type ContextValue = {
  getArtifactsByCollectionId: (collectionId: string) => Promise<void>;
  fetchCollectionStatus: FetchStatus;
  collection?: any[]; // BmapTx[];
  getBmapTxById: (id: string) => Promise<any>;
};

const BitcoinSchemaContext = React.createContext<ContextValue | undefined>(
  undefined
);

interface Props {
  children?: ReactNode;
}
export const BitcoinSchemaProvider: React.FC<Props> = (props) => {
  const [fetchCollectionStatus, setFetchCollectionStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  const [collection, setCollection] = useState<any[]>(); // BmapTx[]

  const generateQuery = (collectionId: string, page: number = 1) => {
    const itemsPerPage = 60;
    const collectionQuery = {
      v: 3,
      q: {
        find: {
          "MAP.collection": collectionId,
        },
        limit: itemsPerPage,
        skip: (page - 1) * itemsPerPage,
        sort: { timestamp: -1 },
      },
    };

    const collectionQueryStr = JSON.stringify(collectionQuery);
    return toBase64(collectionQueryStr);
  };

  const getArtifactsByCollectionId = useCallback(
    async (collectionId: string) => {
      const q = generateQuery(collectionId, 1);
      setFetchCollectionStatus(FetchStatus.Loading);
      try {
        const { promise } = http.customFetch<any>(`https://b.map.sv/q/${q}`);

        const results = await promise;
        setFetchCollectionStatus(FetchStatus.Success);

        setCollection(
          results.c.filter(
            (
              c: any // BmapTx
            ) =>
              c.MAP &&
              c.MAP.some((m: any) => (m?.jig as string).endsWith("_o2"))
          )
        );
      } catch (e) {
        setFetchCollectionStatus(FetchStatus.Error);
        console.error("failed to get boost outs", e);
      }
    },
    [setCollection]
  );

  const getBmapTxById = useCallback(async (txid: string): Promise<any> => {
    const r = await fetch(`https://b.map.sv/tx/${txid}/bmap`, {
      headers: { Accept: "application/json" },
    });
    return await r.json();
  }, []);

  const value = useMemo(
    () => ({
      collection,
      fetchCollectionStatus,
      getArtifactsByCollectionId,
      getBmapTxById,
    }),
    [
      collection,
      fetchCollectionStatus,
      getArtifactsByCollectionId,
      getBmapTxById,
    ]
  );

  return <BitcoinSchemaContext.Provider value={value} {...props} />;
};

export const useBitcoinSchema = (): ContextValue => {
  const context = useContext(BitcoinSchemaContext);
  if (context === undefined) {
    throw new Error(
      "useBitcoinSchema must be used within an BitcoinSchemaProvider"
    );
  }
  return context;
};
