"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function Logo3D() {
  const ref = useRef<HTMLDivElement>(null);

  // Mouse position values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring animation for the rotation
  const mouseX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from center normalized (-1 to 1)
      const rotateXVal = (e.clientY - centerY) / (window.innerHeight / 2);
      const rotateYVal = (e.clientX - centerX) / (window.innerWidth / 2);

      x.set(rotateYVal);
      y.set(rotateXVal);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y]);

  // Map mouse values to rotation degrees
  const rotateX = useTransform(mouseY, [-1, 1], [35, -15]); // Stronger tilt
  const rotateY = useTransform(mouseX, [-1, 1], [-35, 35]);

  return (
    <div className="perspective-1000 py-20 flex justify-center overflow-visible" style={{ perspective: "1000px" }}>
      <motion.div
        ref={ref}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative cursor-default select-none group"
      >
        <TextLayer 
          text="1Sat" 
          faceColor="text-primary" 
          sideColor="text-foreground" 
        />
        <div className="inline-block w-8 md:w-12" /> {/* Spacer */}
        <TextLayer 
          text="Wallet" 
          faceColor="text-background" 
          sideColor="text-foreground" 
        />
      </motion.div>
    </div>
  );
}

function TextLayer({ 
  text, 
  faceColor, 
  sideColor 
}: { 
  text: string; 
  faceColor: string; 
  sideColor: string;
}) {
  const layers = 16; // Thicker block
  const depth = 1.5; // Distance between layers

  return (
    <div className="relative inline-block" style={{ transformStyle: "preserve-3d" }}>
      {/* Extrusion Layers (Back) */}
      {Array.from({ length: layers }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "absolute inset-0 text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase",
            sideColor
          )}
          style={{
            transform: `translateZ(-${(i + 1) * depth}px)`,
            zIndex: -1 - i,
            // Vary opacity slightly to simulate lighting/shading on the sides
            opacity: 1 - (i / layers) * 0.3,
          }}
          aria-hidden="true"
        >
          {text}
        </span>
      ))}

      {/* Front Face */}
      <span
        className={cn(
          "relative z-10 text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase block",
          faceColor
        )}
        style={{
          transform: "translateZ(0px)",
          // Tiny border to separate face from sides
          textShadow: "-1px -1px 0 rgba(0,0,0,0.1)"
        }}
      >
        {text}
      </span>
    </div>
  );
}
