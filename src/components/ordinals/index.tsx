import Artifact from "@/components/artifact";
import { OrdUtxo } from "@/types/ordinals";

type Props = {
  onClick?: (outPoint: string) => void;
  artifacts: OrdUtxo[];
};
const Ordinals: React.FC<Props> = ({ artifacts, onClick }) => {
  return (
    <>
      {artifacts?.length === 0 && <div className="grid mb-4">You have no ordinals</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4 mb-4">
        {artifacts?.map((a) => {
          return (
            <Artifact
              artifact={a}
              onClick={() => onClick?.(`${a.txid}_${a.vout}`)}
              key={`gridlist-${a.origin?.outpoint || `${a.txid}_${a.vout}`}`}
              to={onClick ? undefined : `/outpoint/${a.txid}_${a.vout}`}
              classNames={{
                wrapper: "w-64 h-64 overflow-hidden mb-2",
              }}
              sizes={"100vw"}
              size={300}
              showFooter={false}
            />
          );
        })}
      </div>
    </>
  );
};

export default Ordinals;
