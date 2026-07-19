"use client";

import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Loader2 } from "lucide-react";
import { Suspense, useState } from "react";

interface ModelArtifactProps {
	src: string;
	className?: string;
}

const Model = ({ src }: { src: string }) => {
	const { scene } = useGLTF(src);
	return <primitive object={scene} />;
};

// Renders GLTF/GLB model inscriptions with orbit controls
const ModelArtifact = ({ src, className }: ModelArtifactProps) => {
	const [failed, setFailed] = useState(false);

	if (failed) {
		return (
			<div className="w-full h-full flex items-center justify-center bg-muted">
				<p className="text-xs text-muted-foreground">
					Could not load 3D model
				</p>
			</div>
		);
	}

	return (
		<div className={className || "w-full h-full min-h-[300px]"}>
			<Canvas
				camera={{ position: [0, 0, 3], fov: 50 }}
				onError={() => setFailed(true)}
			>
				<ambientLight intensity={0.6} />
				<directionalLight position={[5, 5, 5]} intensity={1} />
				<Suspense fallback={null}>
					<Model src={src} />
					<Environment preset="city" />
				</Suspense>
				<OrbitControls enablePan={false} makeDefault />
			</Canvas>
			<noscript>
				<Loader2 className="w-6 h-6 animate-spin" />
			</noscript>
		</div>
	);
};

export default ModelArtifact;
