"use client"

import fallbackImage from "@/assets/images/oneSatLogoDark.svg";
import Image, { type ImageProps } from "next/image";

interface Props extends Partial<ImageProps> {
  alt: string;
  src?: string | undefined;
  fallback?: string;
  className?: string;
}

const ImageWithFallback = ({
  fallback = fallbackImage,
  alt,
  src = fallbackImage,
  ...props
}: Props) => {
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    // biome-ignore lint/a11y/useAltText: <explanation>
    // @next/next/no-img-element: <explanation>
    <img
      style={{ background: "black" }}
      alt={alt}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        target.src = fallback; // Switch to fallback image
        target.classList.add("opacity-5");
      }}
      // onError={(e) => (e ? setError(e) : null)}
      src={src.endsWith("/undefined") || src.endsWith("/null") ? fallbackImage : src}
      {...imgProps}
      className={`pointer-events-none ${imgProps.className || ""}`}
    />
  );
};

export default ImageWithFallback;
