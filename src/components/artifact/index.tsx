import { head } from "lodash";
import React, { useMemo } from "react";

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
  className?: string;
};

const Artifact: React.FC<ArtifactProps> = ({
  outPoint,
  contentType,
  className,
}) => {
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

  return (
    <a
      key={outPoint}
      className={`cursor-pointer block transition ${
        className ? className : ""
      }`}
      href={`/tx/${head(outPoint.split("_"))}`}
    >
      {type === ArtifactType.Video ? (
        <video
          className="transition"
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
        <audio
          className=""
          src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
          id={`${outPoint}_audio`}
          onLoad={() => {
            // TODO: FadeIn not working yet
            const el = document.getElementById(`${outPoint}_audio`);
            if (el) {
              el.classList.remove("opacity-0");
              el.classList.add("opacity-100");
            }
          }}
        />
      ) : (
        <img
          className="w-full rounded opacity-0"
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
    </a>
  );
};

export default Artifact;
