import Layout from "@/components/pages";
import NewListingPage from "@/components/pages/market/new";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <NewListingPage {...props} />
    </Layout>
  );
};

export default Page;
