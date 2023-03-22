import Layout from "@/components/pages";
import OrdinalsPage from "@/components/pages/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <OrdinalsPage {...props} />
    </Layout>
  );
};

export default Page;
