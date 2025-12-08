"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Text3D, Environment, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef, useState, useMemo, useEffect } from "react";
import { useControls, folder } from "leva";
import { Suspense } from "react";
import * as THREE from "three";
import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";

// Use Kanit ExtraBold (Regular) TTF directly
const FONT_TTF_URL = "/fonts/Kanit-ExtraBold.ttf";

export function Logo3D() {
  const [colors, setColors] = useState<{ primary: THREE.Color; foreground: THREE.Color; border: THREE.Color } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [font, setFont] = useState<any>(null);

  useEffect(() => {
    // Helper to resolve color from a temporary DOM element
    const getThemeColor = (className: string, fallback: string) => {
      if (typeof window === 'undefined') return new THREE.Color(fallback);

      const div = document.createElement('div');
      div.className = className;
      div.style.cssText = 'position: fixed; top: -9999px; left: -9999px; visibility: hidden;';
      document.body.appendChild(div);

      const computedColor = getComputedStyle(div).color;
      document.body.removeChild(div);

      if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)') {
        if (computedColor.includes('lab(') || computedColor.includes('oklch(')) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
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
      foreground: getThemeColor("text-foreground", "#ffffff"),
      border: getThemeColor("border", "#3f3f46"),
    });

    // Load TTF font - TTFLoader.load returns parsed font data
    const ttfLoader = new TTFLoader();
    ttfLoader.load(FONT_TTF_URL, (parsedFont) => {
      // Create Font instance to access metrics
      const fontInstance = new Font(parsedFont);
      setFont(fontInstance);
      console.log("[Logo3D] Font loaded successfully");
    }, undefined, (error) => {
      console.error("[Logo3D] Failed to load font:", error);
    });
  }, []);

  if (!colors || !font) return <div className="h-[200px] w-full bg-transparent" />;

  return (
    <div className="h-[200px] w-full relative cursor-default">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 22], fov: 35 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <Scene colors={colors} font={font} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Scene({ colors, font }: { colors: { primary: THREE.Color; foreground: THREE.Color; border: THREE.Color }; font: any }) {
  const controls = useControls({
    Layout: folder({
      wordGap: { value: 30, min: 20, max: 50, step: 1 },
      leftWordOffset: { value: -17, min: -30, max: 0, step: 0.5 },
      rightWordOffset: { value: 13, min: 0, max: 30, step: 0.5 },
      letterSize: { value: 6.5, min: 3, max: 10, step: 0.1 },
      letterSpacing: { value: 1.0, min: 0.5, max: 2.0, step: 0.05 },
    }),
    Material: folder({
      roughness: { value: 0.2, min: 0, max: 1, step: 0.05 },
      metalness: { value: 0.1, min: 0, max: 1, step: 0.05 },
      transmission: { value: 0.6, min: 0, max: 1, step: 0.05 }, // Glass-like transmission
      thickness: { value: 0.5, min: 0, max: 5, step: 0.1 },
      opacity: { value: 0.9, min: 0, max: 1, step: 0.05 },
      emissiveIntensity: { value: 0.2, min: 0, max: 2, step: 0.1 },
    }),
    Flicker: folder({
      onIntensity: { value: 4, min: 1, max: 10, step: 0.5 },
      offIntensity: { value: 0.2, min: 0, max: 1, step: 0.1 },
    })
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <spotLight position={[10, 20, 10]} angle={0.2} penumbra={1} intensity={1.5} />
      <pointLight position={[-10, -10, 10]} intensity={0.8} color={colors.primary} />
      <pointLight position={[0, 0, 5]} intensity={0.3} color="#ffffff" />

      {/* Post Processing for Glow */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={1.2}
          mipmapBlur
          intensity={1.5}
          radius={0.4}
        />
      </EffectComposer>

      <Environment preset="city" />

      <Float speed={1.0} rotationIntensity={0.1} floatIntensity={1.0}>
        <Rig>
          <Center>
            <group>
              {/* 1SAT in primary color (yellow) - on left */}
              <Word
                text="1SAT"
                position={[controls.leftWordOffset, 0, 0]}
                size={controls.letterSize}
                baseColor={colors.primary}
                borderColor={colors.border}
                font={font}
                letterSpacingMult={controls.letterSpacing}
                materialProps={controls}
              />
              {/* WALLET in foreground color (white) - on right */}
              <Word
                text="WALLET"
                position={[controls.rightWordOffset, 0, 0]}
                size={controls.letterSize}
                baseColor={colors.foreground}
                borderColor={colors.border}
                brokenIndices={[1, 4]} // A and E flicker
                font={font}
                letterSpacingMult={controls.letterSpacing}
                materialProps={controls}
              />
            </group>
          </Center>
        </Rig>
      </Float>
    </>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
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
    const targetRotationX = (-state.pointer.y * 0.3) + scrollEffect;
    const clampedRotationX = Math.max(-0.8, Math.min(0.8, targetRotationX));

    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      clampedRotationX,
      0.05
    );

    group.current.rotation.y = 0;
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
  letterSpacingMult?: number;
  materialProps?: any;
}) {
  const letters = text.split('');

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
    const glyph = font.data.glyphs[char] || font.data.glyphs['?'];

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

  return (
    <group position={position}>
      {letters.map((char, i) => {
        return (
          <Letter
            key={i}
            char={char}
            position={[startX + letterPositions[i], 0, 0]}
            size={size}
            baseColor={baseColor}
            borderColor={borderColor}
            isBroken={brokenIndices.includes(i)}
            font={font}
            materialProps={materialProps}
          />
        );
      })}
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
  font,
  materialProps,
}: {
  char: string;
  position: [number, number, number];
  size: number;
  baseColor: THREE.Color;
  borderColor: THREE.Color;
  isBroken: boolean;
  font: any;
  materialProps?: any;
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Flicker State - initialize to a random future time so they don't all sync
  const nextFlickerTime = useRef(Math.random() * 10 + 5); // First flicker 5-15 seconds from now
  const isOff = useRef(false);
  const flickerCount = useRef(0); // Track rapid flickers in a sequence

  // Default values if props missing
  const onIntensity = materialProps?.onIntensity ?? 4;
  const offIntensity = materialProps?.offIntensity ?? 0.2;
  const stableIntensity = materialProps?.emissiveIntensity ?? 3;

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
          0.1
        );
      }
    }
  });

  // Materials - Translucent/Glassy to let inner flicker shine through
  const mainMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: baseColor,
    roughness: materialProps?.roughness ?? 0.2,
    metalness: materialProps?.metalness ?? 0.1,
    transmission: materialProps?.transmission ?? 0.6, // Glass effect
    thickness: materialProps?.thickness ?? 0.5, // Volume refraction
    opacity: materialProps?.opacity ?? 0.9,
    transparent: true, // Needed for opacity/transmission
    emissive: baseColor,
    emissiveIntensity: 0.2, // Low base emissive, let inner light do the work
  }), [baseColor, materialProps?.roughness, materialProps?.metalness, materialProps?.transmission, materialProps?.thickness, materialProps?.opacity]);

  const sideMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: borderColor,
    roughness: 0.4,
    metalness: 0.8,
    emissive: borderColor,
    emissiveIntensity: 0.1
  }), [borderColor]);

  return (
    <group position={position}>
      {/* Main 3D Letter */}
      <Text3D
        font={font.data} // Pass raw JSON data to Text3D to fix yMax error
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
        font={font.data} // Pass raw JSON data
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
