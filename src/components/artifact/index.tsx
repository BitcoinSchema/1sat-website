import React from "react";

export enum ArtifactType {
  Audio,
  Image,
  Model,
  PDF,
  Video,
  Javascript,
  HTML,
  MarkDown,
}

type ArtifactProps = {
  outPoint: string;
  type: ArtifactType;
};

const Artifact: React.FC<ArtifactProps> = ({ outPoint, type }) => {
  return (
    <a
      key={outPoint}
      target="_blank"
      href={`https://whatsonchain.com/tx/${outPoint}`}
    >
      {type === ArtifactType.Video ? (
        <video
          src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
          controls={true}
        />
      ) : type === ArtifactType.Audio ? (
        <audio
          src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
        />
      ) : (
        <img
          className="w-full rounded"
          src={`https://ordinals.gorillapool.io/api/files/inscriptions/${outPoint}`}
        />
      )}
    </a>
  );
};

export default Artifact;
