import Layout from "@/components/pages";
import ListingsPage from "@/components/pages/market/listings";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <ListingsPage {...props} />
    </Layout>
  );
};

export default Page;
