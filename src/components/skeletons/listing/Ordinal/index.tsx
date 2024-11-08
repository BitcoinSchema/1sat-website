const SkeletonItem = () => (
  <div className="flex gap-4 items-center w-full my-2">
    <div>
      <div className="w-[100px] skeleton h-[100px]" />
    </div>
    <div className="flex flex-col gap-1 w-full my-auto">
      <div className="skeleton h-4 w-42 md:w-96" />
      <div className="skeleton h-4 w-36" />
      <div className="skeleton h-4 w-20" />
    </div>
    <div className="hidden w-[100px] md:flex items-center justify-end">
      <div className="skeleton w-12 h-12" />
    </div>

    <div className="hidden flex-grow md:flex items-center justify-end">
      <div className="skeleton h-6 w-12" />
    </div>

    <div className="hidden w-[100px] md:flex items-center justify-end">
      <div className="skeleton h-8 w-8" />
    </div>
  </div>
);

const OrdinalListingSkeleton = ({ iterations }: { iterations?: number }) => (
  <tbody className="w-full max-w-5xl mx-auto h-full">
    <tr>
      <td colSpan={5} className="py-0 px-3 mb-4">
        {[...Array(iterations)].map((_, i) => (
          <SkeletonItem key={`skel-${i+1}-ton`} />
        ))}
      </td>
    </tr>
  </tbody>
);

export default OrdinalListingSkeleton;
