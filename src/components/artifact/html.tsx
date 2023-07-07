interface ArtifactProps {
  origin: string;
}
const HTMLArtifact: React.FC<ArtifactProps> = ({ origin }) => {
  return (
    <iframe
      className="w-full h-[calc(100%-3rem)] bg-none absolute overflow-hidden no-scrollbar"
      src={`https://ordfs.network/${origin}`}
      sandbox="allow-scripts"
      height="100%"
      width="100%"
      scrolling="no"
    />
  );
};
export default HTMLArtifact;
