"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
	Box,
	FileQuestion,
	Music,
	Play,
	SquareArrowOutUpRight,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toBitcoin } from "satoshi-token";
import ImageWithFallback from "@/components/image-with-fallback";
import ArtifactModal, {
	type ArtifactModalItem,
} from "@/components/modal/artifact-modal";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { fetchMarketActivity } from "@/lib/api";
import { useStackFeatures } from "@/lib/hooks/use-stack-features";
import { getOrdinalThumbnail } from "@/lib/image-utils";
import { type ListingData, stackContentUrl, toUrlOutpoint } from "@/lib/stack";

const LoadingSkeleton = ({ count }: { count: number }) => (
	<>
		{Array.from({ length: count }).map((_, i) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: skeletons are static placeholders
			<div key={`skeleton-${i}`} className="relative mb-4 break-inside-avoid">
				<div className="w-full aspect-square rounded-lg bg-muted animate-pulse" />
			</div>
		))}
	</>
);

const getContentType = (
	artifact: ListingData,
): "video" | "audio" | "3d" | "image" | "other" => {
	const contentType = artifact.content_type || "";
	if (contentType.startsWith("video/")) return "video";
	if (contentType.startsWith("audio/")) return "audio";
	if (contentType.includes("model/") || contentType.includes("gltf"))
		return "3d";
	if (contentType.startsWith("image/")) return "image";
	return "other";
};

// Hook to determine number of columns based on window width
const useColumnCount = () => {
	const [columns, setColumns] = useState(1);

	useEffect(() => {
		const updateColumns = () => {
			const width = window.innerWidth;
			if (width >= 1280)
				setColumns(4); // xl
			else if (width >= 1024)
				setColumns(3); // lg
			else if (width >= 640)
				setColumns(2); // sm
			else setColumns(1);
		};

		updateColumns();
		window.addEventListener("resize", updateColumns);
		return () => window.removeEventListener("resize", updateColumns);
	}, []);

	return columns;
};

