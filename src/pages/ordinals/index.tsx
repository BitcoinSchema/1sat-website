import Layout from "@/components/pages";
import OrdinalsPage from "@/components/pages/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <OrdinalsPage {...props} />
    </Layout>
  );
};

export default Page;
