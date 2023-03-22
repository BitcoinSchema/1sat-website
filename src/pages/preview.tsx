import PreviewPage from "@/components/pages/preview";
import AppContext from "@/context";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <AppContext {...props}>
      <PreviewPage {...props} />
    </AppContext>
  );
};

export default Page;
