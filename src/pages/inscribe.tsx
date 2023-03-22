import InscribePage from "@/components/pages/inscribe";
import AppContext from "@/context";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <AppContext {...props}>
      <InscribePage {...props} />
    </AppContext>
  );
};

export default Page;
