/// <reference types="@google/model-viewer" />

declare namespace JSX {
	interface IntrinsicElements {
		"model-viewer": {
			src?: string;
			alt?: string;
			poster?: string;
			"environment-image"?: string;
			"shadow-intensity"?: string;
			"shadow-softness"?: string;
			"tone-mapping"?: string;
			"skybox-image"?: string;
			style?: React.CSSProperties;
			onLoadStart?: () => void;
			[key: string]: unknown;
		};
	}
}
