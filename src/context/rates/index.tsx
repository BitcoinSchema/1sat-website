import { FetchStatus } from "@/components/pages";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as http from "../../utils/httpClient";

export type Rate = {
  currency: string; // ToDo make this an enum
  price: number;
  currency_amount?: number;
  price_in_satoshis: number;
};

type ContextValue = {
  fetchRates: (abortFn: Function | undefined) => Promise<boolean>;
  rates: Rate[];
  ratesStatus: FetchStatus;
};

const RatesContext = React.createContext<ContextValue | undefined>(undefined);

interface Props {
  children?: ReactNode;
}

export const RatesProvider: React.FC<Props> = (props) => {
  const [rates, setRates] = useState<Rate[] | undefined>(undefined); // useLocalStorage<Rate[] | undefined>(ratesStorageKey, undefined);
  const [ratesStatus, setRatesStatus] = useState<FetchStatus>(FetchStatus.Idle);

  const fetchRates = useCallback(async (): Promise<boolean> => {
    setRatesStatus(FetchStatus.Loading);
    try {
      const { promise } = http.customFetch<Rate>(
        `https://webserver.tonicpow.com/v1/rates/current?currency=usd&amount=1.00`
      );

      const rate = await promise;
      setRates([rate]);
      setRatesStatus(FetchStatus.Success);

      return true;
    } catch (e) {
      setRatesStatus(FetchStatus.Error);
      return false;
    }
  }, [setRates]);

  useEffect(() => {
    if (rates === undefined && ratesStatus === FetchStatus.Idle) {
      fetchRates();
    }
  }, [fetchRates, rates, ratesStatus]);

  useEffect(() => {
    const interval = setInterval(fetchRates, 15 * 60 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchRates]);

  const value = useMemo(
    () => ({
      rates: rates || [],
      fetchRates,
      ratesStatus,
    }),
    [fetchRates, rates, ratesStatus]
  );

  return <RatesContext.Provider value={value} {...props} />;
};

export const useRates = (): ContextValue => {
  const context = useContext(RatesContext);
  if (context === undefined) {
    throw new Error("Rates must be used within an RatesProvider");
  }
  return context;
};

// const ratesStorageKey = 'tp__RatesProvider_rates';
