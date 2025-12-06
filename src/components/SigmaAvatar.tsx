"use client";

import { useMemo } from "react";

interface SigmaAvatarProps {
	address: string;
	size?: number;
	className?: string;
}

/**
 * Simple avatar component that generates a unique visual representation
 * based on the address hash
 */
export default function SigmaAvatar({
	address,
	size = 40,
	className = "",
}: SigmaAvatarProps) {
	const { backgroundColor, pattern } = useMemo(() => {
		// Simple hash function for the address
		let hash = 0;
		for (let i = 0; i < address.length; i++) {
			hash = (hash << 5) - hash + address.charCodeAt(i);
			hash = hash & hash; // Convert to 32bit integer
		}

		// Generate colors from hash
		const hue = Math.abs(hash) % 360;
		const saturation = 50 + (Math.abs(hash >> 8) % 30);
		const lightness = 40 + (Math.abs(hash >> 16) % 20);

		const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

		// Generate a simple pattern
		const patternType = Math.abs(hash) % 3;

		return { backgroundColor, pattern: patternType };
	}, [address]);

	return (
		<div
			className={`inline-flex items-center justify-center rounded-full overflow-hidden ${className}`}
			style={{
				width: size,
				height: size,
				backgroundColor,
			}}
		>
			<svg width={size} height={size} viewBox="0 0 100 100">
				{pattern === 0 && (
					// Circle pattern
					<>
						<circle cx="50" cy="50" r="30" fill="rgba(255,255,255,0.2)" />
						<circle cx="50" cy="50" r="15" fill="rgba(0,0,0,0.2)" />
					</>
				)}
				{pattern === 1 && (
					// Triangle pattern
					<>
						<polygon points="50,20 80,80 20,80" fill="rgba(255,255,255,0.2)" />
						<polygon points="50,35 70,70 30,70" fill="rgba(0,0,0,0.2)" />
					</>
				)}
				{pattern === 2 && (
					// Square pattern
					<>
						<rect
							x="25"
							y="25"
							width="50"
							height="50"
							fill="rgba(255,255,255,0.2)"
						/>
						<rect x="35" y="35" width="30" height="30" fill="rgba(0,0,0,0.2)" />
					</>
				)}
			</svg>
		</div>
	);
}
