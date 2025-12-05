import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

const SkeletonItem = () => (
  <TableRow className="border-b border-border">
    <TableCell className="py-3 px-4">
      <Skeleton className="w-[80px] h-[80px] rounded-lg" />
    </TableCell>
    <TableCell className="py-3 px-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </TableCell>
    <TableCell className="py-3 px-4 hidden md:table-cell">
      <Skeleton className="w-12 h-12 rounded" />
    </TableCell>
    <TableCell className="py-3 px-4 hidden md:table-cell text-right">
      <Skeleton className="h-5 w-16 ml-auto" />
    </TableCell>
    <TableCell className="py-3 px-4 hidden md:table-cell text-right">
      <Skeleton className="h-8 w-20 ml-auto rounded" />
    </TableCell>
  </TableRow>
);

const OrdinalListingSkeleton = ({ iterations = 10 }: { iterations?: number }) => (
  <TableBody>
    {[...Array(iterations)].map((_, i) => (
      <SkeletonItem key={`skel-${i+1}-ton`} />
    ))}
  </TableBody>
);

export default OrdinalListingSkeleton;
