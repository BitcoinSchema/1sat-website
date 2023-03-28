import React, { ReactNode } from "react";
import { BitsocketProvider } from "./bitsocket";
import { RatesProvider } from "./rates";
import { WalletProvider } from "./wallet";

interface Props {
  children: ReactNode;
}

const AppContext: React.FC<Props> = ({ children }) => (
  <BitsocketProvider>
    <RatesProvider>
      <WalletProvider>{children}</WalletProvider>
    </RatesProvider>
  </BitsocketProvider>
);

export default AppContext;
