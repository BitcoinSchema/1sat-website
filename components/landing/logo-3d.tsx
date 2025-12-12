"use client";

import { Environment, Float, Text3D } from "@react-three/drei";
import type { FontData as DreiFontData } from "@react-three/drei/core/useFont";
import { Canvas, useFrame } from "@react-three/fiber";
import {
	Bloom,
	ChromaticAberration,
	EffectComposer,
	Glitch,
	Noise,
} from "@react-three/postprocessing";
import { folder, useControls } from "leva";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { FontData as ThreeFontData } from "three/examples/jsm/loaders/FontLoader.js";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";
import { useIsMobile } from "@/hooks/use-mobile";
import { Rings, type RingsControls } from "./ordinal-logo-3d";

// Use Kanit ExtraBold (Regular) TTF directly
const FONT_TTF_URL = "/fonts/Kanit-ExtraBold.ttf";

interface LogoControls {
	wordGap: number;
	leftWordOffset: number;
	rightWordOffset: number;
	letterSize: number;
	letterSpacing: number;
	roughness: number;
	metalness: number;
	transmission: number;
	thickness: number;
	opacity: number;
	emissiveIntensity: number;
	onIntensity: number;
	offIntensity: number;
	enableGlitch: boolean;
	glitchDelayMin: number;
	glitchDelayMax: number;
	glitchDurationMin: number;
	glitchDurationMax: number;
	glitchStrengthMin: number;
	glitchStrengthMax: number;
	glitchRatio: number;
	enableChromatic: boolean;
	chromaticOffset: number;
	enableNoise: boolean;
	noiseOpacity: number;
	floatSpeed: number;
	floatRotationIntensity: number;
	floatIntensity: number;
	floatingRange: [number, number];
	ringsEnabled: boolean;
	ringsScale: number;
	ringsPosition: [number, number, number];
	ringsOuterColor: string;
	ringsMiddleColor: string;
	ringsInnerColor: string;
	ringsThickness: number;
	ringsGap: number;
	ringsSpeed: number;
	ringsEmissive: number;
	ringsGyro: boolean;
}

export function Logo3D() {
	const [colors, setColors] = useState<{
		primary: THREE.Color;
		primaryForeground: THREE.Color;
		secondary: THREE.Color;
		secondaryForeground: THREE.Color;
		foreground: THREE.Color;
		border: THREE.Color;
	} | null>(null);
	const [font, setFont] = useState<Font | null>(null);

	useEffect(() => {
		// Helper to resolve color from a temporary DOM element
		const getThemeColor = (className: string, fallback: string) => {
			// ... (existing helper logic matches previous implementation, omitting for brevity in diff but assuming function exists in scope or I should verify I am not deleting it)
			// Actually I am replacing lines 17-60. I need to keep getThemeColor definition or re-include it.
			// To be safe I will just replace the setColors call and the type definition using separate chunks or re-include the helper.
			if (typeof window === "undefined") return new THREE.Color(fallback);

			const div = document.createElement("div");
			div.className = className;
			div.style.cssText =
				"position: fixed; top: -9999px; left: -9999px; visibility: hidden;";
			document.body.appendChild(div);

			const computedColor = getComputedStyle(div).color;
			document.body.removeChild(div);

			if (computedColor && computedColor !== "rgba(0, 0, 0, 0)") {
				if (
					computedColor.includes("lab(") ||
					computedColor.includes("oklch(")
				) {
					try {
						const canvas = document.createElement("canvas");
						canvas.width = 1;
						canvas.height = 1;
						const ctx = canvas.getContext("2d");
						if (ctx) {
							ctx.fillStyle = computedColor;
							ctx.fillRect(0, 0, 1, 1);
							const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
							return new THREE.Color(`rgb(${r}, ${g}, ${b})`);
						}
					} catch (e) {
						console.warn("Color conversion failed:", e);
					}
				}
				return new THREE.Color(computedColor);
			}
			return new THREE.Color(fallback);
		};

		setColors({
			primary: getThemeColor("text-primary", "#22c55e"),
			primaryForeground: getThemeColor("text-primary-foreground", "#000000"),
			secondary: getThemeColor("text-secondary", "#f4f4f5"),
			secondaryForeground: getThemeColor(
				"text-secondary-foreground",
				"#18181b",
			),
			foreground: getThemeColor("text-foreground", "#ffffff"),
			border: getThemeColor("border", "#3f3f46"),
		});

		// Load TTF font - TTFLoader.load returns parsed font data
		const ttfLoader = new TTFLoader();
		ttfLoader.load(
			FONT_TTF_URL,
			(parsedFont) => {
				// Create Font instance to access metrics
				const fontInstance = new Font(parsedFont);
				setFont(fontInstance);
				console.log("[Logo3D] Font loaded successfully");
			},
			undefined,
			(error) => {
				console.error("[Logo3D] Failed to load font:", error);
			},
		);
	}, []);

	if (!colors || !font)
		return <div className="h-[280px] md:h-[360px] w-full bg-transparent" />;

	return (
		<div className="w-full min-w-0 h-[280px] md:h-[360px] relative cursor-default overflow-hidden">
			<Canvas
				dpr={[1, 2]}
				camera={{ position: [0, 0, 28], fov: 30 }}
				gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
				resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
				}}
			>
				<Suspense fallback={null}>
					<Scene colors={colors} font={font} />
				</Suspense>
			</Canvas>
		</div>
	);
}

