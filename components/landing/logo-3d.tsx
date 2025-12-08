"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Text3D, Environment, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef, useState, useMemo, useEffect } from "react";
import { Suspense } from "react";
import * as THREE from "three";
import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";

// Use Kanit ExtraBold Italic TTF directly
const FONT_TTF_URL = "/fonts/Kanit-ExtraBoldItalic.ttf";

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

    // Load TTF font - use raw parsed data directly
    const ttfLoader = new TTFLoader();
    ttfLoader.load(FONT_TTF_URL, (parsedFont) => {
      // Store raw parsed font data - Text3D can use it directly
      setFont(parsedFont);
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

      <Rig>
        <Center>
          <group>
            {/* 1SAT in primary color (yellow) - on left */}
            <Word
              text="1SAT"
              position={[-17, 0, 0]}
              size={6.5}
              baseColor={colors.primary}
              borderColor={colors.border}
              font={font}
            />
            {/* WALLET in foreground color (white) - on right */}
            <Word
              text="WALLET"
              position={[13, 0, 0]}
              size={6.5}
              baseColor={colors.foreground}
              borderColor={colors.border}
              brokenIndices={[1, 4]} // A and E flicker
              font={font}
            />
          </group>
        </Center>
      </Rig>
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
}: {
  text: string;
  position: [number, number, number];
  size: number;
  baseColor: THREE.Color;
  borderColor: THREE.Color;
  brokenIndices?: number[];
  font: any;
}) {
  const letters = text.split('');

  // Balanced spacing (1.0x size) - compromise for varying character widths
  const letterWidth = size * 1.0;
  const totalWidth = letterWidth * letters.length;
  const startX = -totalWidth / 2;

  return (
    <group position={position}>
      {letters.map((char, i) => {
        return (
          <Letter
            key={i}
            char={char}
            position={[startX + i * letterWidth, 0, 0]}
            size={size}
            baseColor={baseColor}
            borderColor={borderColor}
            isBroken={brokenIndices.includes(i)}
            font={font}
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
}: {
  char: string;
  position: [number, number, number];
  size: number;
  baseColor: THREE.Color;
  borderColor: THREE.Color;
  isBroken: boolean;
  font: any;
}) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Flicker State - initialize to a random future time so they don't all sync
  const nextFlickerTime = useRef(Math.random() * 10 + 5); // First flicker 5-15 seconds from now
  const isOff = useRef(false);
  const flickerCount = useRef(0); // Track rapid flickers in a sequence

  useFrame((state) => {
    if (!materialRef.current) return;

    // Stable letters (not broken) - constant glow
    if (!isBroken) {
      materialRef.current.emissiveIntensity = 3;
      return;
    }

    // Broken letter flicker effect - like a dying lamp
    const time = state.clock.elapsedTime;

    if (time > nextFlickerTime.current) {
      if (isOff.current) {
        // Turn back ON
        isOff.current = false;
        flickerCount.current++;

        if (flickerCount.current < 2 + Math.floor(Math.random() * 2)) {
          // Quick flicker sequence (2-3 rapid on/off)
          nextFlickerTime.current = time + Math.random() * 0.15 + 0.05;
        } else {
          // Done flickering, stay stable for a while (5-12 seconds)
          flickerCount.current = 0;
          nextFlickerTime.current = time + Math.random() * 7 + 5;
        }
        materialRef.current.emissiveIntensity = 4;
      } else {
        // Turn OFF briefly
        isOff.current = true;
        nextFlickerTime.current = time + Math.random() * 0.1 + 0.03;
        materialRef.current.emissiveIntensity = 0.2;
      }
    } else {
      // Between state changes - gradual decay when ON
      if (!isOff.current) {
        materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
          materialRef.current.emissiveIntensity,
          3,
          0.03
        );
      }
    }
  });

  // Materials - Solid colored with metallic/glossy look
  const mainMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.3,
    metalness: 0.6,
    emissive: baseColor,
    emissiveIntensity: 0.3,
  }), [baseColor]);

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
        font={font as any}
        size={size}
        height={size * 0.25}
        curveSegments={32} // High curve segments for smooth curves
        bevelEnabled
        bevelThickness={size * 0.03}
        bevelSize={size * 0.015}
        bevelOffset={0}
        bevelSegments={8}
        material={[mainMaterial, sideMaterial]}
      >
        {char}
      </Text3D>

      {/* Inner glow layer */}
      <Text3D
        font={font as any}
        size={size * 0.92}
        height={size * 0.08}
        position={[size * 0.04, size * 0.04, size * 0.2]}
        curveSegments={24}
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
