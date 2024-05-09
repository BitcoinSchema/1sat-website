import fallbackImage from "@/assets/images/oneSatLogoDark.svg";
import Image, { ImageProps } from "next/image";

interface Props extends ImageProps {
  alt: string;
  src: string;
  fallback?: string;
  className?: string;
}

const ImageWithFallback = ({
  fallback = fallbackImage,
  alt,
  src,
  ...props
}: Props) => {
  return (
    <Image
      style={{ background: "black" }}
      alt={alt}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        target.src = fallback; // Switch to fallback image
        target.classList.add("opacity-5");
      }}
      // onError={(e) => (e ? setError(e) : null)}
      src={src}
      {...props}
      className={`pointer-events-none ${props.className || ""}`}
    />
  );
};

export default ImageWithFallback;
