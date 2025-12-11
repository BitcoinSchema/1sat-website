/**
 * Image URL utilities for generating optimized image URLs
 *
 * This module provides functions to generate image URLs using our backend
 * image processing API instead of external services.
 */

import { ORDFS } from "./constants";

interface ImageOptions {
	width?: number;
	height?: number;
	fit?: "cover" | "contain" | "fill" | "inside" | "outside";
	background?: string; // Hex color without #
	format?: "auto" | "webp" | "jpeg" | "png" | "avif";
	quality?: number; // 1-100
}

/**
 * Generate an optimized image URL using our backend API
 */
export function getImageUrl(
	source: string,
	options: ImageOptions = {},
): string {
	const {
		width,
		height,
		fit = "cover",
		background,
		format = "auto",
		quality,
	} = options;

	const params = new URLSearchParams();
	params.set("url", source);

	if (width) params.set("w", String(width));
	if (height) params.set("h", String(height));
	if (fit !== "cover") params.set("fit", fit);
	if (background) params.set("bg", background);
	if (format !== "auto") params.set("f", format);
	if (quality) params.set("q", String(quality));

	return `/api/image?${params.toString()}`;
}

/**
 * Generate an optimized thumbnail URL for an ordinal
 */
export function getOrdinalThumbnail(
	outpoint: string,
	size: number = 300,
): string {
	const source = `${ORDFS}/${outpoint}`;
	return getImageUrl(source, {
		width: size,
		height: size,
		fit: "contain",
		background: "111111",
		format: "auto",
		quality: 80,
	});
}

/**
 * Generate a padded image URL (like Cloudinary's c_pad)
 */
export function getPaddedImageUrl(
	source: string,
	width: number,
	height?: number,
	background: string = "111111",
): string {
	return getImageUrl(source, {
		width,
		height: height || width,
		fit: "contain",
		background,
		format: "auto",
		quality: 80,
	});
}

/**
 * Generate a cropped/cover image URL
 */
export function getCoverImageUrl(
	source: string,
	width: number,
	height?: number,
): string {
	return getImageUrl(source, {
		width,
		height: height || width,
		fit: "cover",
		format: "auto",
		quality: 80,
	});
}
