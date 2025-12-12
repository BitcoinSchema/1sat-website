"use client";

import { FileQuestion, Loader2, X } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { toBitcoin } from "satoshi-token";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/use-sound";
import { ORDFS } from "@/lib/constants";
import { getImageUrl, getPaddedImageUrl } from "@/lib/image-utils";
import type { OrdUtxo } from "@/lib/types/ordinals";
import { ArtifactType, getArtifactType } from "@/lib/util/artifact";
import ImageWithFallback from "../image-with-fallback";
import AudioArtifact from "./audio";
import HTMLArtifact from "./html";
import JsonArtifact from "./json";
import TextArtifact from "./text";
import VideoArtifact from "./video";

type ArtifactProps = {
	artifact: Partial<OrdUtxo>;
	classNames?: { wrapper?: string; media?: string; footer?: string };
	to?: string;
	src?: string;
	onClick?: (outPoint: string) => void;
	clickToZoom?: boolean;
	showFooter?: boolean;
	size?: number;
	priority?: boolean;
	glow?: boolean;
	sizes?: string;
	latest?: boolean;
	showListingTag?: boolean;
	thumbnail?: boolean;
	disableLink?: boolean;
};

const Artifact: React.FC<ArtifactProps> = ({
	artifact,
	classNames,
	to,
	src: inputSrc,
	onClick,
	clickToZoom,
	showFooter = true,
	size,
	priority,
	glow,
	sizes = "100vw",
	latest = false,
	showListingTag = true,
	thumbnail = false,
	disableLink = false,
}) => {
	const { play } = useSound();
	const [showZoom, setShowZoom] = useState<boolean>(false);
	// Placeholder for buying logic if needed later
	// const [showBuy, setShowBuy] = useState<boolean>(false);

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
	const num = useMemo(
		() =>
			`${
				latest
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
	const src = useMemo(() => {
		if (inputSrc) return inputSrc;
		const outpoint = artifact?.origin?.outpoint;
		// Ensure outpoint is a valid string before using in URL
		if (!outpoint || typeof outpoint !== "string") return "";
		return `${ORDFS}/${outpoint}`;
	}, [artifact, inputSrc]);

	const type = useMemo(() => {
		return getArtifactType(artifact as OrdUtxo, latest);
	}, [artifact, latest]);

	const content = useMemo(() => {
		if (!src || type === undefined) {
			return (
				<div
					className={`flex items-center justify-center w-full h-full rounded bg-white`}
					style={{ minHeight: size }}
				>
					<Loader2 className="m-auto animate-spin" />
				</div>
			);
		}

		return type === ArtifactType.Video ? (
			<VideoArtifact
				origin={origin}
				src={src}
				className={`${classNames?.media ? classNames.media : ""}`}
				thumbnail={thumbnail}
			/>
		) : type === ArtifactType.Audio || type === ArtifactType.Audio2 ? (
			<AudioArtifact
				outPoint={outPoint || origin}
				src={src}
				className={`p-1 absolute bottom-0 left-0 w-full ${
					classNames?.media ? classNames.media : ""
				}`}
			/>
		) : type === ArtifactType.HTML ? (
			origin && (
				<HTMLArtifact
					mini={(size || 300) < 300}
					origin={origin}
					className={{
						wrapper: `${clickToZoom ? "cursor-pointer" : ""} w-full h-full`,
						iframe: "",
					}}
					size={size}
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
				<JsonArtifact
					artifact={artifact as OrdUtxo}
					origin={origin}
					type={type}
					mini={(size || 300) < 300}
				/>
			</div>
		) : type === ArtifactType.Text ||
			type === ArtifactType.OPNS ||
			type === ArtifactType.Javascript ? (
			<div
				className={`w-full flex items-center justify-center p-2 ${
					classNames?.wrapper ? classNames.wrapper : ""
				} ${classNames?.media ? classNames.media : ""}`}
			>
				<TextArtifact
					origin={origin}
					className="w-full"
					mini={(size || 300) < 300}
				/>
			</div>
		) : type === ArtifactType.Model ? (
			<div className="w-full h-full flex items-center justify-center bg-muted">
				<p className="text-xs text-muted-foreground">Model not supported yet</p>
			</div>
		) : type === ArtifactType.PDF ? (
			<div
				className={`h-full p-4 ${classNames?.wrapper || ""} ${
					classNames?.media || ""
				}`}
			>
				PDF Inscriptions not yet supported.
			</div>
		) : type === ArtifactType.Unknown ? (
			<div>
				<FileQuestion className="w-24 text-slate-800" />
			</div>
		) : (
			<div
				className={`relative flex items-center justify-center w-full h-full rounded ${
					showZoom ? "h-auto" : "h-full"
				}`}
			>
				{src !== "" && src !== undefined && (
					<ImageWithFallback
						width={size || 0}
						height={size || 0}
						priority={priority || false}
						className={`${
							showZoom ? "h-auto w-auto max-h-screen" : ""
						} h-auto ${classNames?.media ? classNames.media : ""} ${
							clickToZoom
								? !showZoom
									? "cursor-zoom-in"
									: "cursor-zoom-out"
								: ""
						}`}
						src={
							src.startsWith("data:") || src.startsWith("blob:")
								? src
								: showZoom
									? getImageUrl(src, { format: "auto" })
									: getPaddedImageUrl(src, size || 300, size || 300, "111111")
						}
						alt={`Inscription${num !== "" ? ` #${num}` : ""}`}
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
		thumbnail,
	]);

	const wrapperClassName = `${
		showFooter
			? `${type !== ArtifactType.HTML ? "pb-[65px]" : ""} ${
					classNames?.footer ? classNames.footer : ""
				}`
			: ""
	} ${glow ? "glow" : ""} flex flex-col items-center justify-center bg-card w-full h-full relative rounded ${
		to && !disableLink ? "cursor-pointer" : "cursor-default"
	} block transition mx-auto ${classNames?.wrapper ? classNames.wrapper : ""}`;

	const footerContent = showFooter === true && num !== undefined && (
		<div className="text-xs absolute bottom-0 left-0 bg-black/75 flex items-center justify-between w-full p-2 h-[56px]">
			<Button
				variant="secondary"
				size="sm"
				className="h-auto py-1 px-2 text-[#aaa] bg-[#222] hover:bg-[#333]"
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
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
			</Button>
			<div className={"hidden md:block"}>&nbsp;</div>
			<Button
				variant="secondary"
				size="sm"
				className={`h-auto py-1 px-2 text-[#aaa] bg-[#222] hover:bg-emerald-600 hover:text-white transition ${
					price !== undefined ? "cursor-pointer" : ""
				}`}
				onClick={(e) => {
					if (price === undefined || !isListing) return;
					e.stopPropagation();
					e.preventDefault();

					// Handle Bsv20 routing logic if implemented
					if (
						artifact.origin?.data?.map?.p === "bsv-20" ||
						artifact.origin?.data?.map?.p === "bsv-21"
					) {
						// routing logic
						return;
					}
					// Trigger buy modal if implemented
				}}
			>
				{price !== undefined
					? price > 1000
						? `Buy - ${toBitcoin(price)} BSV`
						: `Buy - ${price} sat`
					: contentType || "Unknown"}
			</Button>
		</div>
	);

	const innerContent = (
		<>
			{content}
			{isListing && (size || 300) >= 300 && showListingTag && (
				// Using Lucide icon for tag, styled similarly to original
				<div className="absolute top-0 right-0 mr-2 mt-2 pointer-events-none opacity-75">
					{/* Placeholder for tag icon or just standard badge */}
				</div>
			)}
			{footerContent}
		</>
	);

	return (
		<React.Fragment>
			{disableLink ? (
				<button
					type="button"
					key={outPoint || origin}
					className={`${wrapperClassName} border-none p-0 bg-transparent text-left`}
					onClick={() => {
						if (txid && onClick) {
							onClick(txid);
						}
					}}
				>
					{innerContent}
				</button>
			) : (
				<Link
					key={outPoint || origin}
					className={wrapperClassName}
					href={to || "#"}
					draggable={false}
					onClick={(e) => {
						if (!to && !clickToZoom) {
							e.stopPropagation();
							e.preventDefault();
							if (txid && onClick) {
								onClick(txid);
							}
						} else if (to) {
							play("click");
						}
					}}
				>
					{innerContent}
				</Link>
			)}
			{showZoom && (
				<button
					type="button"
					className="z-50 flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-80 overflow-hidden backdrop-blur-sm border-none p-0 cursor-default"
					onClick={() => setShowZoom(false)}
				>
					<div className="cursor-pointer absolute top-0 right-0 mr-4 mt-4 text-4xl z-20 p-2 text-white">
						<X />
					</div>
					{content}
				</button>
			)}
		</React.Fragment>
	);
};

export default Artifact;
