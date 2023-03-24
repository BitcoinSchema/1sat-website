import { encode } from "blurhash";
import { toSvg } from "jdenticon";
import { head } from "lodash";
import React, { useMemo, useState } from "react";
import { Blurhash } from "react-blurhash";

export enum ArtifactType {
  Audio,
  Image,
  Model,
  PDF,
  Video,
  Javascript,
  HTML,
  MarkDown,
}

type ArtifactProps = {
  outPoint: string;
  contentType: string | undefined;
  id?: number;
  classNames?: { wrapper?: string; media?: string };
  to?: string | undefined;
};

const Artifact: React.FC<ArtifactProps> = ({
  outPoint,
  contentType,
  classNames,
  id,
  to,
}) => {
  const [componentX, setComponentX] = useState(4);
  const [componentY, setComponentY] = useState(4);

  const [data, setData] = useState<
    { file: File; imageUrl: string; imageData: ImageData } | undefined
  >();

  const type = useMemo(() => {
    let artifactType = undefined;
    if (contentType?.startsWith("audio")) {
      artifactType = ArtifactType.Audio;
    } else if (contentType?.startsWith("video")) {
      artifactType = ArtifactType.Video;
    } else if (contentType?.startsWith("model")) {
      artifactType = ArtifactType.Model;
    } else if (contentType === "application/pdf") {
      artifactType = ArtifactType.Model;
    } else if (contentType === "application/javascript") {
      artifactType = ArtifactType.Javascript;
    } else if (contentType === "text/markdown") {
      artifactType = ArtifactType.MarkDown;
    } else if (contentType === "text/html") {
      artifactType = ArtifactType.HTML;
    } else if (contentType?.startsWith("image")) {
      artifactType = ArtifactType.Image;
    }
    return artifactType;
  }, [contentType]);

  const generatedImage = useMemo(() => {
    // (new XMLSerializer).serializeToString(svg)
    if (outPoint) {
      const svgStr = toSvg(outPoint, 300);
      const svg = new Blob([svgStr], { type: "image/svg+xml" });
      const imageUrl = URL.createObjectURL(svg);
      var file = new File([svg], "name");

      const el = <img src={imageUrl} />;
      let el2 = document.createElement("img");
      el2.src = imageUrl;
      el2.onload = () => {
        const imageData = getImageData(el2, 4, 4);
        if (imageData) {
          setData({ file, imageUrl, imageData });
        }
      };

      return el;
    }
  }, [setData, outPoint]);

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

  return (
    <a
      key={outPoint}
      className={`w-full relative flex items-start rounded cursor-pointer block transition ${
        classNames?.wrapper ? classNames.wrapper : ""
      }`}
      target={to ? "_blank" : "_self"}
      href={to || `/tx/${head(outPoint.split("_"))}`}
    >
      {type === ArtifactType.Video ? (
        <video
          className={`transition  ${classNames?.media ? classNames.media : ""}`}
          src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
          controls={true}
          id={`${outPoint}_video`}
          onLoad={() => {
            const el = document.getElementById(`${outPoint}_video`);
            if (el) {
              el.classList.remove("opacity-0");
              el.classList.add("opacity-100");
            }
          }}
        />
      ) : type === ArtifactType.Audio ? (
        <div className="relative h-full w-full">
          {bh && (
            <Blurhash
              hash={bh}
              width={400}
              height={400}
              resolutionX={32}
              resolutionY={32}
              punch={1}
              className="rounded"
            />
          )}
          {!bh && generatedImage}
          {/* && (
            <img
              src={generatedImage}
              width={300}
              height={300}
              onLoad={(e) => {
                var svg = new Blob([generatedImage], { type: "image/svg+xml" });
                var file = new File([svg], "name");
                var DOMURL =
                  window?.URL || window?.webkitURL || (window as any);

                const imageUrl = DOMURL.createObjectURL(file);

                console.log({ imageUrl, target: e.currentTarget });
                const imageData = getImageData(e.currentTarget, 300, 300);
                console.log("setting data", imageData);
                if (file && imageUrl && imageData) {
                  console.log("setting data", imageData);
                  setData({ file, imageUrl, imageData });
                }
              }}
            />
          )} */}
          <audio
            className={`p-1 absolute bottom-0 left-0 w-full ${
              classNames?.media ? classNames.media : ""
            }`}
            src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
            id={`${outPoint}_audio`}
            controls
            onLoad={() => {
              // TODO: FadeIn not working yet
              const el = document.getElementById(`${outPoint}_audio`);
              if (el) {
                // el.classList.remove("opacity-0");
                // el.classList.add("opacity-100");
              }
            }}
          />
        </div>
      ) : (
        <img
          className={`w-full rounded opacity-0  ${
            classNames?.media ? classNames.media : ""
          }`}
          src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
          id={`${outPoint}_image`}
          onLoad={(e) => {
            const el = document.getElementById(`${outPoint}_image`);
            if (el) {
              el.classList.remove("opacity-0");
              el.classList.add("opacity-100");
            }
          }}
        />
      )}

      {/* TODO: Show indicator when more than one isncription */}
      {id && (
        <div
          className={`absolute ${
            type === ArtifactType.Video ? "bottom-0 mb-2" : "top-0 mt-2"
          } right-0  mr-2 rounded bg-[#222] p-2`}
        >
          Inscription #{id}
          <br />
          Type {contentType}
        </div>
      )}
    </a>
  );
};

export default Artifact;

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
