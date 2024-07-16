import { AssetType } from "@/constants";

const SkeletonItem = ({ type = AssetType.BSV20 }: { type: AssetType }) => (
	<tr className="px-4 table-row gap-4 items-center w-full py-2">
		<td colSpan={type === AssetType.BSV20 ? 5 : 6} className="py-3">
			<div className="table-cell pr-4 ">
				<div className="flex gap-4">
					<div className="w-14 skeleton h-6 rounded-full" />
					<div className="w-14 skeleton h-6" />
				</div>
			</div>
			<div className="table-cell w-full">
				<div className="flex gap-4">
					<div className="skeleton h-6 w-24 flex-shrink" />
					<div className="skeleton h-6 mr-4 flex-grow" />
				</div>
			</div>
			<div className="table-cell w-full pr-4">
				<div className="skeleton h-6 w-48" />
			</div>
			<div className="table-cell w-full text-right pr-4">
				<div className="skeleton h-6 w-12" />
			</div>
			{type === AssetType.BSV21 && (
				<div className="table-cell text-center w-6">
					<div className="skeleton h-6 w-6" />
				</div>
			)}
			<div className="table-cell text-right w-24">
				<div className="skeleton h-6 w-24" />
			</div>
		</td>
	</tr>
);

const iterations = 20;

const TokenListingSkeleton = ({ type }: { type: AssetType }) => (
	<tbody className="py-0 px-3 mb-4 w-full">
		{[...Array(iterations)].map((_, i) => (
			<SkeletonItem
				type={type}
				key={`token-skel-${
					// biome-ignore lint/suspicious/noArrayIndexKey: there are no values to use in this case
					i
				}`}
			/>
		))}
	</tbody>
);

export default TokenListingSkeleton;
