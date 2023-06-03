import { API_HOST } from "@/context/ordinals";
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
      src={src ? src : `${API_HOST}/api/files/inscriptions/${origin}`}
      controls={true}
    />
  );
};

export default VideoArtifact;
