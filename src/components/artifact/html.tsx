import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { type ReactEventHandler, useEffect } from "react";
import { TbFileTypeHtml } from "react-icons/tb";
import { ORDFS } from "@/constants";

interface ArtifactProps {
	origin: string;
	onClick?: () => void;
	className?: { wrapper: string; iframe: string };
	mini?: boolean;
	size?: number;
	onLoad?:
		| ReactEventHandler<HTMLImageElement>
		| ReactEventHandler<HTMLIFrameElement>;
}
const HTMLArtifact: React.FC<ArtifactProps> = ({
	origin,
	onClick,
	className,
	mini = false,
	size,
	onLoad,
}) => {
	useSignals();

	// const html = useSignal<string | null>(null);
	const src = useSignal<string | null>(null);
	const isSingleImage = useSignal<boolean>(false);

	useEffect(() => {
		async function run() {
			src.value = `${ORDFS}/${origin}`;
			const res = await fetch(src.value);
			if (!res.ok) {
				console.error(`Error fetching ${origin}`);
			}

			let image: HTMLImageElement | null = null;
			if (res.headers.get("content-type")?.startsWith("text/html")) {
				const data = await res.text();
				const parsedHtml = new DOMParser().parseFromString(data, "text/html");
				// html.value = parsedHtml.documentElement.innerHTML;

				const images =
					parsedHtml.querySelectorAll<HTMLImageElement>("body > img");
				image = images.length === 1 ? images[0] : null;
			}

			/**
			 * If we have a single image, we can use the image src directly
			 */
			if (image) {
				const url = new URL(image.src);
				const pathname = url.pathname;
				const isOrdFsSrc = url.origin === window.location.origin;

				if (isOrdFsSrc) {
					src.value = `${ORDFS}${pathname}`;
				} else {
					src.value = image.src;
				}

				isSingleImage.value = true;
			} else {
				src.value = `${ORDFS}/${origin}`;
				isSingleImage.value = false;
			}
		}
		run();
	}, [isSingleImage, origin, src]);

	if (!src.value) {
		return null;
	}

	return (
		<div className={className?.wrapper || ""} onClick={onClick}>
			{isSingleImage.value && (
				<img
					onLoad={onLoad as ReactEventHandler<HTMLImageElement>}
					src={src.value}
					height={size}
					width={size}
					alt="html artifact"
					className={`pointer-events-none w-full h-full object-contain object-center ${className?.iframe || ""}`}
				/>
			)}

			{!isSingleImage.value && (
				<>
					{!mini && (
						<iframe
							onLoad={onLoad as ReactEventHandler<HTMLIFrameElement>}
							title="html artifact"
							className={`pointer-events-none bg-none overflow-hidden no-scrollbar ${
								size
									? `w-[${size}px] h-[${size}px]`
									: "h-full w-full min-h-full min-w-full"
							}`}
							src={src.value}
							// sandbox=" "
							sandbox="allow-scripts"
							height={size || "100%"}
							width={size || "100%"}
							scrolling="no"
						/>
					)}

					{mini && <TbFileTypeHtml className="mx-auto w-6 h-6" />}
				</>
			)}
		</div>
	);
};
export default HTMLArtifact;
