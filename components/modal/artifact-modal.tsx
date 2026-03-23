"use client";

import { Info, SquareArrowOutUpRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import ImageWithFallback from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import {
	DialogContent,
	DialogTitle,
	SoundDialog,
} from "@/components/ui/sound-dialog";

const ORDFS = "https://ordfs.network";

/**
 * Minimal artifact shape for the modal.
 * Works with both WalletOutput (via adapter) and OrdUtxo (marketplace).
 */
export interface ArtifactModalItem {
	/** Display outpoint (txid_vout format) */
	outpoint: string;
	/** Origin outpoint for ORDFS content URL */
	originOutpoint: string;
	/** MIME content type */
	contentType: string;
	/** Display name */
	name?: string;
}

interface ArtifactModalProps {
	artifact: ArtifactModalItem | null;
	onClose: () => void;
}

function classifyContentType(
	ct: string,
): "video" | "audio" | "3d" | "text" | "html" | "image" {
	if (ct.startsWith("video/")) return "video";
	if (ct.startsWith("audio/")) return "audio";
	if (ct.includes("model/") || ct.includes("gltf")) return "3d";
	if (ct.includes("html")) return "html";
	if (ct.startsWith("text/")) return "text";
	return "image";
}

const ArtifactModal = ({ artifact, onClose }: ArtifactModalProps) => {
	const router = useRouter();
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
	const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (!scrollContainerRef.current) return;
		setIsDragging(true);
		setDragStart({ x: e.clientX, y: e.clientY });
		setScrollStart({
			x: scrollContainerRef.current.scrollLeft,
			y: scrollContainerRef.current.scrollTop,
		});
		e.preventDefault();
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging || !scrollContainerRef.current) return;
		const dx = e.clientX - dragStart.x;
		const dy = e.clientY - dragStart.y;
		scrollContainerRef.current.scrollLeft = scrollStart.x - dx;
		scrollContainerRef.current.scrollTop = scrollStart.y - dy;
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	if (!artifact) return null;

	const { outpoint, originOutpoint, contentType, name } = artifact;
	const contentClass = classifyContentType(contentType);
	const src = `${ORDFS}/content/${originOutpoint}`;
	const allowScroll =
		contentClass === "image" ||
		contentClass === "text" ||
		contentClass === "html";

	return (
		<SoundDialog open={!!artifact} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-[90vw] w-full h-[96vh] p-0 gap-0 bg-background border-border overflow-hidden flex flex-col">
				<div className="sr-only">
					<DialogTitle>{name || "Artifact Preview"}</DialogTitle>
				</div>

				<div className="flex items-center justify-between gap-2 px-4 h-12 border-b border-border shrink-0">
					<p className="text-sm font-medium text-foreground truncate">
						{name || "\u00A0"}
					</p>
					<div className="flex gap-1 items-center">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => router.push(`/outpoint/${outpoint}`)}
							className="h-8 w-8"
						>
							<Info className="w-4 h-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => window.open(src, "_blank", "noopener,noreferrer")}
							className="h-8 w-8"
						>
							<SquareArrowOutUpRight className="w-4 h-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="h-8 w-8"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				</div>

				<section
					ref={scrollContainerRef}
					className={`bg-card flex-1 flex ${allowScroll ? "items-start overflow-auto" : "items-center overflow-hidden"} justify-center`}
					aria-label="Artifact viewer"
					onMouseDown={allowScroll ? handleMouseDown : undefined}
					onMouseMove={allowScroll ? handleMouseMove : undefined}
					onMouseUp={allowScroll ? handleMouseUp : undefined}
					onMouseLeave={allowScroll ? handleMouseUp : undefined}
					style={{
						cursor: allowScroll
							? isDragging
								? "grabbing"
								: "grab"
							: "default",
					}}
				>
					{contentClass === "video" ? (
						<video
							src={src}
							controls
							className="max-w-full max-h-full"
							playsInline
						>
							<track kind="captions" />
						</video>
					) : contentClass === "audio" ? (
						<div className="flex items-center justify-center w-full p-8">
							<audio src={src} controls className="w-full max-w-lg">
								<track kind="captions" />
							</audio>
						</div>
					) : contentClass === "html" ? (
						<iframe
							src={src}
							title="Artifact"
							className="w-full h-full border-0"
							sandbox="allow-scripts"
						/>
					) : contentClass === "text" ? (
						<iframe
							src={src}
							title="Artifact"
							className="w-full h-full border-0"
						/>
					) : (
						<div
							className={
								allowScroll
									? "flex items-center justify-center min-h-full w-full p-8"
									: "contents"
							}
						>
							<ImageWithFallback
								src={src}
								alt="Full size artifact"
								className={
									allowScroll
										? "w-auto h-auto select-none"
										: "max-w-full max-h-full object-contain select-none"
								}
								draggable={false}
								width={1200}
								height={1200}
								style={{
									viewTransitionName: `artifact-${outpoint}`,
								}}
							/>
						</div>
					)}
				</section>
			</DialogContent>
		</SoundDialog>
	);
};

export default ArtifactModal;
