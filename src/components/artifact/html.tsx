import { API_HOST } from "@/context/ordinals";

interface ArtifactProps {
  origin: string;
  onClick?: () => void;
  className?: string;
}
const HTMLArtifact: React.FC<ArtifactProps> = ({
  origin,
  onClick,
  className,
}) => {
  return (
    <div
      className={`absolute w-full h-full ${onClick ? "cursor-pointer" : ""} ${
        className ? className : ""
      }`}
      onClick={onClick}
    >
      <iframe
        className={`pointer-events-none w-full h-full bg-none overflow-hidden no-scrollbar`}
        src={`${API_HOST}/content/${origin}`}
        sandbox=" "
        height="100%"
        width="100%"
        scrolling="no"
      />
    </div>
  );
};
export default HTMLArtifact;
