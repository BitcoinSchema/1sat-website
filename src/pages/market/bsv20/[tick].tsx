import Layout from "@/components/pages";
import TickerPage from "@/components/pages/bsv20/ticker";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <TickerPage {...props} />
    </Layout>
  );
};

export default Page;
