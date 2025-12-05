import MinePage from "@/components/pages/mine";
import Head from "next/head";

const Mine = async () => {
  return <>
    <Head>
      <meta property="og:image" content="<generated>" />
      <meta
        property="og:image:alt"
        content={"Mine Pow20"}
      />
    </Head>
    <MinePage />
  </>
};
export default Mine;

export async function generateMetadata() {
  return {
    title: "Download POW20 Miner (Beta) - 1SatOrdinals",
    description: "Download the beta version of our POW20 miner on 1SatOrdinals.",
    openGraph: {
      title: "Download POW20 Miner (Beta) - 1SatOrdinals",
      description: "Download the beta version of our POW20 miner on 1SatOrdinals.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Download POW20 Miner (Beta) - 1SatOrdinals",
      description: "Download the beta version of our POW20 miner on 1SatOrdinals.",
    },
  };
}
