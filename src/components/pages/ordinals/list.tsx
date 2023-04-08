import Artifact from "@/components/artifact";
import { useWallet } from "@/context/wallet";
import { sortedUniqBy } from "lodash";
import { useMemo } from "react";

type Props = {
  onClick?: (outPoint: string) => void;
  sort: boolean;
};
const Ordinals: React.FC<Props> = ({ onClick, sort }) => {
  const { ordUtxos } = useWallet();

  const sortedUtxos = useMemo(() => {
    return sort
      ? sortedUniqBy(ordUtxos, (u) => u.id)
      : sortedUniqBy(ordUtxos, (u) => u.id).reverse() || [];
  }, [ordUtxos, sort]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {sortedUtxos?.map((a) => (
        <Artifact
          onClick={() => onClick && onClick(a.origin || `${a.txid}_${a.vout}`)}
          key={a.origin || `${a.txid}_${a.vout}`}
          outPoint={a.origin || `${a.txid}_${a.vout}`}
          contentType={a.type}
          id={a.id}
          to={
            onClick
              ? undefined
              : a.id !== undefined
              ? `/inscription/${a.id}`
              : `/tx/${a.txid}_${a.vout}`
          }
          classNames={{
            wrapper: "max-w-72 max-h-72 overflow-hidden mb-2",
          }}
          txid={a.txid}
        />
      ))}
    </div>
  );
};

export default Ordinals;
