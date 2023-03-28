import { ConnectionStatus } from "@/components/pages";
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLocalStorage } from "../../utils/storage";

type ContextValue = {
  ordAddress: string | undefined;
  connect: (ordAddress: string) => Promise<void>;
  connectionStatus: ConnectionStatus;
  leid: string | undefined;
  lastEvent: JSON | null;
  sock: EventSource | null;
};

const BitsocketContext = React.createContext<ContextValue | undefined>(
  undefined
);

type Props = {
  children?: ReactNode;
};

export const BitsocketProvider: React.FC<Props> = (props) => {
  const [leid, setLeid] = useLocalStorage<string | undefined>(
    leidStorageKey,
    undefined
  );
  const [ordAddress, setOrdAddress] = useState<string | undefined>(undefined);
  const [sock, setSock] = useState<EventSource | null>(null);
  const [lastEvent, setLastEvent] = useState<JSON | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<number>(
    ConnectionStatus.IDLE
  );
  const [lastPath, setLastPath] = useState<string | null>(null);
  const [wasUnmounted, setWasUnmounted] = useState<boolean>();

  const unmounted = useRef(false);

  // const location = useLocation();

  // use the useEffect cleanup function to know if the component (page) was unmounted
  // so we don't update the state afterwards and thereby introduce a memory leak
  useEffect(
    () => () => {
      unmounted.current = true;
      setConnectionStatus(ConnectionStatus.IDLE);
      setWasUnmounted(true);
    },
    []
  );

  // useEffect(() => {
  //   // If the path changes and we have an open socket, close the socket and reset the provider
  //   if (!unmounted.current && lastPath && lastPath !== location.pathname) {
  //     if (sock?.OPEN === connectionStatus) {
  //       sock.close();
  //     }
  //     setSock(null);
  //     setOrdAddress(null);
  //     setFundingAddress(null);
  //     setLastEvent(null);
  //     setLeid(undefined);
  //     setConnectionStatus(ConnectionStatus.IDLE);
  //   }
  // }, [
  //   setOrdAddress,
  //   setFundingAddress,
  //   connectionStatus,
  //   lastPath,
  //   location,
  //   setLeid,
  //   sock,
  // ]);

  const connect = useCallback(
    async (ordAddress: string): Promise<void> => {
      setOrdAddress(ordAddress);
      // setLastPath(location.pathname);

      if (ordAddress == null) {
        if (sock?.OPEN === connectionStatus) {
          sock.close();
        }
        return;
      }

      if (sock) {
        if (sock.CONNECTING === connectionStatus) {
          return;
        }
        if (sock.OPEN === connectionStatus) {
          sock.close();
        }
      }

      // Subscribe
      setConnectionStatus(ConnectionStatus.CONNECTING);
      const s = new EventSource(
        `https://ordinals.gorillapool.io/api/subscribe?address=${ordAddress}`
        // leid !== "undefined"
        //   ? {
        //       headers: { "Last-Event-Id": leid },
        //     }
        // : {}
      );

      s.onmessage = function (e) {
        // TODO: LEID
        console.log("message!", e);
        // if (!unmounted.current && e.lastEventId !== "undefined") {
        //   setLeid(e.lastEventId);
        // }
        if (e.data) {
          const data = JSON.parse(e.data);
          if (!unmounted.current && data.type === "push") {
            console.log("push type", data);
            setLastEvent(data);
          }
        }
      };
      s.onopen = function () {
        if (!unmounted.current) {
          setConnectionStatus(ConnectionStatus.OPEN);
        }
      };
      s.onerror = function () {
        if (!unmounted.current) {
          setConnectionStatus(ConnectionStatus.FAILED);
        }
      };
      if (!unmounted.current) {
        setSock(s);
      }
    },
    [
      connectionStatus,
      leid,
      // location.pathname,
      setOrdAddress,
      setLeid,
      sock,
    ]
  );

  const value = useMemo(
    () => ({
      ordAddress,
      connectionStatus,
      leid,
      connect,
      sock,
      lastEvent,
    }),
    [ordAddress, connect, connectionStatus, leid, sock, lastEvent]
  );

  return <BitsocketContext.Provider value={value} {...props} />;
};

export const useBitsocket = (): ContextValue => {
  const context = useContext(BitsocketContext);
  if (context === undefined) {
    throw new Error("Bitsocket must be used within an BitsocketProvider");
  }
  return context;
};

const leidStorageKey = "tp__BitsocketProvider_leid";
