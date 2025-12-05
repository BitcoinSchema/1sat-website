import { AssetType } from "@/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

const SkeletonItem = ({ type = AssetType.BSV20 }: { type: AssetType }) => (
	<TableRow className="border-b border-border">
		<TableCell className="px-4 py-3">
			<div className="flex items-center gap-3">
				{type === AssetType.BSV21 && (
					<Skeleton className="w-8 h-8 rounded-lg" />
				)}
				<Skeleton className="h-6 w-16" />
			</div>
		</TableCell>
		<TableCell className="px-4 py-3">
			<Skeleton className="h-5 w-32" />
		</TableCell>
		<TableCell className="px-4 py-3">
			<Skeleton className="h-5 w-16" />
		</TableCell>
		<TableCell className="px-4 py-3 text-right">
			<Skeleton className="h-5 w-24 ml-auto" />
		</TableCell>
		{type === AssetType.BSV21 && (
			<TableCell className="px-4 py-3 text-center">
				<Skeleton className="h-5 w-5 mx-auto rounded-full" />
			</TableCell>
		)}
		<TableCell className="px-4 py-3 text-right">
			<Skeleton className="h-5 w-16 ml-auto" />
		</TableCell>
	</TableRow>
);

const iterations = 12;

const TokenListingSkeleton = ({ type }: { type: AssetType }) => (
	<TableBody>
		{[...Array(iterations)].map((_, i) => (
			<SkeletonItem
				type={type}
				key={`token-skel-${i}`}
			/>
		))}
	</TableBody>
);

export default TokenListingSkeleton;
