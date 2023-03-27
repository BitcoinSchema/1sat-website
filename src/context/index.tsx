import React, { ReactNode } from "react";
import { RatesProvider } from "./rates";
import { WalletProvider } from "./wallet";

interface Props {
  children: ReactNode;
}

const AppContext: React.FC<Props> = ({ children }) => (
  <RatesProvider>
    <WalletProvider>{children}</WalletProvider>
  </RatesProvider>
);

export default AppContext;
