import React, { ReactNode } from "react";
import { BapProvider } from "./bap";
import { BitcoinSchemaProvider } from "./bitcoinschema";
import { BitsocketProvider } from "./bitsocket";
import { OrdinalsProvider } from "./ordinals";
import { RatesProvider } from "./rates";
import { WalletProvider } from "./wallet";

interface Props {
  children: ReactNode;
}

const AppContext: React.FC<Props> = ({ children }) => (
  <BitsocketProvider>
    <RatesProvider>
      <BitcoinSchemaProvider>
        <OrdinalsProvider>
          <WalletProvider>
            <BapProvider>{children}</BapProvider>
          </WalletProvider>
        </OrdinalsProvider>
      </BitcoinSchemaProvider>
    </RatesProvider>
  </BitsocketProvider>
);

export default AppContext;
