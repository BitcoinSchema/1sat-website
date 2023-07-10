import { WithRouterProps } from "next/dist/client/with-router";
import { useSearchParams } from "next/navigation";
import React from "react";

interface PageProps extends WithRouterProps {}

const ListingPage: React.FC<PageProps> = ({}) => {
  const searchParams = useSearchParams();
  const outPoint = searchParams.get("outPoint");

  return <div>Listing {outPoint}</div>;
};

export default ListingPage;
