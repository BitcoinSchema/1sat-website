import React, { ReactNode } from "react";
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
          <WalletProvider>{children}</WalletProvider>
        </OrdinalsProvider>
      </BitcoinSchemaProvider>
    </RatesProvider>
  </BitsocketProvider>
);

export default AppContext;