export default function FlowGrid({ className = "" }: { className?: string }) {
	const { play } = useSound();
	const featuresQuery = useStackFeatures();
	const [visible, setVisible] = useState<Set<string>>(new Set());
	const [selectedArtifact, setSelectedArtifact] =
		useState<ArtifactModalItem | null>(null);

	// Determine column count
	const columnCount = useColumnCount();

	// Intersection Observer for images
	const observerRef = useRef<IntersectionObserver | null>(null);

	const observeImage = useCallback(
		(element: HTMLElement | null, outpoint: string) => {
			if (!element || visible.has(outpoint)) return;

			if (!observerRef.current) {
				observerRef.current = new IntersectionObserver(
					(entries) => {
						const newVisible = new Set<string>();
						entries.forEach((entry) => {
							if (entry.isIntersecting) {
								const id = entry.target.getAttribute("data-outpoint");
								if (id) newVisible.add(id);
								observerRef.current?.unobserve(entry.target);
							}
						});

						if (newVisible.size > 0) {
							setVisible((prev) => {
								const next = new Set(prev);
								newVisible.forEach((id) => {
									next.add(id);
								});
								return next;
							});
						}
					},
					{ threshold: 0.1 },
				);
			}

			element.setAttribute("data-outpoint", outpoint);
			observerRef.current.observe(element);
		},
		[visible],
	);

	useEffect(() => {
		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
		};
	}, []);

	const closeModal = useCallback(() => {
		setSelectedArtifact(null);
	}, []);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && selectedArtifact) {
				closeModal();
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [selectedArtifact, closeModal]);

	const handleCardClick = (e: React.MouseEvent, artifact: ListingData) => {
		e.preventDefault();
		play("click");
		const modalItem: ArtifactModalItem = {
			outpoint: artifact.outpoint,
			originOutpoint: artifact.origin ?? artifact.outpoint,
			contentType: artifact.content_type ?? "",
			name: artifact.name,
		};
		if (
			typeof document !== "undefined" &&
			"startViewTransition" in document &&
			document.startViewTransition
		) {
			try {
				const transition = document.startViewTransition(() => {
					flushSync(() => {
						setSelectedArtifact(modalItem);
					});
				});
				void transition.ready;
			} catch {
				setSelectedArtifact(modalItem);
			}
		} else {
			setSelectedArtifact(modalItem);
		}
	};

	const activityAvailable = featuresQuery.data?.features.activity === true;
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
		useInfiniteQuery({
			queryKey: ["market-flow"],
			queryFn: fetchMarketActivity,
			getNextPageParam: (lastPage) => lastPage.nextCursor,
			initialPageParam: undefined as number | undefined,
			enabled: activityAvailable,
		});

	const allArtifacts = useMemo(() => {
		const flat = data?.pages.flatMap((page) => page.items) || [];
		const seen = new Set<string>();
		return flat.filter((artifact) => {
			if (!artifact?.outpoint) return false;
			if (!artifact.origin) return false;
			const outpointStr = artifact.outpoint;
			if (seen.has(outpointStr)) return false;
			seen.add(outpointStr);
			return true;
		});
	}, [data?.pages]);

	// Distribute artifacts into columns
	const columns = useMemo(() => {
		const cols: ListingData[][] = Array.from({ length: columnCount }, () => []);
		allArtifacts.forEach((artifact, i) => {
			cols[i % columnCount].push(artifact);
		});
		return cols;
	}, [allArtifacts, columnCount]);

	// Track scroll position for infinite scroll
	useEffect(() => {
		const handleScroll = () => {
			const scrollY = window.scrollY;
			const windowHeight = window.innerHeight;
			const documentHeight = document.body.scrollHeight;

			const isNearBottom = scrollY + windowHeight >= documentHeight - 100; // 100px threshold

			if (isNearBottom && hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const renderArtifact = (artifact: ListingData) => {
		const outpointStr = artifact.outpoint;
		const originOutpoint = artifact.origin;

		if (!originOutpoint) return null;

		const src = stackContentUrl(originOutpoint);
		const contentType = getContentType(artifact);
		const imgSrc =
			contentType === "image" ? getOrdinalThumbnail(originOutpoint, 375) : src;
		const isVisible = visible.has(outpointStr);

		return (
			<div
				key={outpointStr}
				className={`block mb-4 relative break-inside-avoid group transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
				ref={(el) => observeImage(el, outpointStr)}
			>
				{/* Main Click Target - Link */}
				<Link
					href={`/outpoint/${toUrlOutpoint(outpointStr)}`}
					className="absolute inset-0 z-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					onClick={(e) => handleCardClick(e, artifact)}
				>
					<span className="sr-only">View Artifact</span>
				</Link>

				{/* Card Content */}
				<div className="relative shadow-md bg-card rounded-lg overflow-hidden pointer-events-none">
					<Button
						aria-label="Open artifact in new tab"
						variant="ghost"
						size="icon"
						className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/50 hover:bg-background/70 text-foreground pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							window.open(
								stackContentUrl(originOutpoint),
								"_blank",
								"noopener,noreferrer",
							);
						}}
					>
						<SquareArrowOutUpRight className="w-4 h-4" />
					</Button>

					{contentType === "video" && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
							<div className="p-4 bg-background/60 rounded-full">
								<Play className="w-12 h-12 text-foreground fill-foreground" />
							</div>
						</div>
					)}

					{contentType === "video" ? (
						<video
							src={src}
							className="w-full h-auto"
							width={375}
							muted
							playsInline
						/>
					) : contentType === "3d" ? (
						<div className="w-full aspect-square bg-muted flex items-center justify-center">
							<Box className="w-24 h-24 text-muted-foreground" />
						</div>
					) : contentType === "audio" ? (
						<div className="w-full aspect-square bg-muted flex items-center justify-center">
							<Music className="w-24 h-24 text-muted-foreground" />
						</div>
					) : contentType === "image" ? (
						<ImageWithFallback
							src={imgSrc}
							alt={artifact.name || `Image ${artifact.outpoint}`}
							className="w-full h-auto"
							width={375}
							height={375}
						/>
					) : (
						<div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-muted p-4 text-center text-muted-foreground">
							<FileQuestion className="size-16 opacity-60" />
							<span className="max-w-full truncate text-xs">
								{artifact.content_type || "Unknown content type"}
							</span>
						</div>
					)}

					<div className="absolute inset-0 flex flex-col justify-end p-4 text-foreground bg-gradient-to-t from-background via-transparent to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 pointer-events-none">
						<p className="text-base font-bold">
							{toBitcoin(artifact.price || 0)} BSV
						</p>
						<p className="text-sm truncate">{artifact.name || ""}</p>
					</div>
				</div>
			</div>
		);
	};

	if (featuresQuery.isLoading) {
		return (
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4" role="status">
				<span className="sr-only">Checking activity capabilities</span>
				<LoadingSkeleton count={4} />
			</div>
		);
	}
	if (featuresQuery.isError) {
		return (
			<p className="text-destructive" role="alert">
				Activity capabilities could not be loaded. Try again.
			</p>
		);
	}
	if (!activityAvailable) {
		return (
			<p className="text-muted-foreground" role="status">
				Activity is disabled because the stack does not advertise Market and
				ORDFS capabilities.
			</p>
		);
	}
	if (status === "pending") {
		return (
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4" role="status">
				<span className="sr-only">Loading market activity</span>
				<LoadingSkeleton count={8} />
			</div>
		);
	}
	if (status === "error") {
		return (
			<p className="text-destructive" role="alert">
				Market activity could not be loaded. Try again.
			</p>
		);
	}
	if (allArtifacts.length === 0) {
		return (
			<div className="space-y-4 py-20 text-center" role="status">
				<p className="text-muted-foreground">No market activity yet.</p>
				{hasNextPage && (
					<Button
						disabled={isFetchingNextPage}
						onClick={() => void fetchNextPage()}
						variant="outline"
					>
						{isFetchingNextPage ? "Loading…" : "Check for more activity"}
					</Button>
				)}
			</div>
		);
	}
	return (
		<>
			<div className={`relative ${className}`}>
				<div className="flex gap-4">
					{columns.map((colItems, colIndex) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: columns are structural
						<div key={colIndex} className="flex-1 flex flex-col gap-0 min-w-0">
							{colItems.map(renderArtifact)}
							{/* Add skeletons to columns when loading more */}
							{isFetchingNextPage && <LoadingSkeleton count={2} />}
						</div>
					))}
				</div>
				{hasNextPage && (
					<div className="mt-6 text-center">
						<Button
							disabled={isFetchingNextPage}
							onClick={() => void fetchNextPage()}
							variant="outline"
						>
							{isFetchingNextPage ? "Loading…" : "Load more"}
						</Button>
					</div>
				)}
			</div>

			<ArtifactModal artifact={selectedArtifact} onClose={closeModal} />
		</>
	);
}
