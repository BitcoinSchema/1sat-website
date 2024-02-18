"use client"

import "@google/model-viewer";
import { AnimationInterface } from "@google/model-viewer/lib/features/animation";
import { AnnotationInterface } from "@google/model-viewer/lib/features/annotation";
import { ARInterface } from "@google/model-viewer/lib/features/ar";
import { ControlsInterface } from "@google/model-viewer/lib/features/controls";
import { EnvironmentInterface } from "@google/model-viewer/lib/features/environment";
import { LoadingInterface } from "@google/model-viewer/lib/features/loading";
import { SceneGraphInterface } from "@google/model-viewer/lib/features/scene-graph";
import { StagingInterface } from "@google/model-viewer/lib/features/staging";
import ModelViewerElementBase from "@google/model-viewer/lib/model-viewer-base";

type ModelProps = {
	src: string;
	size?: number;
};

type ModelViewer = AnnotationInterface &
	SceneGraphInterface &
	StagingInterface &
	EnvironmentInterface &
	ControlsInterface &
	ARInterface &
	LoadingInterface &
	AnimationInterface &
	ModelViewerElementBase;

const Model: React.FC<ModelProps> = ({ src, size }) => {
	return (
			<model-viewer
				src={src}
        style={{ width: size || 300, height: size || 300, margin: "auto"}}
				poster="https://cdn.glitch.com/36cb8393-65c6-408d-a538-055ada20431b%2Fposter-astronaut.png?v=1599079951717"
				alt="3D Model - 1Sat Ordinal Preview"
				shadow-intensity="1"
				onLoadStart={() => {
					console.log("on model load start");
				}}
				onLoad={() => {
					console.log("on model load");
				}}
				onError={() => {
					console.log("on model error");
				}}
				auto-rotate
				camera-controls
				camera-orbit="0deg 90deg 0deg 8.37364m"
				seamless-poster
			/>
	);
};

export default Model;
