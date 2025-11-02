"use client";

import { FetchStatus, ORDFS } from "@/constants";
import type { OrdUtxo, SIGMA } from "@/types/ordinals";
import { getArtifactType } from "@/utils/artifact";
import { toBase64 } from "@/utils/string";
import { head } from "lodash";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { type SyntheticEvent, useMemo, useState } from "react";
import { CheckmarkIcon, LoaderIcon } from "react-hot-toast";
import { FaQuestion } from "react-icons/fa6";
import { IoMdPricetag } from "react-icons/io";
import { RiCloseLine } from "react-icons/ri";
import { toBitcoin } from "satoshi-token";
import ImageWithFallback from "../ImageWithFallback";
import BuyArtifactModal from "../modal/buyArtifact";
import Tooltip from "../tooltip";
import AudioArtifact from "./audio";
import HTMLArtifact from "./html";
import JsonArtifact from "./json";
import MarkdownArtifact from "./markdown";
import SVGArtifact from "./svg";
import TextArtifact from "./text";
import VideoArtifact from "./video";

const Model = dynamic(() => import("../model"), {
  ssr: false,
});

export enum ArtifactType {
  All = "All",
  Image = "Image",
  Model = "Model",
  PDF = "PDF",
  Video = "Video",
  Javascript = "Javascript",
  HTML = "HTML",
  MarkDown = "MarkDown",
  Text = "Text",
  JSON = "JSON",
  BSV20 = "BSV20",
  OPNS = "OPNS",
  Unknown = "Unknown",
  LRC20 = "LRC20",
  Audio = "Audio",
  Audio2 = "AppleAudio",
  SVG = "SVG",
}

// maps ArtifactType to a typical content type string
export const artifactTypeMap = new Map<ArtifactType, string>([
  [ArtifactType.Audio, "audio/"],
  [ArtifactType.Audio2, "application/vnd.apple.mpegurl"],
  [ArtifactType.Image, "image/"],
  [ArtifactType.Model, "model/"],
  [ArtifactType.PDF, "application/pdf"],
  [ArtifactType.Video, "video/"],
  [ArtifactType.Javascript, "application/javascript"],
  [ArtifactType.HTML, "text/html"],
  [ArtifactType.MarkDown, "text/markdown"],
  [ArtifactType.Text, "text/plain"],
  [ArtifactType.JSON, "application/json"],
  [ArtifactType.BSV20, "application/bsv-20"],
  [ArtifactType.OPNS, "application/op-ns"],
  [ArtifactType.LRC20, "application/lrc-20"],
]);

type ArtifactProps = {
  artifact: Partial<OrdUtxo>;
  classNames?: { wrapper?: string; media?: string; footer?: string };
  to?: string;
  src?: string;
  onClick?: (outPoint: string) => void;
  clickToZoom?: boolean;
  sigma?: SIGMA[];
  showFooter?: boolean;
  size?: number;
  priority?: boolean;
  glow?: boolean;
  sizes: string;
  latest?: boolean;
  showListingTag?: boolean;
};

