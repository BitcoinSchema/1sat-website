import Layout from "@/components/pages";
import PreviewPage from "@/components/pages/preview";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <PreviewPage {...props} />
    </Layout>
  );
};

export default Page;
