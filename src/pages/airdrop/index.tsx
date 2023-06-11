import Layout from "@/components/pages";
import AirdropPage from "@/components/pages/airdrop";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <AirdropPage {...props} />
    </Layout>
  );
};

export default Page;
