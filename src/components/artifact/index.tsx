import { API_HOST } from "@/context/ordinals";
import { head } from "lodash";
import Image from "next/image";
import Router from "next/router";
import React, { useMemo, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import { toBitcoin } from "satoshi-bitcoin-ts";
import styled from "styled-components";
import tw from "twin.macro";
import Model from "../model";
import { FetchStatus } from "../pages";
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
  BSV20,
}

type ArtifactProps = {
  outPoint?: string; // can be left out when previewing inscription not on chain yet
  contentType?: string;
  id?: number;
  classNames?: { wrapper?: string; media?: string };
  to?: string;
  src?: string;
  onClick?: (outPoint: string) => void;
  txid?: string;
  price?: number;
};

const Artifact: React.FC<ArtifactProps> = ({
  outPoint,
  contentType,
  classNames,
  id,
  to,
  src = `${API_HOST}/api/files/inscriptions/${outPoint}`,
  onClick,
  txid,
  price,
}) => {
  const [imageLoadStatus, setImageLoadStatus] = useState<FetchStatus>(
    FetchStatus.Loading
  );

  const type = useMemo(() => {
    let artifactType = undefined;
    const t = head(contentType?.toLowerCase().split(";"));
    if (contentType?.startsWith("audio")) {
      artifactType = ArtifactType.Audio;
    } else if (t?.startsWith("video")) {
      artifactType = ArtifactType.Video;
    } else if (t?.startsWith("model")) {
      artifactType = ArtifactType.Model;
    } else if (t === "application/pdf") {
      artifactType = ArtifactType.Model;
    } else if (t === "application/javascript") {
      artifactType = ArtifactType.Javascript;
    } else if (t === "application/json") {
      artifactType = ArtifactType.JSON;
    } else if (t === "text/plain") {
      artifactType = ArtifactType.Text;
    } else if (t === "text/markdown") {
      artifactType = ArtifactType.MarkDown;
    } else if (t === "text/html") {
      artifactType = ArtifactType.HTML;
    } else if (t === "application/bsv-20") {
      artifactType = ArtifactType.BSV20;
    } else if (t?.startsWith("image")) {
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

  const ItemContainer = tw.div`
  flex items-center justify-center w-full h-full rounded min-h-[300px]
  `;

  const content = useMemo(() => {
    if (!src || type === undefined) {
      return (
        <ItemContainer className="bg-white">
          <LoaderIcon className="m-auto" />
        </ItemContainer>
      );
    }

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
          sandbox=" "
        />
      </div>
    ) : type === ArtifactType.BSV20 || type === ArtifactType.JSON ? (
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
      <ItemContainer>
        {src !== "" && src != undefined && (
          <Image
            className={`h-auto ${classNames?.media ? classNames.media : ""}`}
            // TODO: Use a opl account for this
            src={`https://res.cloudinary.com/jamifybitcoin/image/fetch/c_fill,g_center,h_300,w_300/f_auto/${src}`}
            id={`artifact_${new Date().getTime()}_image`}
            alt={`Inscription${id ? " #" + id : ""}`}
            // placeholder="blur"
            // blurDataURL={`data:image/svg+xml;base64,${toBase64(
            //   shimmer(700, 475)
            // )}`}
            width={300}
            height={300}
          />
        )}
      </ItemContainer>
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
          if (txid && onClick) {
            onClick(txid);
          }
        }
      }}
    >
      {content}

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
            {price ? `${toBitcoin(price)} BSV` : contentType}
          </div>
        </div>
      )}
    </ArtifactContainer>
  );
};

export default Artifact;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;
