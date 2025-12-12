"use client";

import { Center, Environment, Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { folder, useControls } from "leva";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export interface RingsControls {
	scale: number;
	thickness: number;
	gap: number;
	outerColor: string;
	middleColor: string;
	innerColor: string;
	emissiveIntensity: number;
	speed: number;
	gyroMode: boolean;
}

export function OrdinalLogo3D() {
	return (
		<div className="h-[400px] w-full relative cursor-default">
			<Canvas
				dpr={[1, 2]}
				camera={{ position: [0, 0, 10], fov: 35 }}
				gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
			>
				<Scene />
			</Canvas>
		</div>
	);
}

function Scene() {
	const controls = useControls("Ordinal Logo", {
		Layout: folder({
			scale: { value: 1.5, min: 0.1, max: 5, step: 0.1 },
			thickness: { value: 0.15, min: 0.01, max: 0.5, step: 0.01 },
			gap: { value: 0.3, min: 0, max: 1, step: 0.05 },
		}),
		Colors: folder({
			outerColor: "#ffffff",
			middleColor: "#333333", // Dark/Gap
			innerColor: "#F0BB00", // Gold
			emissiveIntensity: { value: 1.0, min: 0, max: 5, step: 0.1 },
		}),
		Material: folder({
			metalness: { value: 0.8, min: 0, max: 1, step: 0.05 },
			roughness: { value: 0.1, min: 0, max: 1, step: 0.05 },
			transmission: { value: 0.2, min: 0, max: 1, step: 0.05 },
		}),
		Animation: folder({
			speed: { value: 0.5, min: 0, max: 5, step: 0.1 },
			gyroMode: { value: false, label: "Gyroscope Mode" },
		}),
	});

	// Material
	const material = useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				metalness: controls.metalness,
				roughness: controls.roughness,
				transmission: controls.transmission,
				clearcoat: 1,
				clearcoatRoughness: 0.1,
			}),
		[controls.metalness, controls.roughness, controls.transmission],
	);

	return (
		<>
			<ambientLight intensity={0.5} />
			<pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
			<spotLight
				position={[-10, 0, 10]}
				intensity={2}
				color={controls.innerColor}
			/>

			<Environment preset="city" />

			<EffectComposer>
				<Bloom
					luminanceThreshold={1.5}
					intensity={1.0}
					radius={0.5}
					mipmapBlur
				/>
			</EffectComposer>

			<Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
				<Center>
					<group scale={controls.scale as number}>
						<Rings
							controls={controls as RingsControls}
							baseMaterial={material}
						/>
					</group>
				</Center>
			</Float>
		</>
	);
}

export function Rings({
	controls,
	baseMaterial,
}: {
	controls: RingsControls;
	baseMaterial: THREE.MeshPhysicalMaterial;
}) {
	const outerRef = useRef<THREE.Group>(null);

	useFrame((state) => {
		if (outerRef.current && controls.speed > 0) {
			outerRef.current.rotation.y += state.clock.getDelta() * controls.speed;
			if (controls.gyroMode) {
				outerRef.current.rotation.x =
					Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
				outerRef.current.rotation.z =
					Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
			}
		}
	});

	// Fixed proportions based on SVG (201, 151, 121)
	const outerRadius = 2.0;
	const middleRadius = outerRadius * (151 / 201); // ~1.5
	const innerRadius = outerRadius * (121 / 201); // ~1.2

	// Create solid disc materials with glow
	const matOuter = useMemo(() => {
		const m = baseMaterial.clone();
		m.color.set(controls.outerColor);
		m.emissive.set(controls.outerColor);
		m.emissiveIntensity = controls.emissiveIntensity * 0.3;
		m.toneMapped = false;
		return m;
	}, [baseMaterial, controls.outerColor, controls.emissiveIntensity]);

	const matMiddle = useMemo(() => {
		const m = baseMaterial.clone();
		m.color.set(controls.middleColor);
		m.emissive.set(controls.middleColor);
		m.emissiveIntensity = controls.emissiveIntensity * 0.3;
		m.toneMapped = false;
		return m;
	}, [baseMaterial, controls.middleColor, controls.emissiveIntensity]);

	const matInner = useMemo(() => {
		const m = baseMaterial.clone();
		m.color.set(controls.innerColor);
		m.emissive.set(controls.innerColor);
		m.emissiveIntensity = controls.emissiveIntensity * 0.5;
		m.toneMapped = false;
		return m;
	}, [baseMaterial, controls.innerColor, controls.emissiveIntensity]);

	return (
		<group ref={outerRef}>
			{/* Outer Circle - White (back layer) */}
			<mesh position={[0, 0, 0]} material={matOuter}>
				<circleGeometry args={[outerRadius, 64]} />
			</mesh>

			{/* Middle Circle - Black (covers center of white, leaving white ring) */}
			<mesh position={[0, 0, 0.01]} material={matMiddle}>
				<circleGeometry args={[middleRadius, 64]} />
			</mesh>

			{/* Inner Circle - Yellow (covers center of black, leaving black ring) */}
			<mesh position={[0, 0, 0.02]} material={matInner}>
				<circleGeometry args={[innerRadius, 64]} />
			</mesh>
		</group>
	);
}
