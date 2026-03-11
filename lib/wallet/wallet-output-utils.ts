import type { WalletOutput } from "@1sat/actions";

/** Extract a tag value by prefix (e.g. "type:" → "image/png") */
export function getTag(
	output: WalletOutput,
	prefix: string,
): string | undefined {
	return output.tags?.find((t) => t.startsWith(prefix))?.slice(prefix.length);
}

/** Get content type from tags */
export function getContentType(output: WalletOutput): string {
	return getTag(output, "type:") ?? "";
}

/** Get origin outpoint from tags, formatted with underscore separator */
export function getOriginOutpoint(output: WalletOutput): string {
	const origin = getTag(output, "origin:");
	if (origin) return origin.replace(".", "_");
	return output.outpoint.replace(".", "_");
}

/** Get display name from tags */
export function getName(output: WalletOutput): string | undefined {
	return getTag(output, "name:");
}

/** Get outpoint formatted with underscore separator */
export function getDisplayOutpoint(output: WalletOutput): string {
	return output.outpoint.replace(".", "_");
}

/** Parse outpoint into txid and vout */
export function parseWalletOutpoint(output: WalletOutput): {
	txid: string;
	vout: number;
} {
	const [txid, voutStr] = output.outpoint.split(".");
	return { txid, vout: Number.parseInt(voutStr, 10) };
}

/** Classify content type for display purposes */
export function classifyContent(
	output: WalletOutput,
): "video" | "audio" | "3d" | "image" {
	const ct = getContentType(output);
	if (ct.startsWith("video/")) return "video";
	if (ct.startsWith("audio/")) return "audio";
	if (ct.includes("model/") || ct.includes("gltf")) return "3d";
	return "image";
}
