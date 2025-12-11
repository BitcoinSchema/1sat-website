"use client";

/**
 * WalletFlowGrid - Displays wallet ordinals in a masonry grid layout
 * with infinite scroll, using the same pattern as FlowGrid but
 * sourcing data from the wallet provider instead of market API.
 */

import { Box, Loader2, Music, Play, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import ImageWithFallback from "@/components/image-with-fallback";
import ArtifactModal from "@/components/modal/artifact-modal";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { ORDFS } from "@/lib/constants";
import { getOrdinalThumbnail } from "@/lib/image-utils";
import type { OrdUtxo } from "@/lib/types/ordinals";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

const _LoadingSkeleton = ({ count }: { count: number }) => (
	<>
		{(() => {
			const items = [];
			for (let slot = 0; slot < count; slot++) {
				items.push(
					<div
						key={`skeleton-${slot}`}
						className="relative mb-4 break-inside-avoid"
					>
						<div className="w-full aspect-square rounded-lg bg-muted animate-pulse" />
					</div>,
				);
			}
			return items;
		})()}
	</>
);

const getContentType = (
	artifact: OrdUtxo,
): "video" | "audio" | "3d" | "image" => {
	const contentType = artifact.origin?.data?.insc?.file.type || "";
	if (contentType.startsWith("video/")) return "video";
	if (contentType.startsWith("audio/")) return "audio";
	if (contentType.includes("model/") || contentType.includes("gltf"))
		return "3d";
	return "image";
};

// Hook to determine number of columns based on window width
const useColumnCount = () => {
	const [columns, setColumns] = useState(1);

	useEffect(() => {
		const updateColumns = () => {
			const width = window.innerWidth;
			if (width >= 1280) setColumns(5);
			else if (width >= 1024) setColumns(4);
			else if (width >= 768) setColumns(3);
			else if (width >= 640) setColumns(2);
			else setColumns(2);
		};

		updateColumns();
		window.addEventListener("resize", updateColumns);
		return () => window.removeEventListener("resize", updateColumns);
	}, []);

	return columns;
};

interface WalletFlowGridProps {
	className?: string;
	pageSize?: number;
}

export default function WalletFlowGrid({
	className = "",
	pageSize = 50,
}: WalletFlowGridProps) {
	const { play } = useSound();
	const { ordinals, isInitialized, isInitializing } = useWalletToolbox();
	const [visible, setVisible] = useState<Set<string>>(new Set());
	const [selectedArtifact, setSelectedArtifact] = useState<OrdUtxo | null>(
		null,
	);
	const [showBackdrop, setShowBackdrop] = useState(false);
	const [displayCount, setDisplayCount] = useState(pageSize);

	const columnCount = useColumnCount();
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Convert wallet ordinals to OrdUtxo format
	const allArtifacts = useMemo((): OrdUtxo[] => {
		return ordinals.map((ord) => ({
			txid: ord.txid,
			vout: ord.vout,
			outpoint: `${ord.txid}_${ord.vout}`,
			satoshis: ord.satoshis,
			script: ord.script || "",
			height: 0,
			idx: 0,
			origin: {
				outpoint: `${ord.txid}_${ord.vout}`,
				data: ord.data,
			},
			data: ord.data,
		}));
	}, [ordinals]);

	// Slice for "infinite scroll" simulation
	const displayedArtifacts = useMemo(() => {
		return allArtifacts.slice(0, displayCount);
	}, [allArtifacts, displayCount]);

	const hasMore = displayCount < allArtifacts.length;

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
		setShowBackdrop(false);
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

	const handleCardClick = (e: React.MouseEvent, artifact: OrdUtxo) => {
		e.preventDefault();
		play("click");
		if (
			typeof document !== "undefined" &&
			"startViewTransition" in document &&
			document.startViewTransition
		) {
			try {
				const transition = document.startViewTransition(() => {
					flushSync(() => {
						setSelectedArtifact(artifact);
					});
				});
				transition.ready
					.then(() => setShowBackdrop(true))
					.catch(() => setShowBackdrop(true));
			} catch {
				setSelectedArtifact(artifact);
				setShowBackdrop(true);
			}
		} else {
			setSelectedArtifact(artifact);
			setShowBackdrop(true);
		}
	};

	// Distribute artifacts into columns
	const columns = useMemo(() => {
		const cols: OrdUtxo[][] = Array.from({ length: columnCount }, () => []);
		displayedArtifacts.forEach((artifact, i) => {
			cols[i % columnCount].push(artifact);
		});
		return cols;
	}, [displayedArtifacts, columnCount]);
	const columnIds = useMemo(
		() => Array.from({ length: columnCount }, (_, col) => `col-${col}`),
		[columnCount],
	);

	// Infinite scroll handler
	useEffect(() => {
		const handleScroll = () => {
			const scrollY = window.scrollY;
			const windowHeight = window.innerHeight;
			const documentHeight = document.body.scrollHeight;

			const isNearBottom = scrollY + windowHeight >= documentHeight - 200;

			if (isNearBottom && hasMore) {
				setDisplayCount((prev) =>
					Math.min(prev + pageSize, allArtifacts.length),
				);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [hasMore, pageSize, allArtifacts.length]);

	const renderArtifact = (artifact: OrdUtxo) => {
		const outpointStr = artifact.outpoint;
		const originOutpoint = artifact.origin?.outpoint || outpointStr;
		const src = `${ORDFS}/${originOutpoint}`;
		const contentType = getContentType(artifact);
		const imgSrc =
			contentType === "image" ? getOrdinalThumbnail(originOutpoint, 300) : src;
		const isVisible = visible.has(outpointStr);

		return (
			<div
				key={outpointStr}
				className={`block mb-3 relative break-inside-avoid group transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
				ref={(el) => observeImage(el, outpointStr)}
			>
				<Link
					href={`/outpoint/${outpointStr}/timeline`}
					className="absolute inset-0 z-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					onClick={(e) => handleCardClick(e, artifact)}
				>
					<span className="sr-only">View Artifact</span>
				</Link>

				<div className="relative shadow-md bg-card rounded-lg overflow-hidden pointer-events-none">
					<Button
						variant="ghost"
						size="icon"
						className="absolute top-2 right-2 z-10 h-7 w-7 bg-black/50 hover:bg-black/70 text-white pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							window.open(
								`${ORDFS}/${originOutpoint}`,
								"_blank",
								"noopener,noreferrer",
							);
						}}
					>
						<SquareArrowOutUpRight className="w-3.5 h-3.5" />
					</Button>

					{contentType === "video" && (
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
							<div className="p-3 bg-black/60 rounded-full">
								<Play className="w-8 h-8 text-white fill-white" />
							</div>
						</div>
					)}

					{contentType === "video" ? (
						<video
							src={src}
							className="w-full h-auto"
							width={300}
							muted
							playsInline
						/>
					) : contentType === "3d" ? (
						<div className="w-full aspect-square bg-gradient-to-br from-purple-900/30 to-blue-900/30 flex items-center justify-center">
							<Box className="w-16 h-16 text-purple-300/50" />
						</div>
					) : contentType === "audio" ? (
						<div className="w-full aspect-square bg-gradient-to-br from-pink-900/30 to-orange-900/30 flex items-center justify-center">
							<Music className="w-16 h-16 text-pink-300/50" />
						</div>
					) : (
						<ImageWithFallback
							src={imgSrc}
							alt={`Ordinal ${artifact.txid.slice(0, 8)}`}
							className="w-full h-auto"
							width={300}
							height={300}
						/>
					)}
				</div>
			</div>
		);
	};

	if (isInitializing) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
				<span className="ml-3 text-muted-foreground">Loading wallet...</span>
			</div>
		);
	}

	if (!isInitialized) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				Please unlock or create a wallet to view your ordinals.
			</div>
		);
	}

	return (
		<>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-medium">
					{allArtifacts.length} Ordinal{allArtifacts.length !== 1 ? "s" : ""}
				</h3>
			</div>

			<div className={`relative ${className}`}>
				<div className="flex gap-3">
					{columnIds.map((columnId, col) => {
						const colItems = columns[col] ?? [];
						return (
							<div
								key={columnId}
								className="flex-1 flex flex-col gap-0 min-w-0"
							>
								{colItems.map(renderArtifact)}
							</div>
						);
					})}

					{allArtifacts.length === 0 && (
						<div className="w-full text-center py-20 text-muted-foreground col-span-full">
							No ordinals found in your wallet.
						</div>
					)}
				</div>

				{hasMore && (
					<div className="flex justify-center py-8">
						<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>

			<ArtifactModal
				artifact={selectedArtifact}
				showBackdrop={showBackdrop}
				onClose={closeModal}
			/>
		</>
	);
}
