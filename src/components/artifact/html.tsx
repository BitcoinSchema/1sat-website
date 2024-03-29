import { ORDFS } from "@/constants";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { ReactEventHandler, useEffect } from "react";
import { TbFileTypeHtml } from "react-icons/tb";

interface ArtifactProps {
  origin: string;
  onClick?: () => void;
  className?: string;
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

  const html = useSignal<string | null>(null);
  const src = useSignal<string | null>(null);
  const isSingleImage = useSignal<boolean>(false);

  useEffect(() => {
    async function run() {
      const res = await fetch(`${ORDFS}/${origin}`);
      if (!res.ok) {
        console.error(`Error fetching ${origin}`);
      }

      const data = await res.text();
      const parsedHtml = new DOMParser().parseFromString(data, "text/html");
      html.value = parsedHtml.documentElement.innerHTML;

      const images =
        parsedHtml.querySelectorAll<HTMLImageElement>("body > img");
      const image = images.length === 1 ? images[0] : null;

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
  }, [origin]);

  if (!src.value) {
    return null;
  }

  return (
    <div
      className={`absolute w-full h-full pb-[65px] ${
        onClick ? "cursor-pointer" : ""
      } ${className ? className : ""}`}
      onClick={onClick}
    >
      {isSingleImage.value && (
        <img
          onLoad={onLoad as ReactEventHandler<HTMLImageElement>}
          src={src.value}
          height={size || "100%"}
          width={size || "100%"}
          alt="html artifact"
          className="pointer-events-none w-full h-full object-contain object-center"
        />
      )}

      {!isSingleImage.value && html.value && (
        <>
          {!mini && (
            <iframe
              onLoad={onLoad as ReactEventHandler<HTMLIFrameElement>}
              title="html artifact"
              className={`pointer-events-none w-full h-full bg-none overflow-hidden no-scrollbar ${
                size ? `w-[${size}px] h-[${size}px]` : ""
              }`}
              srcDoc={html.value}
              sandbox=" "
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
