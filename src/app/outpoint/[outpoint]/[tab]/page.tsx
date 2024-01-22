import OutpointInscription from "@/components/pages/outpoint/inscription";
import OutpointTimeline from "@/components/pages/outpoint/timeline";
import OutpointToken from "@/components/pages/outpoint/token";

export const enum OutpointTab {
  Timeline = "timeline",
  Inscription = "inscription",
  Token = "token",
}

const Outpoint = async ({
  params,
}: {
  params: { outpoint: string; tab: string };
}) => {
  switch (params.tab as OutpointTab) {
    case OutpointTab.Timeline:
      return <OutpointTimeline outpoint={params.outpoint} />;
    case OutpointTab.Inscription:
      return <OutpointInscription outpoint={params.outpoint} />;
    case OutpointTab.Token:
      return <OutpointToken outpoint={params.outpoint} />;
  }
};

export default Outpoint;
