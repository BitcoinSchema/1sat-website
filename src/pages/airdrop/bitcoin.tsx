import Layout from "@/components/pages";
import AirdropBitcoinPage from "@/components/pages/airdrop/bitcoin";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <AirdropBitcoinPage {...props} />
    </Layout>
  );
};

export default Page;
