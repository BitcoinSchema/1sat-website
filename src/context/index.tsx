import React, { ReactNode } from "react";
import { WalletProvider } from "./wallet";

interface Props {
  children: ReactNode;
}

const AppContext: React.FC<Props> = ({ children }) => (
  <WalletProvider>{children}</WalletProvider>
);

export default AppContext;
