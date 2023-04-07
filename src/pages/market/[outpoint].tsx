import Layout from "@/components/pages";
import MarketPage from "@/components/pages/market";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <MarketPage {...props} />
    </Layout>
  );
};

export default Page;