function Scene({
	colors,
	font,
}: {
	colors: {
		primary: THREE.Color;
		primaryForeground: THREE.Color;
		secondary: THREE.Color;
		secondaryForeground: THREE.Color;
		foreground: THREE.Color;
		border: THREE.Color;
	};
	font: Font;
}) {
	const isMobile = useIsMobile();
	const controls = useControls({
		Layout: folder({
			wordGap: { value: 10, min: 5, max: 50, step: 1 },
			leftWordOffset: { value: -13, min: -30, max: 0, step: 0.5 },
			rightWordOffset: { value: 10, min: 0, max: 30, step: 0.5 },
			letterSize: { value: 5.5, min: 3, max: 10, step: 0.1 },
			letterSpacing: { value: 0.9, min: 0.5, max: 2.0, step: 0.05 },
		}),
		Material: folder({
			roughness: { value: 0.0, min: 0, max: 1, step: 0.05 },
			metalness: { value: 0.3, min: 0, max: 1, step: 0.05 },
			transmission: { value: 0.0, min: 0, max: 1, step: 0.05 }, // Glass-like transmission
			thickness: { value: 0.5, min: 0, max: 5, step: 0.1 },
			opacity: { value: 0.9, min: 0, max: 1, step: 0.05 },
			emissiveIntensity: { value: 0.2, min: 0, max: 2, step: 0.1 },
		}),
		Flicker: folder({
			onIntensity: { value: 4, min: 1, max: 10, step: 0.5 },
			offIntensity: { value: 0.2, min: 0, max: 1, step: 0.1 },
		}),
		Effects: folder({
			enableGlitch: { value: true },
			glitchDelayMin: { value: 1.5, min: 0.1, max: 10, step: 0.1 },
			glitchDelayMax: { value: 3.5, min: 0.1, max: 10, step: 0.1 },
			glitchDurationMin: { value: 0.6, min: 0.1, max: 5, step: 0.1 },
			glitchDurationMax: { value: 1.0, min: 0.1, max: 5, step: 0.1 },
			glitchStrengthMin: { value: 0.1, min: 0, max: 1, step: 0.05 },
			glitchStrengthMax: { value: 0.2, min: 0, max: 1, step: 0.05 },
			glitchRatio: { value: 0.85, min: 0, max: 1, step: 0.05 }, // 0-1, threshold for strong glitch
			enableChromatic: { value: true },
			chromaticOffset: { value: 0.002, min: 0, max: 0.05, step: 0.001 },
			enableNoise: { value: false },
			noiseOpacity: { value: 0.05, min: 0, max: 0.5, step: 0.01 },
		}),
		Animation: folder({
			floatSpeed: { value: 2.0, min: 0, max: 10, step: 0.1 },
			floatRotationIntensity: { value: 0.5, min: 0, max: 5, step: 0.1 },
			floatIntensity: { value: 2.0, min: 0, max: 10, step: 0.1 },
			floatingRange: { value: [-0.2, 0.5] }, // Reduced range
		}),
		Rings: folder({
			ringsEnabled: { value: true },
			ringsScale: { value: 4.0, min: 0.1, max: 20, step: 0.1 },
			ringsPosition: { value: [0, 2, -15] },
			ringsOuterColor: "#ffffff",
			ringsMiddleColor: "#000000",
			ringsInnerColor: "#F7931A", // Orange/Yellow
			ringsThickness: { value: 0.1, min: 0.01, max: 1.0, step: 0.01 },
			ringsGap: { value: 0.1, min: 0, max: 1, step: 0.05 },
			ringsSpeed: { value: 0.5, min: 0, max: 5, step: 0.1 },
			ringsEmissive: { value: 1.0, min: 0, max: 5, step: 0.1 },
			ringsGyro: { value: false },
		}),
	});
	const typedControls = controls as LogoControls;
	// Adapt Three FontData into Drei FontData for Text3D.
	const text3dFont = useMemo<DreiFontData>(() => {
		const source = font.data as ThreeFontData;
		const glyphs: DreiFontData["glyphs"] = {};
		for (const key of Object.keys(source.glyphs)) {
			const glyph = source.glyphs[key];
			const outline = glyph.o ? glyph.o.split(" ") : [];
			glyphs[key] = {
				_cachedOutline: outline,
				ha: glyph.ha,
				o: glyph.o ?? "",
			};
		}
		return {
			boundingBox: {
				yMin: source.boundingBox?.yMin ?? 0,
				yMax: source.boundingBox?.yMax ?? 0,
			},
			familyName: source.familyName,
			glyphs,
			resolution: source.resolution,
			underlineThickness: source.underlineThickness,
		};
	}, [font]);

	// Controls adapter for Rings component
	const ringsControls = useMemo<RingsControls>(
		() => ({
			scale: typedControls.ringsScale,
			thickness: typedControls.ringsThickness,
			gap: typedControls.ringsGap,
			outerColor: typedControls.ringsOuterColor,
			middleColor: typedControls.ringsMiddleColor,
			innerColor: typedControls.ringsInnerColor,
			emissiveIntensity: typedControls.ringsEmissive,
			speed: typedControls.ringsSpeed,
			gyroMode: typedControls.ringsGyro,
		}),
		[typedControls],
	);

	// Base material for rings, using shared scene material settings
	const ringsBaseMaterial = useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				metalness: typedControls.metalness,
				roughness: typedControls.roughness,
				transmission: typedControls.transmission,
				clearcoat: 1,
				clearcoatRoughness: 0.1,
			}),
		[
			typedControls.metalness,
			typedControls.roughness,
			typedControls.transmission,
		],
	);

	return (
		<>
			{/* Lighting */}
			<ambientLight intensity={0.3} />
			<spotLight
				position={[10, 20, 10]}
				angle={0.2}
				penumbra={1}
				intensity={1.5}
			/>
			<pointLight
				position={[-10, -10, 10]}
				intensity={0.8}
				color={colors.primary}
			/>
			<pointLight position={[0, 0, 5]} intensity={0.3} color="#ffffff" />

			{/* Post Processing for Glow & Glitch */}
			<EffectComposer>
				<Bloom
					luminanceThreshold={1.2}
					mipmapBlur
					intensity={1.5}
					radius={0.4}
				/>
				<ChromaticAberration
					offset={
						new THREE.Vector2(
							controls.enableChromatic ? controls.chromaticOffset : 0,
							controls.enableChromatic ? controls.chromaticOffset : 0,
						)
					}
				/>
				<Glitch
					delay={
						new THREE.Vector2(controls.glitchDelayMin, controls.glitchDelayMax)
					}
					duration={
						new THREE.Vector2(
							controls.glitchDurationMin,
							controls.glitchDurationMax,
						)
					}
					strength={
						new THREE.Vector2(
							controls.glitchStrengthMin,
							controls.glitchStrengthMax,
						)
					}
					active={controls.enableGlitch}
					ratio={controls.glitchRatio}
				/>
				<Noise opacity={controls.enableNoise ? controls.noiseOpacity : 0} />
			</EffectComposer>

			<Environment preset="city" />

			{/* Group 1: Main Text & Sign - High Intensity Rig - Float A */}
			<Float
				speed={controls.floatSpeed}
				rotationIntensity={controls.floatRotationIntensity}
				floatIntensity={controls.floatIntensity}
				floatingRange={controls.floatingRange as [number, number]}
			>
				<Rig intensity={1}>
					{/* Desktop layout - side by side, no Center wrapper needed since Word self-centers */}
					{!isMobile && (
						<group position={[0, -2, 0]}>
							<Word
								text="1SAT"
								position={[controls.leftWordOffset, 0, 0]}
								size={controls.letterSize}
								baseColor={colors.primary}
								borderColor={colors.primaryForeground}
								font={font}
								text3dFont={text3dFont}
								letterSpacingMult={controls.letterSpacing}
								materialProps={controls}
							/>
							<Word
								text="WALLET"
								position={[controls.rightWordOffset, 0, 0]}
								size={controls.letterSize}
								baseColor={colors.secondary}
								borderColor={colors.secondaryForeground}
								brokenIndices={[1, 4]}
								font={font}
								text3dFont={text3dFont}
								letterSpacingMult={controls.letterSpacing}
								materialProps={controls}
							/>
						</group>
					)}

					{/* Mobile layout - stacked vertically, each word self-centers */}
					{isMobile && (
						<group position={[0, -2, 0]}>
							<Word
								text="1SAT"
								position={[0, 2, 0]}
								size={2.8}
								baseColor={colors.primary}
								borderColor={colors.primaryForeground}
								font={font}
								text3dFont={text3dFont}
								letterSpacingMult={controls.letterSpacing}
								materialProps={controls}
							/>
							<Word
								text="WALLET"
								position={[0, -1.5, 0]}
								size={2.8}
								baseColor={colors.secondary}
								borderColor={colors.secondaryForeground}
								brokenIndices={[1, 4]}
								font={font}
								text3dFont={text3dFont}
								letterSpacingMult={controls.letterSpacing}
								materialProps={controls}
							/>
						</group>
					)}

					{/* Neon Sign - manually centered */}
					<group position={[isMobile ? -4 : -7, isMobile ? -5 : -4.5, 0]}>
						<Text3D
							font={text3dFont}
							size={isMobile ? 0.6 : 1.0}
							height={isMobile ? 0.1 : 0.15}
							letterSpacing={0.05}
							bevelEnabled
							bevelSize={isMobile ? 0.01 : 0.02}
							bevelThickness={isMobile ? 0.02 : 0.03}
						>
							LIVE P2P NETWORK
							<meshStandardMaterial
								color="#10b981"
								emissive="#10b981"
								emissiveIntensity={2.5}
								toneMapped={false}
							/>
						</Text3D>
					</group>
				</Rig>
			</Float>

			{/* Group 2: Background Rings - Low Intensity Rig - Float B (Desynced) */}
			{controls.ringsEnabled && (
				<Float
					speed={controls.floatSpeed * 0.7}
					rotationIntensity={controls.floatRotationIntensity}
					floatIntensity={controls.floatIntensity}
					floatingRange={controls.floatingRange as [number, number]}
				>
					<Rig intensity={0.05} lerpSpeed={0.02}>
						<group
							position={controls.ringsPosition as [number, number, number]}
							scale={controls.ringsScale}
						>
							<Rings
								controls={ringsControls}
								baseMaterial={ringsBaseMaterial}
							/>
						</group>
					</Rig>
				</Float>
			)}
		</>
	);
}

