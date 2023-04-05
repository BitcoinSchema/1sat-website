import Artifact from "@/components/artifact";
import { useWallet } from "@/context/wallet";
import { useEffect } from "react";

const Ordinals: React.FC = () => {
  const { ordUtxos } = useWallet();

  useEffect(() => console.log(ordUtxos), [ordUtxos]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {ordUtxos?.map((a) => (
        <Artifact
          key={a.origin || `${a.txid}_${a.vout}`}
          outPoint={a.origin || `${a.txid}_${a.vout}`}
          contentType={a.type}
          id={a.id}
          to={`/ordinals/${a.txid}_${a.vout}`}
          classNames={{
            wrapper: "max-w-72 max-h-72 overflow-hidden mb-2",
          }}
        />
      ))}
    </div>
  );
};

export default Ordinals;
