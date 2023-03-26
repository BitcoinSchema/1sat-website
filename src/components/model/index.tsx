import { useState } from "react";
import { FetchStatus } from "../pages";

type ModelProps = {
  src: string;
};
const Model: React.FC<ModelProps> = ({ src }) => {
  const [modelStatus, setModelStatus] = useState<FetchStatus>(FetchStatus.Idle);
  return (
    <model-viewer
      src={src}
      ios-src=""
      width={"100%"}
      height={"100%"}
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
      /* @ts-ignore */
      class="modelViewer"
    />
  );
};

export default Model;
