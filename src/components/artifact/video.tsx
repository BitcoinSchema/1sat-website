import { ORDFS } from "@/constants";
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
      className={`transition ${className ? className : ""}`}
      style={{
        minHeight: '60vh',
        width: '100%',
        objectFit: 'contain'
      }}
      src={src ? src : `${ORDFS}/${origin}`}
      controls={true}
      preload="auto"
      onClick={(e) => e.stopPropagation()}
    />
  );
};

export default VideoArtifact;
