import React from "react";

type VideoArtifactProps = {
  outPoint: string;
  className?: string;
};

const VideoArtifact: React.FC<VideoArtifactProps> = ({
  outPoint,
  className,
}) => {
  return (
    <video
      className={`transition  ${className ? className : ""}`}
      src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
      controls={true}
    />
  );
};

export default VideoArtifact;
