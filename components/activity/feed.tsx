"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { fetchActivity } from "@/lib/api-mock";
import { ActivityFeedItem } from "./feed-item";

export function ActivityFeed() {
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useInfiniteQuery({
			queryKey: ["activity"],
			queryFn: fetchActivity,
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			initialPageParam: 0,
		});

	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 },
		);

		if (loadMoreRef.current) {
			observer.observe(loadMoreRef.current);
		}

		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	if (status === "pending") {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	if (status === "error") {
		return <div className="p-4 text-red-500">Error loading activity.</div>;
	}

	return (
		<div className="max-w-2xl mx-auto py-8 space-y-4">
			{data?.pages.map((page, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: page data is stable for infinite scroll
				<div key={i} className="space-y-4">
					{" "}
					{page.data.map((item) => (
						<ActivityFeedItem key={item.id} item={item} />
					))}
				</div>
			))}

			<div ref={loadMoreRef} className="py-4 flex justify-center">
				{isFetchingNextPage ? (
					<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
				) : hasNextPage ? (
					<span className="text-xs text-muted-foreground">Load more</span>
				) : (
					<span className="text-xs text-muted-foreground">
						No more activity
					</span>
				)}
			</div>
		</div>
	);
}
