import Layout from "@/components/pages";
import BSV20Page from "@/components/pages/market/bsv20s";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <BSV20Page {...props} />
    </Layout>
  );
};

export default Page;
