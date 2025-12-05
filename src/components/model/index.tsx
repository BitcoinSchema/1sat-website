"use client";

import "@google/model-viewer";
import type React from "react";

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"model-viewer": React.DetailedHTMLProps<
				React.HTMLAttributes<HTMLElement>,
				HTMLElement
			> & {
				src?: string;
				alt?: string;
				poster?: string;
				"environment-image"?: string;
				"shadow-intensity"?: string;
				"shadow-softness"?: string;
				"tone-mapping"?: string;
				"skybox-image"?: string;
				"auto-rotate"?: string;
				"camera-controls"?: string;
				"camera-orbit"?: string;
				"seamless-poster"?: string;
			};
		}
	}
}

type ModelProps = {
	src: string;
	size?: number;
};

const Model: React.FC<ModelProps> = ({ src, size }) => {
	return (
		<model-viewer
			src={src}
			style={{ width: size || 300, height: size || 300, margin: "auto" }}
			poster="/model-poster.png"
			environment-image="https://cdn.polyhaven.com/gallery/4f96c7a0db3cf7f5eb36.jpg?width=2159"
			shadow-intensity="1"
			shadow-softness="0.73"
			tone-mapping="neutral"
			// skybox-image="https://cdn.discordapp.com/attachments/1055908739804307477/1233415901735293008/wildsatchmo_nebula_HDRI_b2c6f00b-48aa-4aae-9ab0-097e0f66a3ed_1.png?ex=662d0392&is=662bb212&hm=99e023dc57886a8c04d025727058752006b98b0652bf052759d2d6636d3d86b1&width=2159"
			alt="3D Model - 1Sat Ordinal Preview"
			onLoadStart={() => {
				console.log("on model load start");
			}}
			onLoad={() => {
				console.log("on model load");
			}}
			onError={() => {
				console.log("on model error");
			}}
			auto-rotate=""
			camera-controls=""
			camera-orbit="0deg 90deg 0deg 8.37364m"
			seamless-poster=""
		/>
	);
};

export default Model;
