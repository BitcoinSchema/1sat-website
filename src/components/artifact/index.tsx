import { ORDFS, SIGMA } from "@/context/ordinals";
import { head } from "lodash";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { CheckmarkIcon, LoaderIcon } from "react-hot-toast";
import { IoMdPricetag } from "react-icons/io";
import { RiCloseLine } from "react-icons/ri";
import { toBitcoin } from "satoshi-bitcoin-ts";
import styled from "styled-components";
import tw from "twin.macro";
import BuyArtifactModal from "../modal/buyArtifact";
import Model from "../model";
import { FetchStatus } from "../pages";
import Tooltip from "../tooltip";
import AudioArtifact from "./audio";
import HTMLArtifact from "./html";
import JsonArtifact from "./json";
import MarkdownArtifact from "./markdown";
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
  OPNS,
  LRC20,
}

type ArtifactProps = {
  outPoint?: string; // can be left out when previewing inscription not on chain yet
  contentType?: string;
  protocol?: string;
  num?: number;
  height?: number;
  classNames?: { wrapper?: string; media?: string };
  to?: string;
  src?: string;
  onClick?: (outPoint: string) => void;
  txid?: string;
  price?: number;
  origin?: string;
  isListing?: boolean;
  clickToZoom?: boolean;
  sigma?: SIGMA[];
  showFooter?: boolean;
};

