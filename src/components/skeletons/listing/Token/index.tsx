const SkeletonItem = () => (
  <tr className="px-4 table-row gap-4 items-center w-full py-2">
    <td colSpan={5} className="py-3">
      <div className="table-cell pr-4 ">
        <div className="flex gap-4">
          <div className="w-14 skeleton h-6 rounded-full" />
          <div className="w-14 skeleton h-6" />
        </div>
      </div>
      <div className="table-cell w-full ">
        <div className="skeleton h-6 w-24" />
      </div>
      <div className="table-cell w-full pr-4">
        <div className="skeleton h-6 w-48" />
      </div>
      <div className="table-cell w-full text-right pr-4">
        <div className="skeleton h-6 w-12" />
      </div>
      <div className="table-cell text-right ">
        <div className="skeleton h-6 w-24" />
      </div>
    </td>
  </tr>
);

const iterations = 20;

const TokenListingSkeleton = () => (
  <tbody className="py-0 px-3 mb-4 w-full">
    {[...Array(iterations)].map((_, i) => (
      <SkeletonItem key={`token-skel-${i}`} />
    ))}
  </tbody>
);

export default TokenListingSkeleton;
