import Layout from "@/components/pages";
import TxPage from "@/components/pages/tx";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <TxPage {...props} />
    </Layout>
  );
};

export default Page;
