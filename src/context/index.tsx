import React, { ReactNode } from "react";
import { BapProvider } from "./bap";
import { BitcoinSchemaProvider } from "./bitcoinschema";
import { BitsocketProvider } from "./bitsocket";
import { OrdinalsProvider } from "./ordinals";
import { RatesProvider } from "./rates";
import { StorageProvider } from "./storage";
import { WalletProvider } from "./wallet";

interface Props {
  children: ReactNode;
}

const AppContext: React.FC<Props> = ({ children }) => (
  <BitsocketProvider>
    <RatesProvider>
      <BitcoinSchemaProvider>
        <StorageProvider>
          <WalletProvider>
            <OrdinalsProvider>
              <BapProvider>{children}</BapProvider>
            </OrdinalsProvider>
          </WalletProvider>
        </StorageProvider>
      </BitcoinSchemaProvider>
    </RatesProvider>
  </BitsocketProvider>
);

export default AppContext;
