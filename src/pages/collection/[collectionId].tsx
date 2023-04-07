import Layout from "@/components/pages";
import CollectionPage from "@/components/pages/collection";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <CollectionPage {...props} />
    </Layout>
  );
};

export default Page;
