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
		let renderQueued = false;
		let width = window.innerWidth;
		let height = window.innerHeight;

		// Grid configuration
		const gridSize = 14; // Smaller text
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#%&@!?<>";
		const spotlightRadius = 300;

		// Pre-calculate grid dimensions
		let cols = Math.ceil(width / gridSize);
		let rows = Math.ceil(height / gridSize);

		// Store grid state
		const gridData: { char: string; updateTime: number }[] = [];

		// Store style
		let gridColor = "#22c55e"; // Default fallback

		const initGrid = () => {
			cols = Math.ceil(width / gridSize);
			rows = Math.ceil(height / gridSize);
			gridData.length = 0;
			for (let i = 0; i < cols * rows; i++) {
				gridData.push({
					char: chars[Math.floor(Math.random() * chars.length)],
					updateTime: Math.random() * 1000,
				});
			}
		};

		// Re-init grid on resize by wrapping the original resize
		const resizeHandler = () => {
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = width;
			canvas.height = height;

			// Update color on resize/theme change (if window resizes, likely theme might change too in some setups, or just good practice)
			// We try to get the color from the canvas element which inherits text-primary
			const computed = getComputedStyle(canvas);
			if (computed.color && computed.color !== "") {
				gridColor = computed.color;
			}

			initGrid();
			queueRender();
		};

		const render = (time: number) => {
			renderQueued = false;
			// Clear canvas
			ctx.clearRect(0, 0, width, height);

			ctx.font = `${gridSize * 0.8}px monospace`;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = gridColor;

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
						const opacity = (1 - (dist / spotlightRadius) ** 2) * 0.5; // Reduce max opacity for subtlety

						if (time - gridData[idx].updateTime > 50) {
							// Faster updates (50ms)
							gridData[idx].char =
								chars[Math.floor(Math.random() * chars.length)];
							gridData[idx].updateTime = time;
						}

						// Draw
						ctx.globalAlpha = opacity;
						ctx.fillText(gridData[idx].char, cellX, cellY);
						ctx.globalAlpha = 1.0;
					}
				}
			}
		};

		const queueRender = () => {
			if (renderQueued) return;
			renderQueued = true;
			animationFrameId = requestAnimationFrame(render);
		};

		const handleMouseMove = (event: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			mouseRef.current = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};
			queueRender();
		};

		// Initial setup
		resizeHandler();
		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (!reducedMotion) window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("resize", resizeHandler);

		return () => {
			window.removeEventListener("resize", resizeHandler);
			if (!reducedMotion)
				window.removeEventListener("mousemove", handleMouseMove);
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	return (
		<canvas
			aria-hidden="true"
			tabIndex={-1}
			ref={canvasRef}
			className="absolute inset-0 pointer-events-none z-0 text-primary/20"
			style={{ opacity: 0.4 }}
		/>
	);
}
