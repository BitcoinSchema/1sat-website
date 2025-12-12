import { FileCode } from "lucide-react";
import Image from "next/image";
import { type ReactEventHandler, useEffect, useState } from "react";
import { ORDFS } from "@/lib/constants";

interface ArtifactProps {
	origin: string;
	onClick?: () => void;
	className?: { wrapper?: string; iframe?: string };
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
	const [src, setSrc] = useState<string | null>(null);
	const [isSingleImage, setIsSingleImage] = useState<boolean>(false);

	useEffect(() => {
		async function run() {
			if (!origin || typeof origin !== "string") {
				return;
			}

			const initialSrc = `${ORDFS}/${origin}`;

			try {
				const res = await fetch(initialSrc);
				if (!res.ok) {
					setSrc(initialSrc);
					return;
				}

				let image: HTMLImageElement | null = null;
				if (res.headers.get("content-type")?.startsWith("text/html")) {
					const data = await res.text();
					const parsedHtml = new DOMParser().parseFromString(data, "text/html");
					const images =
						parsedHtml.querySelectorAll<HTMLImageElement>("body > img");
					image = images.length === 1 ? images[0] : null;
				}

				if (image) {
					const url = new URL(image.src);
					const pathname = url.pathname;
					const isOrdFsSrc = url.origin === window.location.origin;

					if (isOrdFsSrc) {
						setSrc(`${ORDFS}${pathname}`);
					} else {
						setSrc(image.src);
					}
					setIsSingleImage(true);
				} else {
					setSrc(initialSrc);
					setIsSingleImage(false);
				}
			} catch {
				setSrc(initialSrc);
			}
		}
		run();
	}, [origin]);

	if (!src) {
		return null;
	}

	return (
		<button
			type="button"
			className={`${className?.wrapper || ""} w-full h-full p-0 border-0 bg-transparent text-left`}
			onClick={onClick}
		>
			{isSingleImage && src && (
				<div className="relative w-full h-full">
					<Image
						onLoad={onLoad as ReactEventHandler<HTMLImageElement>}
						src={src}
						alt="html artifact"
						fill
						className={`pointer-events-none object-contain object-center ${
							className?.iframe || ""
						}`}
					/>
				</div>
			)}

			{!isSingleImage && (
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
							src={src}
							sandbox="allow-scripts"
							height={size || "100%"}
							width={size || "100%"}
							scrolling="no"
						/>
					)}

					{mini && <FileCode className="mx-auto w-6 h-6" />}
				</>
			)}
		</button>
	);
};
export default HTMLArtifact;
