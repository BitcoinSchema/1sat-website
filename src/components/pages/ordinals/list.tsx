import Artifact from "@/components/artifact";
import { ORDS_PER_PAGE, useWallet } from "@/context/wallet";
import Router, { useRouter } from "next/router";
import { useMemo } from "react";

type Props = {
  onClick?: (outPoint: string) => void;

  currentPage: number;
};
const Ordinals: React.FC<Props> = ({ onClick, currentPage = 1 }) => {
  const { ordUtxos } = useWallet();
  const { sort } = useRouter().query;

  const currentSort = useMemo(() => {
    return typeof sort === "string" ? parseInt(sort) : 0;
  }, [sort]);

  const pagination = useMemo(() => {
    return (
      <div className=" grid grid-cols-3 max-w-md mx-auto">
        {currentPage > 1 ? (
          <button
            className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
            onClick={() =>
              Router.push(
                `/ordinals?page=${currentPage - 1}&sort=${currentSort ? 1 : 0}}`
              )
            }
          >
            {`Page ${currentPage - 1}`}
          </button>
        ) : (
          <div></div>
        )}
        <div className="p-2 text-center text-sm">{`Page ${currentPage}`}</div>
        {ordUtxos?.length === ORDS_PER_PAGE ? (
          <button
            className="rounded bg-[#222] cursor-pointer p-2 hover:bg-[#333] transition text-white"
            onClick={() => {
              Router.push(
                `/ordinals?page=${currentPage + 1}&sort=${currentSort ? 1 : 0}`
              );
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
  }, [currentSort, ordUtxos, currentPage]);

  return (
    <div>
      {ordUtxos?.length === 0 && <div>You have no ordinals</div>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4 mb-4">
        {ordUtxos?.map((a) => {
          return (
            <Artifact
              onClick={() => onClick && onClick(`${a.txid}_${a.vout}`)}
              key={a.origin?.outpoint || `${a.txid}_${a.vout}`}
              origin={a.origin?.outpoint}
              contentType={a.origin?.data?.insc?.file?.type}
              num={a.origin?.num}
              to={
                onClick
                  ? undefined
                  : a.origin?.num !== undefined
                  ? `/inscription/${encodeURIComponent(
                      a.origin?.num || ""
                    )}?page=${currentPage}`
                  : `/tx/${a.txid}_${a.vout}`
              }
              classNames={{
                wrapper: "max-w-72 max-h-72 overflow-hidden mb-2",
              }}
              txid={a.txid}
              height={a.height}
              isListing={!!a.data?.list}
            />
          );
        })}
      </div>
      {pagination}
    </div>
  );
};

export default Ordinals;
