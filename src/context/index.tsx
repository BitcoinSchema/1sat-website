import React, { ReactNode } from "react";
import { BitcoinSchemaProvider } from "./bitcoinschema";
import { SocketProvider } from "./bitsocket";
import { OrdinalsProvider } from "./ordinals";
import { RatesProvider } from "./rates";
import { StorageProvider } from "./storage";
import { WalletProvider } from "./wallet";

interface Props {
  children: ReactNode;
}

const AppContext: React.FC<Props> = ({ children }) => (
  <SocketProvider>
    <RatesProvider>
      <BitcoinSchemaProvider>
        <OrdinalsProvider>
          <StorageProvider>
            <WalletProvider>{children}</WalletProvider>
          </StorageProvider>
        </OrdinalsProvider>
      </BitcoinSchemaProvider>
    </RatesProvider>
  </SocketProvider>
);

export default AppContext;
