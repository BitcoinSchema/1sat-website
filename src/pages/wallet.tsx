import Layout from "@/components/pages";
import WalletPage from "@/components/pages/wallet";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <WalletPage {...props} />
    </Layout>
  );
};

export default Page;
