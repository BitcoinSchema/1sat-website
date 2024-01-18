const SkeletonItem = () => (
  <div className="px-4 table-row gap-4 items-center w-full py-2">
    <div className="table-cell pr-4 py-3">
      <div className="w-14 skeleton h-4"></div>
    </div>
    <div className="table-cell w-full py-3">
      <div className="skeleton h-4 w-24"></div>
    </div>
    <div className="table-cell w-full text-right pr-4 py-3">
      <div className="skeleton h-4 w-12"></div>
    </div>

    <div className="table-cell text-right py-3">
      <div className="skeleton h-4 w-24"></div>
    </div>
  </div>
);

const iterations = 20;

const TokenListingSkeleton = () => (
  <tbody>
    <tr>
      <td colSpan={5} className="py-0 px-3 mb-4">
        {[...Array(iterations)].map((_, i) => (
          <SkeletonItem key={i} />
        ))}
      </td>
    </tr>
  </tbody>
);

export default TokenListingSkeleton;
