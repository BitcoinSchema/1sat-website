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
  id?: number;
  className?: string;
  to?: string | undefined;
};

const Artifact: React.FC<ArtifactProps> = ({
  outPoint,
  contentType,
  className,
  id,
  to,
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
      className={`min-h-24 min-w-24 relative cursor-pointer block transition ${
        className ? className : ""
      }`}
      target={to ? "_blank" : "_self"}
      href={to || `/tx/${head(outPoint.split("_"))}`}
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

      {/* TODO: Show indicator when more than one isncription */}
      {id && (
        <div className="absolute bottom-0 right-0 mb-2 mr-2 rounded bg-[#222] p-2">
          Inscription #{id}
          <br />
          Type {contentType}
        </div>
      )}
    </a>
  );
};

export default Artifact;