function Rig({
	children,
	intensity = 1,
	lerpSpeed = 0.05,
}: {
	children: React.ReactNode;
	intensity?: number;
	lerpSpeed?: number;
}) {
	const group = useRef<THREE.Group>(null);
	const scrollY = useRef(0);

	useEffect(() => {
		const handleScroll = () => {
			scrollY.current = window.scrollY;
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useFrame((state) => {
		if (!group.current) return;

		const scrollEffect = scrollY.current * 0.002;
		// Inverted mouse direction - negative pointer.y for correct tilt
		const targetRotationX = (-state.pointer.y * 0.3 + scrollEffect) * intensity;
		const clampedRotationX = Math.max(-0.8, Math.min(0.8, targetRotationX));

		group.current.rotation.x = THREE.MathUtils.lerp(
			group.current.rotation.x,
			clampedRotationX,
			lerpSpeed,
		);

		// Smoothly lock Y rotation to prevent matrix corruption from Float animation conflict
		group.current.rotation.y = THREE.MathUtils.lerp(
			group.current.rotation.y,
			0,
			lerpSpeed,
		);
	});

	return <group ref={group}>{children}</group>;
}

function Word({
	text,
	position,
	size,
	baseColor,
	borderColor,
	brokenIndices = [],
	font,
	text3dFont,
	letterSpacingMult = 1.0,
	materialProps,
}: {
	text: string;
	position: [number, number, number];
	size: number;
	baseColor: THREE.Color;
	borderColor: THREE.Color;
	brokenIndices?: number[];
	font: Font;
	text3dFont: DreiFontData;
	letterSpacingMult?: number;
	materialProps?: LogoControls;
}) {
	const letters = text.split("");

	// NATIVE FONT METRICS CALCULATION
	if (!font || !font.data || !font.data.glyphs) return null;

	const letterPositions: number[] = [];
	let currentX = 0;

	// Calculate scale factor: fontSize / fontResolution
	const resolution = font.data.resolution || 1000;
	const scale = size / resolution;

	letters.forEach((char) => {
		letterPositions.push(currentX);

		// Get the exact glyph data from the font
		const glyph = font.data.glyphs[char] || font.data.glyphs["?"];

		if (glyph) {
			// ha = Horizontal Advance (total width allocated for the character)
			// We apply the letterSpacingMult as a tracking adjustment on top of the native spacing
			// Tracking is usually added to the advance
			// Let's treat letterSpacingMult as: 1.0 = native, >1.0 = extra tracking
			const nativeWidth = glyph.ha * scale;

			// If user wants to tweak, we add extra spacing relative to size
			// (letterSpacingMult - 1) * offset
			const tracking = (letterSpacingMult - 1.0) * (size * 0.5);

			currentX += nativeWidth + tracking;
		} else {
			// Fallback
			currentX += size * 0.6;
		}
	});

	const totalWidth = currentX;
	const startX = -totalWidth / 2;

	const lettersWithMeta = letters.map((char, slot) => ({
		char,
		slot,
		x: letterPositions[slot],
		isBroken: brokenIndices.includes(slot),
	}));

	return (
		<group position={position}>
			{lettersWithMeta.map(({ char, slot, x, isBroken }) => (
				<Letter
					key={`letter-${slot}`}
					char={char}
					position={[startX + x, 0, 0]}
					size={size}
					baseColor={baseColor}
					borderColor={borderColor}
					isBroken={isBroken}
					text3dFont={text3dFont}
					materialProps={materialProps}
				/>
			))}
		</group>
	);
}

function Letter({
	char,
	position,
	size,
	baseColor,
	borderColor,
	isBroken,
	text3dFont,
	materialProps,
}: {
	char: string;
	position: [number, number, number];
	size: number;
	baseColor: THREE.Color;
	borderColor: THREE.Color;
	isBroken: boolean;
	text3dFont: DreiFontData;
	materialProps?: LogoControls;
}) {
	const materialRef = useRef<THREE.MeshStandardMaterial>(null);

	// Flicker State - initialize to a random future time so they don't all sync
	const nextFlickerTime = useRef(Math.random() * 10 + 5); // First flicker 5-15 seconds from now
	const isOff = useRef(false);
	const flickerCount = useRef(0); // Track rapid flickers in a sequence

	// Default values if props missing
	const onIntensity = materialProps?.onIntensity ?? 4;
	const offIntensity = materialProps?.offIntensity ?? 0.2;

	useFrame((state) => {
		if (!materialRef.current) return;

		// Normal letters - always bright
		if (!isBroken) {
			materialRef.current.emissiveIntensity = onIntensity;
			return;
		}

		// Broken letters (A, E) - flicker OFF occasionally
		const time = state.clock.elapsedTime;

		if (time > nextFlickerTime.current) {
			if (isOff.current) {
				// Turn back ON (return to normal bright state)
				isOff.current = false;
				flickerCount.current++;

				if (flickerCount.current < 2 + Math.floor(Math.random() * 2)) {
					// Quick flicker sequence (2-3 rapid on/off)
					nextFlickerTime.current = time + Math.random() * 0.15 + 0.05;
				} else {
					// Done flickering, stay ON for a while (5-12 seconds)
					flickerCount.current = 0;
					nextFlickerTime.current = time + Math.random() * 7 + 5;
				}
				materialRef.current.emissiveIntensity = onIntensity;
			} else {
				// Flicker OFF briefly
				isOff.current = true;
				nextFlickerTime.current = time + Math.random() * 0.1 + 0.03;
				materialRef.current.emissiveIntensity = offIntensity;
			}
		} else {
			// Between state changes - stay at current intensity
			if (!isOff.current) {
				materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
					materialRef.current.emissiveIntensity,
					onIntensity,
					0.1,
				);
			}
		}
	});

	// Materials - Translucent/Glassy to let inner flicker shine through
	const mainMaterial = useMemo(
		() =>
			new THREE.MeshPhysicalMaterial({
				color: baseColor,
				roughness: materialProps?.roughness ?? 0.2,
				metalness: materialProps?.metalness ?? 0.1,
				transmission: materialProps?.transmission ?? 0.6, // Glass effect
				thickness: materialProps?.thickness ?? 0.5, // Volume refraction
				opacity: materialProps?.opacity ?? 0.9,
				transparent: true, // Needed for opacity/transmission
				emissive: baseColor,
				emissiveIntensity: 0.2, // Low base emissive, let inner light do the work
			}),
		[
			baseColor,
			materialProps?.roughness,
			materialProps?.metalness,
			materialProps?.transmission,
			materialProps?.thickness,
			materialProps?.opacity,
		],
	);

	const sideMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: borderColor,
				roughness: 0.4,
				metalness: 0.8,
				emissive: borderColor,
				emissiveIntensity: 0.1,
			}),
		[borderColor],
	);

	return (
		<group position={position}>
			{/* Main 3D Letter */}
			<Text3D
				font={text3dFont}
				size={size}
				height={size * 0.25}
				curveSegments={64} // Ultra-high segments for perfectly smooth curves
				bevelEnabled
				bevelThickness={size * 0.03}
				bevelSize={size * 0.015}
				bevelOffset={0}
				bevelSegments={12} // More bevel segments for smooth edges
				material={[mainMaterial, sideMaterial]}
			>
				{char}
			</Text3D>

			{/* Inner glow layer */}
			<Text3D
				font={text3dFont}
				size={size * 0.92}
				height={size * 0.05} // Reduced height to avoid z-fighting with main text face
				position={[size * 0.04, size * 0.04, size * 0.2]}
				curveSegments={48} // Smoother inner layer
			>
				{char}
				<meshStandardMaterial
					ref={materialRef}
					color={baseColor}
					emissive={baseColor}
					emissiveIntensity={3}
					toneMapped={false}
				/>
			</Text3D>
		</group>
	);
}
