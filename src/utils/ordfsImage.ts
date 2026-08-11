import { ORDFS_IMAGE } from "@/constants";

export type OrdfsImageOptions = {
	w?: number;
	h?: number;
	fit?: "limit" | "fit" | "fill" | "pad" | "scale";
	g?:
		| "center"
		| "north"
		| "south"
		| "east"
		| "west"
		| "northeast"
		| "northwest"
		| "southeast"
		| "southwest";
	f?: "auto" | "jpeg" | "png" | "webp" | "avif";
	q?: number;
};

// Derived image for an inscription outpoint (or bare txid) from the 1sat-stack
// transform endpoint. Dimensions snap up to a fixed width ladder server-side;
// pad fills with transparency, so the container's background shows through.
export const ordfsImageUrl = (
	outpoint: string,
	options: OrdfsImageOptions,
) => {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(options)) {
		if (value !== undefined) {
			params.set(key, String(value));
		}
	}
	return `${ORDFS_IMAGE}/${outpoint}?${params.toString()}`;
};