const Artifact: React.FC<ArtifactProps> = ({
  outPoint,
  origin,
  contentType,
  classNames,
  num,
  to,
  src = `${ORDFS}/${origin}`,
  onClick,
  txid,
  price,
  height,
  isListing,
  clickToZoom,
  sigma,
  showFooter = true,
  protocol,
}) => {
  const [imageLoadStatus, setImageLoadStatus] = useState<FetchStatus>(
    FetchStatus.Loading
  );
  const [showZoom, setShowZoom] = useState<boolean>(false);

  const [showBuy, setShowBuy] = useState<boolean>(false);
  const [hoverPrice, setHoverPrice] = useState<boolean>(false);

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
    } else if (t === "text/plain") {
      artifactType = ArtifactType.Text;
    } else if (t === "text/markdown") {
      artifactType = ArtifactType.MarkDown;
    } else if (t === "text/html") {
      artifactType = ArtifactType.HTML;
    } else if (t === "application/bsv-20") {
      artifactType = ArtifactType.BSV20;
    } else if (t === "application/lrc-20" || protocol === "lrc-20") {
      artifactType = ArtifactType.LRC20;
    } else if (t === "application/op-ns") {
      artifactType = ArtifactType.OPNS;
    } else if (t === "application/json") {
      artifactType = ArtifactType.JSON;
    } else if (t?.startsWith("image")) {
      artifactType = ArtifactType.Image;
    }
    return artifactType;
  }, [contentType, protocol]);

  // const isBsv20 = useMemo(() => {
  //   if (type === ArtifactType.BSV20) {
  //     return true;
  //   }
  //   if (height) {
  //     // console.log(
  //     //   { json },
  //     //   (json.height || 0) > 793000,
  //     //   head(json.file!.type.split(";"))
  //     // );

  //     if (type === ArtifactType.Text && (height || 0) < 793000) {
  //       try {
  //         JSON.parse(json);
  //         return true
  //       } catch (e) {
  //         console.log(e);
  //         return true
  //       }
  //     }
  //     return;
  //   } else {
  //     return false;
  //   }
  // }, [height, type]);

  const content = useMemo(() => {
    if (!src || type === undefined) {
      return (
        <ItemContainer className="bg-white min-h-[300px]">
          <LoaderIcon className="m-auto" />
        </ItemContainer>
      );
    }

    return type === ArtifactType.Video ? (
      <VideoArtifact
        origin={origin}
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
      origin && (
        <HTMLArtifact
          origin={origin}
          className={clickToZoom ? "cursor-pointer" : ""}
          onClick={
            clickToZoom
              ? () => (showZoom ? setShowZoom(false) : setShowZoom(true))
              : undefined
          }
        />
      )
    ) : type === ArtifactType.BSV20 ||
      type === ArtifactType.JSON ||
      type === ArtifactType.LRC20 ? (
      <div
        className={`h-full w-full p-4 ${classNames?.wrapper || ""} ${
          classNames?.media || ""
        }`}
      >
        <JsonArtifact origin={origin} type={type} />
      </div>
    ) : type === ArtifactType.Text || type === ArtifactType.OPNS ? (
      <div className={`w-full p-2 h-full`}>
        <TextArtifact origin={origin} className="w-full" />
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
        <MarkdownArtifact origin={origin} />
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
      <ItemContainer className={showZoom ? "h-auto" : `min-h-[300px]`}>
        {src !== "" && src != undefined && (
          <Image
            className={`${
              showZoom ? "h-auto w-auto max-h-screen" : ""
            } h-auto ${classNames?.media ? classNames.media : ""} ${
              clickToZoom
                ? !showZoom
                  ? "cursor-zoom-in"
                  : "cursor-zoom-out"
                : ""
            }`}
            // TODO: Use a opl account for this
            src={
              src.startsWith("data:")
                ? src
                : showZoom
                ? `https://res.cloudinary.com/tonicpow/image/fetch/f_auto/${src}`
                : `https://res.cloudinary.com/tonicpow/image/fetch/c_pad,g_center,h_300,w_300/f_auto/${src}`
            }
            id={`artifact_${new Date().getTime()}_image`}
            alt={`Inscription${num ? " #" + num : ""}`}
            // placeholder="blur"
            // blurDataURL={`data:image/svg+xml;base64,${toBase64(
            //   shimmer(700, 475)
            // )}`}
            width={300}
            height={300}
            onClick={
              clickToZoom
                ? () => (showZoom ? setShowZoom(false) : setShowZoom(true))
                : undefined
            }
          />
        )}
      </ItemContainer>
    );
  }, [showZoom, clickToZoom, src, type, origin, classNames, outPoint, num]);

  return (
    <React.Fragment>
      <ArtifactContainer
        key={outPoint}
        className={`flex flex-col pb-[65px] items-center justify-center min-h-[356px] min-w-[300px] bg-[#111] w-full h-full relative rounded ${
          to ? "cursor-pointer" : ""
        } block transition mx-auto ${
          classNames?.wrapper ? classNames.wrapper : ""
        }`}
        target={to ? "_self" : undefined}
        href={to}
        onClick={(e: any) => {
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
        {sigma && head(sigma)?.valid && (
          <div className="absolute top-0 left-0 ml-2 mt-2">
            <Tooltip message={`Signed by ${head(sigma)?.address}` || ""}>
              <CheckmarkIcon className="m-auto" />
            </Tooltip>
          </div>
        )}
        {isListing && (
          <div className="absolute top-0 right-0 mr-2 mt-2 pointer-events-none opacity-75">
            <IoMdPricetag className="m-auto w-6 h-6 text-blue-400" />
          </div>
        )}
        {/* TODO: Show indicator when more than one isncription */}
        {showFooter === true && num !== undefined && (
          <div className="text-xs absolute bottom-0 left-0 bg-black bg-opacity-75 flex items-center justify-between w-full p-2 h-[56px]">
            <div
              className={`rounded bg-[#222] p-2 text-[#aaa] ${
                onClick && outPoint ? "cursor-pointer" : ""
              }`}
              onClick={() => onClick && outPoint && onClick(outPoint)}
            >
              #{num}
            </div>
            <div className={`hidden md:block`}>&nbsp;</div>
            <div
              className={` ${
                price !== undefined &&
                type !== ArtifactType.BSV20 &&
                !(height && type === ArtifactType.Text && height >= 793000)
                  ? "cursor-pointer hover:bg-emerald-600 text-white"
                  : ""
              } select-none min-w-24 text-right rounded bg-[#222] p-2 text-[#aaa] transition`}
              onClick={(e) => {
                // clickToZoom && setShowZoom(true);
                if (
                  !(
                    price !== undefined &&
                    isListing &&
                    type !== ArtifactType.BSV20 &&
                    !(height && type === ArtifactType.Text && height >= 793000)
                  )
                ) {
                  return;
                }
                e.stopPropagation();
                setShowBuy(true);
              }}
              // onMouseEnter={() => {
              //   setHoverPrice(true);
              // }}
              // onMouseLeave={() => {
              //   setHoverPrice(false);
              // }}
            >
              {price !== undefined ? `${toBitcoin(price)} BSV` : contentType}
            </div>
          </div>
        )}
      </ArtifactContainer>
      {showZoom && (
        <div
          className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 overflow-hidden"
          onClick={() => setShowZoom(false)}
        >
          <div className="cursor-pointer absolute top-0 right-0 mr-4 mt-4 text-4xl z-20 p-2">
            <RiCloseLine />
          </div>
          {content}
        </div>
      )}
      {outPoint && showBuy && price !== undefined && (
        <BuyArtifactModal
          outPoint={outPoint}
          onClose={() => setShowBuy(false)}
          price={price}
          content={content}
        />
      )}
    </React.Fragment>
  );
};

export default Artifact;

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
flex items-center justify-center w-full h-full rounded
`;
