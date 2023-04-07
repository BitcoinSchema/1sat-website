import { API_HOST } from "@/context/ordinals";
import React from "react";

type VideoArtifactProps = {
  outPoint?: string;
  src?: string;
  className?: string;
};

const VideoArtifact: React.FC<VideoArtifactProps> = ({
  outPoint,
  src,
  className,
}) => {
  return (
    <video
      className={`transition  ${className ? className : ""}`}
      src={src ? src : `${API_HOST}/api/files/inscriptions/${outPoint}`}
      controls={true}
    />
  );
};

export default VideoArtifact;
