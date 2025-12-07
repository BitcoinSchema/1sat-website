"use client";

import { useEffect, useRef } from "react";

export function EncryptionGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Grid configuration
    const gridSize = 14; // Smaller text
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#%&@!?<>";
    const spotlightRadius = 300;
    
    // Mouse movement tracking for animation state
    let lastMouseMoveTime = 0;

    // Pre-calculate grid dimensions
    let cols = Math.ceil(width / gridSize);
    let rows = Math.ceil(height / gridSize);
    
    // Store grid state
    const gridData: { char: string; updateTime: number }[] = [];

    const initGrid = () => {
      cols = Math.ceil(width / gridSize);
      rows = Math.ceil(height / gridSize);
      gridData.length = 0;
      for (let i = 0; i < cols * rows; i++) {
        gridData.push({
          char: chars[Math.floor(Math.random() * chars.length)],
          updateTime: Math.random() * 1000
        });
      }
    };

    // Track mouse
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      lastMouseMoveTime = Date.now();
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Re-init grid on resize by wrapping the original resize
    const resizeHandler = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initGrid();
    };


    const render = (time: number) => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get color from the canvas element's computed style (which inherits text-primary)
      const computedStyle = getComputedStyle(canvas);
      const color = computedStyle.color || "#22c55e"; // Fallback

      ctx.font = `${gridSize * 0.8}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      
      const isAnimating = Date.now() - lastMouseMoveTime < 500; // Animate for 500ms after last move

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = y * cols + x;
          const cellX = x * gridSize + gridSize / 2;
          const cellY = y * gridSize + gridSize / 2;

          // Calculate distance to mouse
          const dx = cellX - mouseRef.current.x;
          const dy = cellY - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < spotlightRadius) {
            // Calculate opacity based on distance
            const opacity = (1 - Math.pow(dist / spotlightRadius, 2)) * 0.5; // Reduce max opacity for subtlety
            
            // Update character randomly (entropy effect) only if animating
            if (isAnimating && time - gridData[idx].updateTime > 50) { // Faster updates (50ms)
              gridData[idx].char = chars[Math.floor(Math.random() * chars.length)];
              gridData[idx].updateTime = time;
            }

            // Draw
            ctx.globalAlpha = opacity;
            ctx.fillText(gridData[idx].char, cellX, cellY);
            ctx.globalAlpha = 1.0;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Initial setup
    resizeHandler();
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 text-primary/20"
      style={{ opacity: 0.4 }}
    />
  );
}
