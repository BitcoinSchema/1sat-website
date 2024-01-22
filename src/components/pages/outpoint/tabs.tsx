import Link from "next/link";

export const enum OutpointTab {
  Timeline = "timeline",
  Inscription = "inscription",
  Token = "token",
}
  

interface Props {
  outpoint: string;
  activeTab: OutpointTab
}

const OutpointTabs = ({ outpoint, activeTab }: Props) => {
  return (
    <div role="tablist" className={`tabs tabs-bordered mb-4`}>
      <Link role="tab" href={`/outpoint/${outpoint}/timeline`} className={`tab ${activeTab === OutpointTab.Timeline ? 'tab-active' : ''}`}>
        Timeline
      </Link>
      <Link role="tab" href={`/outpoint/${outpoint}/inscription`} className={`tab ${activeTab === OutpointTab.Inscription ? 'tab-active' : ''}`}>
        Inscription
      </Link>
      <Link role="tab" href={`/outpoint/${outpoint}/token`}className={`tab ${activeTab === OutpointTab.Token ? 'tab-active' : ''}`}>
        Token
      </Link>
    </div>
  );
};


export default OutpointTabs;