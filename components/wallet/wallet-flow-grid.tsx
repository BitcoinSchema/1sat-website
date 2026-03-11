"use client";

import type { WalletOutput } from "@1sat/actions";
import { Box, Loader2, Music, Play, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import ImageWithFallback from "@/components/image-with-fallback";
import ArtifactModal, {
	type ArtifactModalItem,
} from "@/components/modal/artifact-modal";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { ORDFS } from "@/lib/constants";
import { getOrdinalThumbnail } from "@/lib/image-utils";
import {
	classifyContent,
	getContentType,
	getDisplayOutpoint,
	getName,
	getOriginOutpoint,
	parseWalletOutpoint,
} from "@/lib/wallet/wallet-output-utils";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

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
	const [selectedArtifact, setSelectedArtifact] =
		useState<ArtifactModalItem | null>(null);
	const [displayCount, setDisplayCount] = useState(pageSize);

	const columnCount = useColumnCount();
	const observerRef = useRef<IntersectionObserver | null>(null);

	const displayedArtifacts = useMemo(
		() => ordinals.slice(0, displayCount),
		[ordinals, displayCount],
	);

	const hasMore = displayCount < ordinals.length;

	const observeImage = useCallback(
		(element: HTMLElement | null, outpoint: string) => {
			if (!element || visible.has(outpoint)) return;

			if (!observerRef.current) {
				observerRef.current = new IntersectionObserver(
					(entries) => {
						const newVisible = new Set<string>();
						for (const entry of entries) {
							if (entry.isIntersecting) {
								const id = entry.target.getAttribute("data-outpoint");
								if (id) newVisible.add(id);
								observerRef.current?.unobserve(entry.target);
							}
						}

						if (newVisible.size > 0) {
							setVisible((prev) => {
								const next = new Set(prev);
								for (const id of newVisible) {
									next.add(id);
								}
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

	const handleCardClick = (e: React.MouseEvent, artifact: WalletOutput) => {
		e.preventDefault();
		play("click");
		const modalItem: ArtifactModalItem = {
			outpoint: getDisplayOutpoint(artifact),
			originOutpoint: getOriginOutpoint(artifact),
			contentType: getContentType(artifact),
			name: getName(artifact),
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

	const columns = useMemo(() => {
		const cols: WalletOutput[][] = Array.from(
			{ length: columnCount },
			() => [],
		);
		for (let i = 0; i < displayedArtifacts.length; i++) {
			cols[i % columnCount].push(displayedArtifacts[i]);
		}
		return cols;
	}, [displayedArtifacts, columnCount]);
	const columnIds = useMemo(
		() => Array.from({ length: columnCount }, (_, col) => `col-${col}`),
		[columnCount],
	);

	useEffect(() => {
		const handleScroll = () => {
			const scrollY = window.scrollY;
			const windowHeight = window.innerHeight;
			const documentHeight = document.body.scrollHeight;

			if (scrollY + windowHeight >= documentHeight - 200 && hasMore) {
				setDisplayCount((prev) =>
					Math.min(prev + pageSize, ordinals.length),
				);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [hasMore, pageSize, ordinals.length]);

	const renderArtifact = (artifact: WalletOutput) => {
		const outpointStr = getDisplayOutpoint(artifact);
		const originOutpoint = getOriginOutpoint(artifact);
		const src = `${ORDFS}/${originOutpoint}`;
		const contentType = classifyContent(artifact);
		const imgSrc =
			contentType === "image" ? getOrdinalThumbnail(originOutpoint, 300) : src;
		const isVisible = visible.has(outpointStr);
		const { txid } = parseWalletOutpoint(artifact);

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
							alt={`Ordinal ${txid.slice(0, 8)}`}
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
					{ordinals.length} Ordinal{ordinals.length !== 1 ? "s" : ""}
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

					{ordinals.length === 0 && (
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

			<ArtifactModal artifact={selectedArtifact} onClose={closeModal} />
		</>
	);
}
