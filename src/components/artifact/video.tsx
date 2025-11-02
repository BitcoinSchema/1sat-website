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
  // Check if we need to constrain height (non-scrollable in modal)
  const needsHeightConstraint = className?.includes('h-full');

  return (
    <video
      className={`transition ${className ? className : ""}`}
      style={needsHeightConstraint ? { maxHeight: 'calc(90vh - 4rem)', maxWidth: '100%' } : undefined}
      src={src ? src : `${ORDFS}/${origin}`}
      controls={true}
      preload="auto"
      onClick={(e) => e.stopPropagation()}
    />
  );
};

export default VideoArtifact;
