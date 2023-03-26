import { head } from "lodash";
import React, { useMemo } from "react";
import Model from "../model";
import AudioArtifact from "./audio";
import VideoArtifact from "./video";

export enum ArtifactType {
  Audio,
  Image,
  Model,
  PDF,
  Video,
  Javascript,
  HTML,
  MarkDown,
  Text,
  JSON,
}

type ArtifactProps = {
  outPoint: string;
  contentType?: string | undefined;
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
    } else if (contentType === "application/json") {
      artifactType = ArtifactType.JSON;
    } else if (contentType === "text/plain") {
      artifactType = ArtifactType.Text;
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
      className={`flex flex-col items-center justify-center min-h-48 min-w-48 bg-[#111] w-full h-full relative rounded cursor-pointer block transition mx-auto ${
        classNames?.wrapper ? classNames.wrapper : ""
      }`}
      target={to ? "_blank" : "_self"}
      href={
        to
          ? to
          : id !== undefined
          ? `/inscription/${id}`
          : `/tx/${head(outPoint.split("_"))}`
      }
    >
      {type === ArtifactType.Video ? (
        <VideoArtifact
          outPoint={outPoint}
          className={`h-full ${classNames?.media ? classNames.media : ""}`}
        />
      ) : type === ArtifactType.Audio ? (
        <AudioArtifact
          outPoint={outPoint}
          className={`p-1 absolute bottom-0 left-0 w-full ${
            classNames?.media ? classNames.media : ""
          }`}
        />
      ) : type === ArtifactType.JSON ? (
        <div
          className={`p-4 ${classNames?.wrapper || ""} ${
            classNames?.media || ""
          }`}
        >
          JSON Inscriptions not yet supported.
        </div>
      ) : type === ArtifactType.Text ? (
        <div
          className={`p-4 ${classNames?.wrapper || ""} ${
            classNames?.media || ""
          }`}
        >
          {/* {generatedImage} */}
          Text inscriptions not yet supported.
        </div>
      ) : type === ArtifactType.Model ? (
        <div
          className={`w-full h-full ${classNames?.wrapper || ""} ${
            classNames?.media || ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onAuxClick={(e) => {
            console.log("middle click");
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Model
            src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
          />
        </div>
      ) : type === ArtifactType.MarkDown ? (
        <div
          className={`${classNames?.wrapper || ""} ${classNames?.media || ""}`}
        >
          MarkDown Inscriptions not yet supported.
        </div>
      ) : type === ArtifactType.PDF ? (
        <div
          className={`${classNames?.wrapper || ""} ${classNames?.media || ""}`}
        >
          PDF Inscriptions not yet supported.
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-[#111] rounded">
          <img
            className={`h-auto rounded ${
              classNames?.media ? classNames.media : ""
            }`}
            src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
            id={`${outPoint}_image`}
          />
        </div>
      )}

      {/* TODO: Show indicator when more than one isncription */}
      {id !== undefined && (
        <div className="flex items-center justify-between w-full p-4 h-18">
          <div className={`rounded bg-[#222] p-2`}>Inscription #{id}</div>
          <div className={``}>&nbsp;</div>
          <div className={`rounded bg-[#222] p-2`}>{contentType}</div>
        </div>
      )}
    </a>
  );
};

export default Artifact;