const Artifact: React.FC<ArtifactProps> = ({
  artifact,
  classNames,
  to,
  src: inputSrc,
  onClick,
  clickToZoom,
  sigma,
  showFooter = true,
  size,
  priority,
  glow,
  sizes,
  latest = false,
  showListingTag = true,
}) => {
  const router = useRouter();
  const [imageLoadStatus, setImageLoadStatus] = useState<FetchStatus>(
    FetchStatus.Loading,
  );
  const [showZoom, setShowZoom] = useState<boolean>(false);

  const [showBuy, setShowBuy] = useState<boolean>(false);
  const [hoverPrice, setHoverPrice] = useState<boolean>(false);

  const contentType = useMemo(
    () =>
      latest
        ? artifact?.data?.insc?.file.type
        : artifact?.origin?.data?.insc?.file.type || "image/png",
    [artifact, latest],
  );
  const outPoint = useMemo(
    () => (latest ? artifact?.outpoint : artifact?.origin?.outpoint),
    [artifact, latest],
  );
  const height = useMemo(() => artifact?.height, [artifact]);
  const num = useMemo(
    () =>
      `${latest
        ? `${artifact?.height}:${artifact?.idx}:${artifact?.vout}`
        : artifact?.origin?.inum || artifact?.origin?.num || ""
      }`,
    [artifact, latest],
  );
  const txid = useMemo(
    () => (latest ? artifact?.txid : artifact?.origin?.outpoint?.split("_")[0]),
    [artifact, latest],
  );
  const isListing = useMemo(() => !!artifact?.data?.list, [artifact]);
  const price = useMemo(() => artifact?.data?.list?.price, [artifact]);
  const origin = useMemo(() => artifact?.origin?.outpoint, [artifact]);
  const src = useMemo(
    () => (inputSrc ? inputSrc : `${ORDFS}/${artifact?.origin?.outpoint}`),
    [artifact, inputSrc],
  );

  const type = useMemo(() => {
    return getArtifactType(artifact as OrdUtxo, latest);
  }, [artifact, latest]);

  // useEffect(() => {
  //   console.log({ type, src });
  // }, [type, src]);
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
        <div
          className={`${ItemContainerStyle} bg-white`}
          style={{ minHeight: size }}
        >
          <LoaderIcon className="m-auto" />
        </div>
      );
    }

    return type === ArtifactType.Video ? (
      <VideoArtifact
        origin={origin}
        src={src}
        className={`${classNames?.media ? classNames.media : ""}`}
      />
    ) : type === ArtifactType.Audio || type === ArtifactType.Audio2 ? (
      <>
        <AudioArtifact
          outPoint={outPoint || origin}
          src={src}
          className={`p-1 absolute bottom-0 left-0 w-full ${classNames?.media ? classNames.media : ""
            }`}
        />
      </>
    ) : type === ArtifactType.SVG ? (
      origin && (
        <SVGArtifact
          origin={origin}
          size={size}
          className={`${clickToZoom ? "cursor-pointer" : ""} h-full w-full`}
          onClick={
            clickToZoom
              ? () => (showZoom ? setShowZoom(false) : setShowZoom(true))
              : undefined
          }
        // onLoad={(e) => {
        // 	// e.target is the iframe
        // }}
        />
      )
    ) : type === ArtifactType.HTML ? (
      origin && (
        <HTMLArtifact
          mini={(size || 300) < 300}
          origin={origin}
          className={{
            wrapper: `${clickToZoom ? "cursor-pointer" : ""} w-full`,
            iframe: "",
          }}
          size={size}
          onClick={
            clickToZoom
              ? () => (showZoom ? setShowZoom(false) : setShowZoom(true))
              : undefined
          }
          onLoad={(e: SyntheticEvent<HTMLIFrameElement | HTMLImageElement>) => {
            /**
             * If the artifact is an image, set the correct aspect ratio
             */
            if (e.currentTarget instanceof HTMLImageElement) {
              const link = e.currentTarget.closest("a");

              if (!link) {
                return;
              }

              const height = e.currentTarget.naturalHeight;
              const width = e.currentTarget.naturalWidth;
              const aspectRatio = `${width} / ${height}`;

              link.style.aspectRatio = aspectRatio;
            }
          }}
        />
      )
    ) : type === ArtifactType.BSV20 ||
      type === ArtifactType.JSON ||
      type === ArtifactType.LRC20 ? (
      <div
        className={`h-full w-full p-4 ${classNames?.wrapper || ""} ${classNames?.media || ""
          }`}
      >
        <JsonArtifact
          artifact={artifact}
          origin={origin}
          type={type}
          mini={(size || 300) < 300}
        />
      </div>
    ) : type === ArtifactType.Text ||
      type === ArtifactType.OPNS ||
      type === ArtifactType.Javascript ? (
      <div
        className={`w-full flex items-center justify-center p-2 ${classNames?.wrapper ? classNames.wrapper : ""
          } ${classNames?.media ? classNames.media : ""}`}
      >
        <TextArtifact
          origin={origin}
          className="w-full"
          mini={(size || 300) < 300}
        />
      </div>
    ) : type === ArtifactType.Model ? (
      <>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div
          className={`w-full ${classNames?.wrapper || ""} ${classNames?.media || ""
            }`}
          onClick={(e) => {
            if (showFooter) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onAuxClick={(e) => {
            console.log("middle click");
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Model src={src} size={size} />
        </div>
      </>
    ) : type === ArtifactType.MarkDown ? (
      <div
        className={`h-full p-4 ${classNames?.wrapper || ""} ${classNames?.media || ""
          }`}
      >
        <MarkdownArtifact origin={origin} />
      </div>
    ) : type === ArtifactType.PDF ? (
      <div
        className={`h-full p-4 ${classNames?.wrapper || ""} ${classNames?.media || ""
          }`}
      >
        PDF Inscriptions not yet supported.
      </div>
    ) : type === ArtifactType.Unknown ? (
      <div>
        <FaQuestion className="w-24 text-slate-800" />
      </div>
    ) : (
      <div
        className={`relative ${ItemContainerStyle} ${showZoom ? "h-auto" : "h-full"
          }`}
      >
        {src !== "" && src !== undefined && (
          <ImageWithFallback
            width={size || 0}
            height={size || 0}
            priority={priority || false}
            className={`${showZoom ? "h-auto w-auto max-h-screen" : ""
              } h-auto ${classNames?.media ? classNames.media : ""} ${clickToZoom
                ? !showZoom
                  ? "cursor-zoom-in"
                  : "cursor-zoom-out"
                : ""
              }`}
            // TODO: Use a opl account for this
            src={
              src.startsWith("data:") || src.startsWith("blob:")
                ? src
                : showZoom
                  ? `https://res.cloudinary.com/tonicpow/image/fetch/f_auto/${src}`
                  : `https://res.cloudinary.com/tonicpow/image/fetch/c_pad,b_rgb:111111,g_center,h_${size || 300
                  },w_${size || 300}/f_auto/${src}`
            }
            id={`artifact_${outPoint || origin}_image`}
            alt={`Inscription${num !== "" ? ` #${num}` : ""}`}
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(
              shimmer(700, 475),
            )}`}
            sizes={sizes}
            onClick={
              clickToZoom
                ? () => (showZoom ? setShowZoom(false) : setShowZoom(true))
                : undefined
            }
          />
        )}
      </div>
    );
  }, [
    src,
    type,
    origin,
    classNames,
    outPoint,
    size,
    clickToZoom,
    artifact,
    showZoom,
    priority,
    num,
    sizes,
    showFooter,
  ]);

  return (
    <React.Fragment>
      <Link
        key={outPoint || origin}
        className={`${showFooter
            ? `${type !== ArtifactType.HTML ? "pb-[65px]" : ""} ${classNames?.footer ? classNames.footer : ""
            }`
            : ""
          } ${glow ? "glow" : ""
          } flex flex-col items-center justify-center bg-[#111] w-full h-full relative rounded ${to ? "cursor-pointer" : "cursor-default"
          } block transition mx-auto ${classNames?.wrapper ? classNames.wrapper : ""
          }`}
        target={to ? "_self" : undefined}
        href={to || "#"}
        draggable={false}
        onClick={(e) => {
          if (!to && !clickToZoom) {
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
        {isListing && (size || 300) >= 300 && showListingTag && (
          <div className="absolute top-0 right-0 mr-2 mt-2 pointer-events-none opacity-75">
            <IoMdPricetag className="m-auto w-6 h-6 text-blue-400" />
          </div>
        )}
        {/* TODO: Show indicator when more than one isncription */}
        {showFooter === true && num !== undefined && (
          <div className="text-xs absolute bottom-0 left-0 bg-black bg-opacity-75 flex items-center justify-between w-full p-2 h-[56px]">
            <button
              type="button"
              className={`rounded bg-[#222] p-2 text-[#aaa] ${onClick && (outPoint || origin) ? "cursor-pointer" : ""
                }`}
              onClick={() => {
                if (onClick && outPoint) {
                  onClick(outPoint);
                  return;
                }
                if (onClick && origin) {
                  onClick(origin);
                }
              }}
            >
              #{num}
            </button>
            <div className={"hidden md:block"}>&nbsp;</div>
            <button
              type="button"
              className={` ${price !== undefined &&
                  // type !== ArtifactType.BSV20 &&
                  !(height && type === ArtifactType.Text && height >= 793000)
                  ? "cursor-pointer hover:bg-emerald-600 text-white"
                  : ""
                } select-none text-right rounded bg-[#222] p-2 text-[#aaa] transition`}
              onClick={(e) => {
                // clickToZoom && setShowZoom(true);
                if (
                  !(
                    price !== undefined &&
                    isListing &&
                    // type !== ArtifactType.BSV20 &&
                    !(height && type === ArtifactType.Text && height >= 793000)
                  )
                ) {
                  return;
                }
                e.stopPropagation();
                if (artifact.origin?.data?.bsv20) {
                  router.push(
                    artifact.origin?.data?.bsv20?.id
                      ? `/market/bsv21/${artifact.origin?.data?.bsv20?.id}`
                      : `/market/bsv20/${artifact.origin?.data?.bsv20?.tick}`,
                  );
                  return;
                }
                setShowBuy(true);
              }}
            // onMouseEnter={() => {
            //   setHoverPrice(true);
            // }}
            // onMouseLeave={() => {
            //   setHoverPrice(false);
            // }}
            >
              {price !== undefined
                ? price > 1000
                  ? `Buy - ${toBitcoin(price)} BSV`
                  : `Buy - ${price} sat`
                : contentType}
            </button>
          </div>
        )}
      </Link>
      {showZoom && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
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
          listing={artifact as OrdUtxo}
          onClose={() => setShowBuy(false)}
          price={BigInt(Math.ceil(price))}
          content={content}
          showLicense={true}
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

const ItemContainerStyle =
  "flex items-center justify-center w-full h-full rounded";
