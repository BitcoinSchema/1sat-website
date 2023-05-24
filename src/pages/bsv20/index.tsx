import Layout from "@/components/pages";
import Bsv20WalletPage from "@/components/pages/bsv20";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <Bsv20WalletPage {...props} />
    </Layout>
  );
};

export default Page;
