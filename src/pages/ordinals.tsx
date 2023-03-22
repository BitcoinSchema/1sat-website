import OrdinalsPage from "@/components/pages/ordinals";
import AppContext from "@/context";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <AppContext {...props}>
      <OrdinalsPage {...props} />
    </AppContext>
  );
};

export default Page;
