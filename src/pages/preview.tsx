import Layout from "@/components/pages";
import PreviewPage from "@/components/pages/preview";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <Layout>
      <PreviewPage {...props} />
    </Layout>
  );
};

export default Page;
