import Layout from "@/components/pages";
import { WithRouterProps } from "next/dist/client/with-router";
import dynamic from "next/dynamic";
import React from "react";

const OrdinalsPage = dynamic(() => import("@/components/pages/ordinals"));

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <OrdinalsPage {...props} />
    </Layout>
  );
};

export default Page;
