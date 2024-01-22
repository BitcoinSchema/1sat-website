import OutpointTimeline from "@/components/pages/outpoint/timeline";

const Outpoint = async ({ params }: { params: { outpoint: string } })  => {
  return <OutpointTimeline outpoint={params.outpoint} />
};

export default Outpoint;
