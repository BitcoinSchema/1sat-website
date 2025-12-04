import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<main className="px-4 flex items-center justify-center w-full min-h-[calc(100dvh-15rem)]">
			<div className="flex flex-col items-center w-full h-full">
				<div className="relative text-center rounded-lg min-h-96 mx-auto px-4 max-w-[100rem] w-full">
					<div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
						{Array.from({ length: 20 }).map((_, i) => (
							<div
								key={`skeleton-${i}`}
								className="relative mb-4 break-inside-avoid"
							>
								<Skeleton className="w-full aspect-square rounded-lg" />
							</div>
						))}
					</div>
				</div>
			</div>
		</main>
	);
}
