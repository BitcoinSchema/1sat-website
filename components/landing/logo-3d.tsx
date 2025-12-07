"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Text3D, Environment, Float } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRef, useState, useMemo, useEffect } from "react";
import { Suspense } from "react";
import * as THREE from "three";

// Font URL
const FONT_URL = "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json";

export function Logo3D() {
  const [colors, setColors] = useState<{ primary: THREE.Color; foreground: THREE.Color; border: THREE.Color } | null>(null);
  
  useEffect(() => {
    // Helper to resolve color from a temporary DOM element to ensure we get the Computed RGB
    const getThemeColor = (className: string, fallback: string) => {
        if (typeof window === 'undefined') return new THREE.Color(fallback);
        
        const div = document.createElement('div');
        div.className = className;
        div.style.cssText = 'position: fixed; top: -9999px; left: -9999px; visibility: hidden;';
        document.body.appendChild(div);
        
        // Wait a tick for styles to apply? Usually immediate for appended elements.
        const computedColor = getComputedStyle(div).color;
        document.body.removeChild(div);
        
        // Check if we got a valid color string
        if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)') {
            // Handle modern CSS color formats (lab, oklch) that Three.js might not parse
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
  }, []);

  if (!colors) return <div className="h-[500px] w-full bg-transparent" />; 

  return (
    <div className="h-[500px] w-full relative cursor-default">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 25], fov: 35 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
            <Scene colors={colors} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Scene({ colors }: { colors: { primary: THREE.Color; foreground: THREE.Color; border: THREE.Color } }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 20, 10]} angle={0.2} penumbra={1} intensity={1.5} />
      <pointLight position={[-10, -10, 10]} intensity={0.8} color={colors.primary} />
      <pointLight position={[0, 0, 5]} intensity={0.2} color="#ffffff" />

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
                {/* Row 1: 1SAT (Large, Primary) */}
                <Word 
                    text="1SAT" 
                    position={[0, 2.2, 0]} 
                    size={4.5}
                    letterSpacing={0.2}
                    baseColor={colors.primary} 
                    borderColor={colors.border}
                    brokenIndices={[]} 
                />
                
                {/* Row 2: WALLET (Smaller, Foreground) */}
                {/* Adjusted size/spacing to roughly match width of 1SAT */}
                <Word 
                    text="WALLET" 
                    position={[0, -2.2, 0]} 
                    size={2.8}
                    letterSpacing={0.35}
                    baseColor={colors.foreground} 
                    borderColor={colors.border}
                    brokenIndices={[1, 4]} // A, E
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
    
    // Input: Mouse Y (-1 to 1) and Scroll Y
    // Normalize scroll effect
    const scrollEffect = scrollY.current * 0.002;
    
    // Tilt X: Controlled by Mouse Y and Scroll
    const targetRotationX = (state.pointer.y * 0.3) + scrollEffect;
    
    // Clamp tilt to avoid flipping
    const clampedRotationX = Math.max(-0.8, Math.min(0.8, targetRotationX));

    // Lerp for smoothness
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      clampedRotationX,
      0.05
    );
    
    // No Y rotation (side to side)
    group.current.rotation.y = 0;
  });
  
  return <group ref={group}>{children}</group>;
}

function Word({ 
    text, 
    position, 
    size,
    letterSpacing = 0,
    baseColor, 
    borderColor,
    brokenIndices = [] 
}: { 
    text: string; 
    position: [number, number, number]; 
    size: number;
    letterSpacing?: number;
    baseColor: THREE.Color; 
    borderColor: THREE.Color;
    brokenIndices?: number[] 
}) {
    const letters = text.split('');
    // Calculate total width to center the letters manually
    // We approximate width based on size + spacing since we don't have font metrics upfront
    const approxWidth = letters.length * (size * 0.7) + (letters.length - 1) * letterSpacing;
    
    return (
        <group position={position}>
            {letters.map((char, i) => {
                // Simple centering logic
                const xPos = (i * (size * 0.7 + letterSpacing)) - (approxWidth / 2);
                return (
                    <Letter 
                        key={i} 
                        char={char} 
                        position={[xPos, 0, 0]}
                        size={size}
                        baseColor={baseColor}
                        borderColor={borderColor}
                        isBroken={brokenIndices.includes(i)}
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
    isBroken 
}: { 
    char: string; 
    position: [number, number, number]; 
    size: number;
    baseColor: THREE.Color; 
    borderColor: THREE.Color;
    isBroken: boolean; 
}) {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    
    // Flicker State
    const nextFlickerTime = useRef(0);
    const isOff = useRef(false);

    useFrame((state) => {
        if (!materialRef.current) return;

        // 1. Stable State (Not Broken)
        if (!isBroken) {
            materialRef.current.emissiveIntensity = 3;
            materialRef.current.color = baseColor;
            materialRef.current.emissive = baseColor;
            return;
        }

        // 2. Flicker Logic (Broken)
        const time = state.clock.elapsedTime;
        
        if (time > nextFlickerTime.current) {
            if (isOff.current) {
                // Turn ON
                isOff.current = false;
                nextFlickerTime.current = time + Math.random() * 4 + 1; // ON for 1-5s
                materialRef.current.emissiveIntensity = 5; // Surge
            } else {
                // Turn OFF
                isOff.current = true;
                nextFlickerTime.current = time + Math.random() * 0.2 + 0.05; // OFF for short
                materialRef.current.emissiveIntensity = 0.1;
            }
        } else {
            // Decaying surge if ON
            if (!isOff.current) {
                materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
                    materialRef.current.emissiveIntensity, 
                    3, // Base intensity
                    0.1
                );
            }
        }
    });

    // Materials
    const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        roughness: 0.1,
        transmission: 0.99,
        thickness: 1.5,
        color: new THREE.Color("#ffffff"),
        opacity: 0.1,
        transparent: true,
        side: THREE.DoubleSide
    }), []);

    const borderMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: borderColor,
        roughness: 0.4,
        metalness: 0.9,
        emissive: borderColor,
        emissiveIntensity: 0.2
    }), [borderColor]);

    return (
        <group position={position}>
            {/* Glass Casing with Border */}
            <Text3D 
                font={FONT_URL} 
                size={size} 
                height={size * 0.3} // Proportional depth
                curveSegments={12}
                bevelEnabled
                bevelThickness={size * 0.05}
                bevelSize={size * 0.02}
                bevelOffset={0}
                bevelSegments={3}
                material={[glassMaterial, borderMaterial]} // Face=Glass, Sides=Border
            >
                {char}
            </Text3D>

            {/* Filament (Light Source) */}
            <Text3D 
                font={FONT_URL} 
                size={size * 0.85} 
                height={size * 0.1} 
                position={[size * 0.075, size * 0.075, size * 0.15]} 
                curveSegments={12}
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
