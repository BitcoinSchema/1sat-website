import { AssetType } from "@/constants";
import Market from "../page";


const Holders = async ({ params }: { params: { tab: AssetType, id: string } }) => {
  return <Market params={params} />;
}

export default Holders;