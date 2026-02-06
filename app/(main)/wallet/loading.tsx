import { Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
	return (
		<div className="flex flex-1 flex-col gap-6 p-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<Skeleton className="h-32 rounded-xl" />
				<Skeleton className="h-32 rounded-xl" />
			</div>
			<Skeleton className="h-64 rounded-xl" />
		</div>
	);
}
