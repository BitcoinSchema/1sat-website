import { ORDFS } from "@/constants";
import ImageWithFallback from "@/components/ImageWithFallback";
import { encode } from "blurhash";
import { toSvg } from "jdenticon";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Blurhash } from "react-blurhash";

type AudioArtifactProps = {
  outPoint?: string;
  src?: string;
  className?: string;
};

const AudioArtifact: React.FC<AudioArtifactProps> = ({
  outPoint,
  src,
  className,
}) => {
  const [componentX, setComponentX] = useState(4);
  const [componentY, setComponentY] = useState(4);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const [data, setData] = useState<
    { file: File; imageUrl: string; imageData: ImageData } | undefined
  >();

  const flavor = useMemo(
    () => `${outPoint}${position}`,
    [outPoint, position]
  );

  const generatedImage = useMemo(() => {
    // (new XMLSerializer).serializeToString(svg)
    if (flavor) {
      const svgStr = toSvg(flavor, 300);
      const svg = new Blob([svgStr], { type: "image/svg+xml" });
      const imageUrl = URL.createObjectURL(svg);
      if (!File) {
        return;
      }
      const file = new File([svg], "name");

      const el = <ImageWithFallback alt="" src={imageUrl} />;
      if (typeof window === "undefined") {
        return el;
      }
      const el2 = document.createElement("img");
      el2.src = imageUrl;
      el2.onload = () => {
        const imageData = getImageData(el2, 4, 4);
        if (imageData) {
          setData({ file, imageUrl, imageData });
        }
      };

      return el;
    }
  }, [setData, flavor]);

  const bh = useMemo(() => {
    return data
      ? encode(
        data.imageData.data,
        data.imageData.width,
        data.imageData.height,
        componentX,
        componentY
      )
      : undefined;
  }, [data, componentX, componentY]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (data && outPoint && generatedImage) {
        console.log("This will be called every 2 seconds");
        const ael = document.getElementById(
          `${outPoint}_audio`
        ) as HTMLAudioElement;
        if (!ael?.paused && ael?.currentTime && ael?.duration) {
          console.log("playing", ael.currentTime);
          setPosition(ael.currentTime);
          setDuration(ael.duration);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [data, generatedImage, outPoint]);

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center">
      {bh && (
        <Blurhash
          hash={bh}
          width={"100%"}
          height={"100%"}
          resolutionX={128}
          resolutionY={128}
          punch={1}
          className="w-full h-full min-w-[300px] min-h-[300px] rounded opacity-50 transition"
        />
      )}
      {!bh && generatedImage}
      {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
      <audio
        className={`w-full transition ${className ? className : ""}`}
        src={src ? src : `${ORDFS}/${outPoint}`}
        id={`${src ? src : outPoint}_audio`}
        onPlaying={(e) => {
          console.log("playing", e);
        }}
        onPause={(e) => {
          console.log("paused", e);
        }}
        controls
      />
    </div>
  );
};

export default AudioArtifact;

const getImageData = (
  image: HTMLImageElement,
  resolutionX: number,
  resolutionY: number
) => {
  const canvas = document.createElement("canvas");
  canvas.width = resolutionX;
  canvas.height = resolutionY;
  const context = canvas.getContext("2d");
  context?.drawImage(image, 0, 0, resolutionX, resolutionY);
  return context?.getImageData(0, 0, resolutionX, resolutionY);
};
