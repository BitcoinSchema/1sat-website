import Artifact from "@/components/artifact";
import { useOrdinals } from "@/context/ordinals";
import React, { useEffect } from "react";
import { FetchStatus } from "..";

const Listings: React.FC = ({}) => {
  const { listings, getListings, fetchListingsStatus } = useOrdinals();

  useEffect(() => {
    const fire = async () => {
      await getListings();
    };
    if (!listings && fetchListingsStatus === FetchStatus.Idle) {
      fire();
    }
  }, [fetchListingsStatus]);

  return (
    <div>
      <h1>Listings</h1>
      {fetchListingsStatus === FetchStatus.Success && (
        <div>
          {listings?.map((l) => {
            return (
              <div key={l.origin}>
                Listing
                <Artifact outPoint={l.origin} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Listings;
