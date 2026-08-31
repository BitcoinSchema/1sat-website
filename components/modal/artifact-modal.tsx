"use client";

import { FileQuestion, Info, SquareArrowOutUpRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { BitPlanArtifact } from "@/components/artifact/bitplan";
import ImageWithFallback from "@/components/image-with-fallback";
import { Button } from "@/components/ui/button";
import {
	DialogContent,
	DialogTitle,
	SoundDialog,
} from "@/components/ui/sound-dialog";
import { stackContentUrl } from "@/lib/stack";

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
	/** Optional safe preview image instead of raw OrdFS content */
	previewUrl?: string;
	/** Optional canonical application viewer */
	externalUrl?: string;
}

interface ArtifactModalProps {
	artifact: ArtifactModalItem | null;
	onClose: () => void;
}

function classifyContentType(
	ct: string,
): "video" | "audio" | "3d" | "text" | "html" | "image" | "other" {
	if (ct.startsWith("video/")) return "video";
	if (ct.startsWith("audio/")) return "audio";
	if (ct.includes("model/") || ct.includes("gltf")) return "3d";
	if (ct.includes("html")) return "html";
	if (ct.startsWith("text/")) return "text";
	if (ct.startsWith("image/")) return "image";
	return "other";
}

const ArtifactModal = ({ artifact, onClose }: ArtifactModalProps) => {
	const router = useRouter();

	if (!artifact) return null;

	const {
		outpoint,
		originOutpoint,
		contentType,
		name,
		previewUrl,
		externalUrl,
	} = artifact;
	const isBitPlan = contentType === "application/x-bitplan";
	const contentClass = previewUrl ? "image" : classifyContentType(contentType);
	const src = previewUrl ?? stackContentUrl(originOutpoint);
	const openUrl =
		externalUrl ??
		(isBitPlan ? `https://bitplan.dev/d/${originOutpoint}` : src);
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
							aria-label="View artifact details"
							variant="ghost"
							size="icon"
							onClick={() => router.push(`/outpoint/${outpoint}`)}
							className="h-8 w-8"
						>
							<Info className="w-4 h-4" />
						</Button>
						<Button
							aria-label="Open artifact in new tab"
							variant="ghost"
							size="icon"
							onClick={() =>
								window.open(openUrl, "_blank", "noopener,noreferrer")
							}
							className="h-8 w-8"
						>
							<SquareArrowOutUpRight className="w-4 h-4" />
						</Button>
						<Button
							aria-label="Close artifact preview"
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
					className={`bg-card flex-1 flex ${allowScroll ? "items-start overflow-auto" : "items-center overflow-hidden"} justify-center`}
					aria-label="Artifact viewer"
				>
					{isBitPlan ? (
						<BitPlanArtifact key={originOutpoint} origin={originOutpoint} />
					) : contentClass === "video" ? (
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
							sandbox=""
						/>
					) : contentClass === "image" ? (
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
					) : (
						<div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
							<FileQuestion className="size-16 opacity-60" />
							<p className="text-sm">
								Preview unavailable for this content type.
							</p>
							<code className="max-w-full break-all text-xs">
								{contentType || "unknown"}
							</code>
						</div>
					)}
				</section>
			</DialogContent>
		</SoundDialog>
	);
};

export default ArtifactModal;
