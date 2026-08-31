import { Skeleton } from "@/components/ui/skeleton";

export function OrdinalsGridSkeleton() {
	return (
		<div className="space-y-4" aria-label="Loading ordinals" role="status">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="space-y-2">
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-4 w-56" />
				</div>
				<div className="flex flex-wrap gap-2">
					{[
						["refresh", 72],
						["send", 64],
						["list", 56],
						["cancel", 112],
						["burn", 64],
					].map(([id, width]) => (
						<Skeleton className="h-8" key={id} style={{ width }} />
					))}
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
				{["one", "two", "three", "four", "five", "six"].map((id) => (
					<Skeleton className="aspect-square rounded-lg" key={id} />
				))}
			</div>
			<span className="sr-only">Loading wallet ordinals</span>
		</div>
	);
}
