import { FetchStatus } from "@/constants";
import { useState } from "react";

type ModelProps = {
  src: string;
  size?: number;
};
const Model: React.FC<ModelProps> = ({ src, size }) => {
  const [modelStatus, setModelStatus] = useState<FetchStatus>(FetchStatus.Idle);
  return (
    /* @ts-ignore */
    <model-viewer
      src={src}
      ios-src=""
      width={size || "100%"}
      height={size || "100%"}
      poster="https://cdn.glitch.com/36cb8393-65c6-408d-a538-055ada20431b%2Fposter-astronaut.png?v=1599079951717"
      alt="A 3D model from the blockchain"
      shadow-intensity="1"
      onLoadStart={() => {
        console.log("on model load start");
        setModelStatus(FetchStatus.Loading);
      }}
      onLoad={() => {
        console.log("on model load");
        setModelStatus(FetchStatus.Success);
      }}
      onError={() => {
        setModelStatus(FetchStatus.Error);
      }}
      camera-controls
      auto-rotate
      class={`modelViewer max-h-[${size}px}]`}
    />
  );
};

export default Model;
