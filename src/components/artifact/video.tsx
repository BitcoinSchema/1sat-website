import React from "react";

type VideoArtifactProps = {
  origin?: string;
  src?: string;
  className?: string;
};

const VideoArtifact: React.FC<VideoArtifactProps> = ({
  origin,
  src,
  className,
}) => {
  return (
    <video
      className={`transition  ${className ? className : ""}`}
      src={src ? src : `https://ordfs.network/content/${origin}`}
      controls={true}
    />
  );
};

export default VideoArtifact;
