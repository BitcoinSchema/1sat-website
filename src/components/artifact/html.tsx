import { ORDFS } from "@/constants";
import { TbFileTypeHtml } from "react-icons/tb";

interface ArtifactProps {
  origin: string;
  onClick?: () => void;
  className?: string;
  mini?: boolean;
  size?: number;
}
const HTMLArtifact: React.FC<ArtifactProps> = ({
  origin,
  onClick,
  className,
  mini = false,
  size,
}) => {
  return (
    <div
      className={`absolute w-full h-full ${onClick ? "cursor-pointer" : ""} ${
        className ? className : ""
      }`}
      onClick={onClick}
    >
      {!mini && <iframe
        title="html artifact"
        className={`pointer-events-none w-full h-full bg-none overflow-hidden no-scrollbar ${size ? `w-[${size}px] h-[${size}px]` : ""}`}
        src={`${ORDFS}/${origin}`}
        sandbox=" "
        height={size || "100%"}
        width={size || "100%"}
        scrolling="no"
      />}
      {mini && <TbFileTypeHtml className="mx-auto w-6 h-6" />}

    </div>
  );
};
export default HTMLArtifact;
