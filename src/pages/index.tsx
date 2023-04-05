import Layout from "@/components/pages";
import HomePage from "@/components/pages/home";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const App: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <HomePage {...props} />
    </Layout>
  );
};

export default App;
