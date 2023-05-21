import { API_HOST } from "@/context/ordinals";
import React, { useEffect, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import { FetchStatus } from "../../components/pages";

type TextArtifactProps = {
  outPoint?: string;
  className?: string;
  json?: JSON;
};

const JsonArtifact: React.FC<TextArtifactProps> = ({
  outPoint,
  className,
  json: j,
}) => {
  const [json, setJson] = useState<JSON | undefined>(j);
  const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchTextStatus(FetchStatus.Loading);

        const result = await fetch(
          `${API_HOST}/api/files/inscriptions/${outPoint}`
        );
        const resultText = await result.json();
        setFetchTextStatus(FetchStatus.Success);
        setJson(resultText);
      } catch (e) {
        setFetchTextStatus(FetchStatus.Error);
      }
    };
    if (!json) {
      fire();
    }
  }, [json, outPoint, setJson, setFetchTextStatus]);

  return fetchTextStatus === FetchStatus.Success ? (
    <pre
      className={`flex items-center justify-center w-full h-full transition  ${
        className ? className : ""
      }`}
    >
      {JSON.stringify(json, null, 2)}
    </pre>
  ) : (
    <LoaderIcon className="mx-auto" />
  );
};

export default JsonArtifact;
