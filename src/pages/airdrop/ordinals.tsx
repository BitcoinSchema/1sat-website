import Layout from "@/components/pages";
import AirdropOrdinalsPage from "@/components/pages/airdrop/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <AirdropOrdinalsPage {...props} />
    </Layout>
  );
};

export default Page;
