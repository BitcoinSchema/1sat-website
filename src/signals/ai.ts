import { signal } from "@preact/signals-react";

export type GeneratedImage = {
	name: string;
	data: string;
};

export const generatedImage = signal<GeneratedImage | null>(null);
