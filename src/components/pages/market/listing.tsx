import { WithRouterProps } from "next/dist/client/with-router";
import { useRouter } from "next/router";
import React from "react";

interface PageProps extends WithRouterProps {}

const ListingPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { outPoint } = router.query;

  return <div>Listing {outPoint}</div>;
};

export default ListingPage;
