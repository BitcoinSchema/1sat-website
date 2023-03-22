import WalletPage from "@/components/pages/wallet";
import AppContext from "@/context";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const Page: React.FC<PageProps> = (props) => {
  return (
    <AppContext {...props}>
      <WalletPage {...props} />
    </AppContext>
  );
};

export default Page;
