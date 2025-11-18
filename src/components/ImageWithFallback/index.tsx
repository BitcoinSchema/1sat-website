"use client"

import fallbackImage from "@/assets/images/oneSatLogoDark.svg";
import Image, { type ImageProps } from "next/image";
import { forwardRef } from "react";

interface Props extends Partial<ImageProps> {
  alt: string;
  src?: string | undefined;
  fallback?: string;
  className?: string;
}

const ImageWithFallback = forwardRef<HTMLImageElement, Props>(({
  fallback = fallbackImage,
  alt,
  src = fallbackImage,
  ...props
}, ref) => {
  // Filter out Next.js Image-specific props that aren't valid on regular img elements
  const {
    placeholder,
    blurDataURL,
    priority,
    quality,
    sizes,
    fill,
    loading,
    unoptimized,
    ...imgProps
  } = props as any;

  // Detect and handle malformed URLs
  const isValidSrc = src &&
    typeof src === 'string' &&
    !src.includes('[object Object]') &&
    !src.endsWith('/undefined') &&
    !src.endsWith('/null') &&
    !src.includes('undefined') &&
    !src.includes('null');

  const finalSrc = isValidSrc ? src : fallbackImage;

  return (
    // biome-ignore lint/a11y/useAltText: alt is provided via props
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
});

ImageWithFallback.displayName = "ImageWithFallback";

export default ImageWithFallback;
