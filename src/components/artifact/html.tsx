import { ORDFS } from "@/constants";
import { TbFileTypeHtml } from "react-icons/tb";

interface ArtifactProps {
  origin: string;
  onClick?: () => void;
  className?: string;
  mini?: boolean;
}
const HTMLArtifact: React.FC<ArtifactProps> = ({
  origin,
  onClick,
  className,
  mini = false,
}) => {
  return (
    <div
      className={`absolute w-full h-full ${onClick ? "cursor-pointer" : ""} ${
        className ? className : ""
      }`}
      onClick={onClick}
    >
      {!mini && <iframe
        className={`pointer-events-none w-full h-full bg-none overflow-hidden no-scrollbar`}
        src={`${ORDFS}/${origin}`}
        sandbox=" "
        height="100%"
        width="100%"
        scrolling="no"
      />}
      {mini && <TbFileTypeHtml className="mx-auto w-6 h-6" />}

    </div>
  );
};
export default HTMLArtifact;
