import { API_HOST } from "@/pages/_app";
import Router from "next/router";
import React, { useMemo } from "react";
import { LoaderIcon } from "react-hot-toast";
import styled from "styled-components";
import Model from "../model";
import AudioArtifact from "./audio";
import JsonArtifact from "./json";
import TextArtifact from "./text";
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
  outPoint?: string; // can be left out when previewing inscription not on chain yet
  contentType?: string;
  id?: number;
  classNames?: { wrapper?: string; media?: string };
  to?: string;
  src?: string;
};

const Artifact: React.FC<ArtifactProps> = ({
  outPoint,
  contentType,
  classNames,
  id,
  to,
  src = `${API_HOST}/api/files/inscriptions/${outPoint}`,
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

  const ArtifactContainer = styled.a`
    &:after {
      position: absolute;
      content: "";
      top: 5vw;
      left: 0;
      right: 0;
      z-index: -1;
      height: 100%;
      width: 100%;
      margin: 0 auto;
      transform: scale(0.75);
      -webkit-filter: blur(5vw);
      -moz-filter: blur(5vw);
      -ms-filter: blur(5vw);
      filter: blur(5vw);
      background: linear-gradient(270deg, #ffa60f85, #942fff66);
      background-size: 200% 200%;
      animation: animateGlow 10s ease infinite;
    }
  `;

  const content = useMemo(() => {
    return type === ArtifactType.Video ? (
      <VideoArtifact
        outPoint={outPoint}
        src={src}
        className={`${classNames?.media ? classNames.media : ""}`}
      />
    ) : type === ArtifactType.Audio ? (
      <>
        <AudioArtifact
          outPoint={outPoint}
          src={src}
          className={`p-1 absolute bottom-0 left-0 w-full ${
            classNames?.media ? classNames.media : ""
          }`}
        />
      </>
    ) : type === ArtifactType.HTML ? (
      <div className="w-full h-full">
        <iframe
          className="w-full h-full min-h-[60vh]"
          src={`${API_HOST}/api/files/inscriptions/${outPoint}`}
        />
      </div>
    ) : type === ArtifactType.JSON ? (
      <div
        className={`h-full p-4 ${classNames?.wrapper || ""} ${
          classNames?.media || ""
        }`}
      >
        <JsonArtifact outPoint={outPoint} />
      </div>
    ) : type === ArtifactType.Text ? (
      <div
        className={`h-full p-4 ${classNames?.wrapper || ""} ${
          classNames?.media || ""
        }`}
      >
        {/* {generatedImage} */}
        <TextArtifact outPoint={outPoint} />
      </div>
    ) : type === ArtifactType.Model ? (
      <div
        className={`w-full h-[50vh] ${classNames?.wrapper || ""} ${
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
        <Model src={src} />
      </div>
    ) : type === ArtifactType.MarkDown ? (
      <div
        className={`h-full p-4 ${classNames?.wrapper || ""} ${
          classNames?.media || ""
        }`}
      >
        MarkDown Inscriptions not yet supported.
      </div>
    ) : type === ArtifactType.PDF ? (
      <div
        className={`h-full p-4 ${classNames?.wrapper || ""} ${
          classNames?.media || ""
        }`}
      >
        PDF Inscriptions not yet supported.
      </div>
    ) : (
      <div className="flex items-center justify-center w-full h-full bg-[#111] rounded min-h-[300px]">
        <img
          className={`h-auto ${classNames?.media ? classNames.media : ""}`}
          src={src}
          id={`artifact_${new Date().getTime()}_image`}
        />
      </div>
    );
  }, [type, src, classNames, outPoint]);

  return (
    <ArtifactContainer
      key={outPoint}
      className={`flex flex-col pb-[65px] items-center justify-center min-h-[356px] min-w-[300px] bg-[#111] w-full h-full relative rounded ${
        to ? "cursor-pointer" : ""
      } block transition mx-auto ${
        classNames?.wrapper ? classNames.wrapper : ""
      }`}
      target={to ? "_self" : undefined}
      href={to}
      onClick={(e) => {
        if (!to) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      {(!src || type === undefined) && (
        <div className="w-full h-full flex items-center justify-center mx-auto text-center">
          <LoaderIcon className="mx-auto" />
        </div>
      )}
      {src && type !== undefined && content}

      {/* TODO: Show indicator when more than one isncription */}
      {id !== undefined && (
        <div className="absolute bottom-0 left-0 bg-black bg-opacity-75 flex items-center justify-between w-full p-2 h-[56px]">
          <div
            className={`rounded bg-[#222] p-2 text-[#aaa] cursor-pointer`}
            onClick={() => Router.push(`/inscription/${id}`)}
          >
            #{id}
          </div>
          <div className={`hidden md:block`}>&nbsp;</div>
          <div className={`rounded bg-[#222] p-2 text-[#aaa]`}>
            {contentType}
          </div>
        </div>
      )}
    </ArtifactContainer>
  );
};

export default Artifact;
