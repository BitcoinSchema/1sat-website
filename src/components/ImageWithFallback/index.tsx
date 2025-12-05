"use client";

import type { ImageProps } from "next/image";
import { forwardRef } from "react";
import fallbackImage from "@/assets/images/oneSatLogoDark.svg";

interface Props extends Partial<ImageProps> {
	alt: string;
	src?: string | undefined;
	fallback?: string;
	className?: string;
}

const ImageWithFallback = forwardRef<HTMLImageElement, Props>(
	({ fallback = fallbackImage, alt, src = fallbackImage, ...props }, ref) => {
		// Filter out Next.js Image-specific props that aren't valid on regular img elements
		const {
			placeholder: _placeholder,
			blurDataURL: _blurDataURL,
			priority: _priority,
			quality: _quality,
			sizes: _sizes,
			fill: _fill,
			loading: _loading,
			unoptimized: _unoptimized,
			...imgProps
		} = props as any;

		// Detect and handle malformed URLs
		const isValidSrc =
			src &&
			typeof src === "string" &&
			!src.includes("[object Object]") &&
			!src.endsWith("/undefined") &&
			!src.endsWith("/null") &&
			!src.includes("undefined") &&
			!src.includes("null");

		const finalSrc = isValidSrc ? src : fallbackImage;

		return (
			<img
				ref={ref}
				style={{ background: "black" }}
				alt={alt}
				onError={(e) => {
					const target = e.target as HTMLImageElement;
					target.onerror = null; // Prevent infinite loop
					target.src = fallback; // Switch to fallback image
					target.classList.add("opacity-5");
				}}
				src={finalSrc}
				{...imgProps}
				className={`pointer-events-none ${imgProps.className || ""}`}
			/>
		);
	},
);

ImageWithFallback.displayName = "ImageWithFallback";

export default ImageWithFallback;
