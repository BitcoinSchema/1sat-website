import fallbackImage from "@/assets/images/oneSatLogoDark.svg";
import Image, { ImageProps } from "next/image";
import { SyntheticEvent, useEffect, useState } from "react";

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
  const [error, setError] = useState<SyntheticEvent<HTMLImageElement, Event>>();

  useEffect(() => {
    setError(undefined);
  }, []);

  return (
    <div className={`${error ? 'opacity-5' : ''} pointer-events-none ${props.className || ""}`}>
      <Image
        alt={alt}
        onError={(e) => (e ? setError(e) : null)}
        src={error ? fallbackImage : src}
        {...props}
      />
    </div>
  );
};

export default ImageWithFallback;
