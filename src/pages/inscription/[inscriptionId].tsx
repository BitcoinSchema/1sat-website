import Layout from "@/components/pages";
import InscriptionPage from "@/components/pages/inscription";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <InscriptionPage {...props} />
    </Layout>
  );
};

export default Page;
