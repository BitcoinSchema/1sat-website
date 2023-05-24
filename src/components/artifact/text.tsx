import { API_HOST } from "@/context/ordinals";
import React, { useEffect, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import { FetchStatus } from "../pages";
import JsonArtifact from "./json";

type TextArtifactProps = {
  outPoint?: string;
  className?: string;
};

const TextArtifact: React.FC<TextArtifactProps> = ({ outPoint, className }) => {
  const [text, setText] = useState<string>();
  const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [isJson, setIsJson] = useState<boolean>(false);

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchTextStatus(FetchStatus.Loading);
        const result = await fetch(
          `${API_HOST}/api/files/inscriptions/${outPoint}`
        );
        const resultText = await result.text();
        setFetchTextStatus(FetchStatus.Success);
        try {
          JSON.parse(resultText);
          setIsJson(true);
        } catch (e) {}
        setText(resultText);
      } catch (e) {
        setFetchTextStatus(FetchStatus.Error);
      }
    };
    if (!text && fetchTextStatus === FetchStatus.Idle) {
      fire();
    }
  }, [text, fetchTextStatus, outPoint, setText, setFetchTextStatus]);

  return fetchTextStatus === FetchStatus.Success ? (
    isJson ? (
      <JsonArtifact
        outPoint={outPoint}
        className={className ? className : ""}
      />
    ) : (
      <pre
        className={`flex items-center justify-center w-full h-full transition  ${
          className ? className : ""
        }`}
      >
        {text}
      </pre>
    )
  ) : (
    <LoaderIcon className="mx-auto" />
  );
};

export default TextArtifact;
