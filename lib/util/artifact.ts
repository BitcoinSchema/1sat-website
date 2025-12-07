import type { OrdUtxo } from "@/lib/types/ordinals";

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

export const getArtifactType = (
	txo: OrdUtxo,
	latest: boolean,
): ArtifactType => {
	let artifactType: ArtifactType = ArtifactType.Unknown;
	const t = latest
		? txo?.data?.insc?.file.type
		: txo?.origin?.data?.insc?.file.type || undefined;

	const protocol = txo.origin?.data?.map?.p; // Adjusted path for protocol if needed, strictly following types

	if (!t) {
		return artifactType;
	}
	if (t?.startsWith("audio")) {
		artifactType = ArtifactType.Audio;
	} else if (t === "application/vnd.apple.mpegurl") {
		artifactType = ArtifactType.Audio2;
	} else if (t.startsWith("video")) {
		artifactType = ArtifactType.Video;
	} else if (t.startsWith("model")) {
		artifactType = ArtifactType.Model;
	} else if (t === "application/pdf") {
		artifactType = ArtifactType.Model; // Mapped to Model in original code?
	} else if (t === "application/javascript") {
		artifactType = ArtifactType.Javascript;
	} else if (t === "text/plain") {
		artifactType = ArtifactType.Text;
	} else if (t === "text/markdown") {
		artifactType = ArtifactType.MarkDown;
	} else if (t === "text/html") {
		artifactType = ArtifactType.HTML;
	} else if (t.startsWith("text/")) {
		artifactType = ArtifactType.Text;
	} else if (t === "application/bsv-20") {
		artifactType = ArtifactType.BSV20;
	} else if (t === "application/lrc-20" || protocol === "lrc-20") {
		artifactType = ArtifactType.LRC20;
	} else if (t === "application/op-ns") {
		artifactType = ArtifactType.OPNS;
	} else if (t === "application/json") {
		artifactType = ArtifactType.JSON;
	} else if (t.startsWith("image/svg")) {
		artifactType = ArtifactType.SVG;
	} else if (t.startsWith("image")) {
		artifactType = ArtifactType.Image;
	}
	return artifactType;
};
