import { WithRouterProps } from "next/dist/client/with-router";
import { useRouter } from "next/router";
import Listing from "./listing";
import Listings from "./listings";

interface PageProps extends WithRouterProps {}

const MarketPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { outPoint } = router.query;

  return (
    <div>
      <h1>Martket</h1>
      <div>
        {typeof outPoint === "string" ? (
          <Listing outPoint={outPoint} />
        ) : (
          <Listings />
        )}
      </div>
    </div>
  );
};

export default MarketPage;
