import { Play } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { ORDFS } from "@/lib/constants";

type VideoArtifactProps = {
	origin?: string;
	src?: string;
	className?: string;
	thumbnail?: boolean;
};

const VideoArtifact: React.FC<VideoArtifactProps> = ({
	origin,
	src,
	className,
	thumbnail = false,
}) => {
	const [playing, setPlaying] = useState(false);
	const videoSrc = src ? src : `${ORDFS}/${origin}`;
	const needsHeightConstraint = className?.includes("h-full");

	// Thumbnail mode - show poster image with play button overlay
	if (thumbnail && !playing) {
		return (
			<button
				type="button"
				className={`relative cursor-pointer w-full h-full p-0 border-0 bg-transparent ${className || ""}`}
				onClick={(e) => {
					e.stopPropagation();
					e.preventDefault();
					setPlaying(true);
				}}
			>
				<video
					className="w-full h-full object-cover"
					src={videoSrc}
					preload="metadata"
					muted
					playsInline
				>
					<track kind="captions" />
				</video>
				<div className="absolute inset-0 flex items-center justify-center bg-black/30">
					<div className="p-4 bg-black/60 rounded-full">
						<Play className="w-12 h-12 text-white fill-white" />
					</div>
				</div>
			</button>
		);
	}

	return (
		<video
			className={`transition ${className || ""}`}
			style={
				needsHeightConstraint
					? { maxHeight: "calc(96vh - 4rem)", maxWidth: "100%" }
					: undefined
			}
			src={videoSrc}
			controls={true}
			preload={thumbnail ? "none" : "auto"}
			autoPlay={playing}
			onClick={(e) => e.stopPropagation()}
		>
			<track kind="captions" />
		</video>
	);
};

export default VideoArtifact;
