import { API_HOST } from "@/context/ordinals";
import React, { useEffect, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import { ArtifactType } from ".";
import { FetchStatus } from "../pages";
import JsonArtifact from "./json";

type TextArtifactProps = {
  origin?: string;
  className?: string;
};

const TextArtifact: React.FC<TextArtifactProps> = ({ origin, className }) => {
  const [text, setText] = useState<string>();
  const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [isJson, setIsJson] = useState<boolean>(false);
  const [isBsv20, setIsBsv20] = useState<boolean>(false);

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchTextStatus(FetchStatus.Loading);
        const result = await fetch(
          `${API_HOST}/api/files/inscriptions/${origin}`
        );
        const resultText = await result.text();
        setFetchTextStatus(FetchStatus.Success);
        try {
          const res = JSON.parse(resultText);

          if (res.op && res.p && res.p === "bsv-20") {
            setIsBsv20(true);
          } else {
            setIsJson(true);
          }
        } catch (e) {
          // not json
          return;
        }
        setText(resultText);
      } catch (e) {
        console.error("Failed to fetch inscription", e);
        setFetchTextStatus(FetchStatus.Error);
      }
    };
    if (!text && fetchTextStatus === FetchStatus.Idle) {
      fire();
    }
  }, [text, fetchTextStatus, origin, setText, setFetchTextStatus]);

  return fetchTextStatus === FetchStatus.Success ? (
    isBsv20 ? (
      <JsonArtifact
        type={ArtifactType.BSV20}
        origin={origin}
        className={className ? className : ""}
      />
    ) : isJson ? (
      <JsonArtifact
        type={ArtifactType.JSON}
        origin={origin}
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
