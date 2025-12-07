"use client";

import { ImageOff } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps extends Omit<ImageProps, "src"> {
	src: string;
	fallbackSrc?: string;
}

export default function ImageWithFallback({
	src,
	fallbackSrc = "/placeholder.svg",
	alt,
	...props
}: ImageWithFallbackProps) {
	const [error, setError] = useState(false);

	if (error) {
		return (
			<div className="flex items-center justify-center bg-muted/50 w-full h-full min-h-[200px] text-muted-foreground">
				<ImageOff className="w-8 h-8 opacity-50" />
			</div>
		);
	}

	return (
		<Image {...props} alt={alt} src={src} onError={() => setError(true)} />
	);
}
