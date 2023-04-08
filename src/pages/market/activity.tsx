import Layout from "@/components/pages";
import ActivityPage from "@/components/pages/market/activity";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <ActivityPage {...props} />
    </Layout>
  );
};

export default Page;
