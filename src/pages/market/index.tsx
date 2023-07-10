import Layout from "@/components/pages";
import { WithRouterProps } from "next/dist/client/with-router";
import dynamic from "next/dynamic";
import React from "react";
const MarketPage = dynamic(() => import("@/components/pages/market"));

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <MarketPage {...props} />
    </Layout>
  );
};

export default Page;
