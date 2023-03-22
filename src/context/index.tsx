import Layout from "@/components/pages";
import { WithRouterProps } from "next/dist/client/with-router";
import React, { ReactNode } from "react";
import { WalletProvider } from "./wallet";

interface Props extends WithRouterProps {
  children: ReactNode;
}

const AppContext: React.FC<Props> = ({ router, children }) => (
  <WalletProvider>
    <Layout router={router}>{children}</Layout>
  </WalletProvider>
);

export default AppContext;
