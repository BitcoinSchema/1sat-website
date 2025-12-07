import type React from "react";
import { ORDFS } from "@/lib/constants";

type AudioArtifactProps = {
	outPoint?: string;
	src?: string;
	className?: string;
};

const AudioArtifact: React.FC<AudioArtifactProps> = ({
	outPoint,
	src,
	className,
}) => {
	return (
		<div className="relative h-full w-full flex flex-col items-center justify-center bg-gray-900 rounded">
			<div className="text-white mb-4">Audio Artifact</div>
			<audio
				className={`w-full transition ${className ? className : ""}`}
				src={src ? src : `${ORDFS}/${outPoint}`}
				id={`${src ? src : outPoint}_audio`}
				controls
			>
				<track kind="captions" />
			</audio>{" "}
		</div>
	);
};

export default AudioArtifact;
