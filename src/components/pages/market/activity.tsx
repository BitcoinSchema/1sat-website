import MarketTabs, { MarketTab } from "@/components/pages/market/tabs/tabs";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";

interface PageProps extends WithRouterProps {}

const ActivityPage: React.FC<PageProps> = ({}) => {
  // const { activity, getActivity, fetchActivityStatus } = useOrdinals();

  // useEffect(() => {
  //   const fire = async () => {
  //     await getActivity();
  //   };
  //   if (!listings && fetchActivityStatus === FetchStatus.Idle) {
  //     fire();
  //   }
  // }, [fetchActivityStatus]);

  return (
    <div>
      <MarketTabs currentTab={MarketTab.Activity} />
      <h1>Activity</h1>
      {/* {fetchActivityStatus === FetchStatus.Success && (
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
      )} */}
    </div>
  );
};

export default ActivityPage;
