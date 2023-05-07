import Artifact from "@/components/artifact";
import { ORDS_PER_PAGE, useWallet } from "@/context/wallet";
import { sortedUniqBy } from "lodash";
import Router, { useRouter } from "next/router";
import { useEffect, useMemo } from "react";

type Props = {
  onClick?: (outPoint: string) => void;
  sort: boolean;
};
const Ordinals: React.FC<Props> = ({ onClick, sort }) => {
  const router = useRouter();
  const { page } = router.query;
  const { ordUtxos } = useWallet();

  const sortedUtxos = useMemo(() => {
    return sort
      ? sortedUniqBy(ordUtxos, (u) => u.id)
      : sortedUniqBy(ordUtxos, (u) => u.id).reverse() || [];
  }, [ordUtxos, sort]);

  const currentPage = useMemo(() => {
    return typeof page === "string" ? parseInt(page) : 1;
  }, [page]);

  useEffect(() => {
    console.log({ currentPage });
  }, [currentPage]);

  const from = useMemo(() => {
    return (currentPage - 1) * ORDS_PER_PAGE + 1;
  }, [currentPage]);

  const to = useMemo(() => {
    return from + (ordUtxos?.length ? ordUtxos.length - 1 : 0);
  }, [ordUtxos, from, currentPage]);

  const pagination = useMemo(() => {
    return (
      <div className=" grid grid-cols-3 max-w-md mx-auto">
        {currentPage > 1 ? (
          <button
            className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
            onClick={() => Router.push(`/ordinals?page=${currentPage - 1}`)}
          >
            {`Page ${currentPage - 1}`}
          </button>
        ) : (
          <div></div>
        )}
        <div className="p-2 text-center text-sm">
          {`Page ${currentPage}`}
          <br />
          {ordUtxos?.length || 0 > 0 ? `${from} - ${to}` : ``}
        </div>
        {ordUtxos?.length === ORDS_PER_PAGE ? (
          <button
            className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
            onClick={() => {
              Router.push(`/ordinals?page=${currentPage + 1}`);
            }}
            // Disable the Next Page button until we know a next page is available
          >
            {`Page ${currentPage + 1}`}
          </button>
        ) : (
          <div></div>
        )}
      </div>
    );
  }, [ordUtxos, currentPage]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4 mb-4">
        {sortedUtxos?.map((a) => (
          <Artifact
            onClick={() =>
              onClick && onClick(a.origin || `${a.txid}_${a.vout}`)
            }
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
      {pagination}
    </div>
  );
};

export default Ordinals;
