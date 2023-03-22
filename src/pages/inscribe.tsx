import Layout from "@/components/pages";
import InscribePage from "@/components/pages/inscribe";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <InscribePage {...props} />
    </Layout>
  );
};

export default Page;
