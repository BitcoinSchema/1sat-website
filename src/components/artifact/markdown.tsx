import React, { useEffect, useMemo, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { FetchStatus } from "../pages";

type MarkdownArtifactProps = {
  origin?: string;
  className?: string;
};

const MarkdownArtifact: React.FC<MarkdownArtifactProps> = ({
  origin,
  className,
}) => {
  const [text, setText] = useState<string>();
  const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchTextStatus(FetchStatus.Loading);
        const result = await fetch(`/content/${origin}`);
        const resultText = await result.text();
        setFetchTextStatus(FetchStatus.Success);
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

  const markdown = useMemo(() => {
    return text && <ReactMarkdown>{text}</ReactMarkdown>;
  }, [text]);

  return fetchTextStatus === FetchStatus.Success ? (
    <pre
      className={`flex items-center justify-center w-full h-full transition  ${
        className ? className : ""
      }`}
    >
      {markdown}
    </pre>
  ) : (
    <LoaderIcon className="mx-auto" />
  );
};

export default MarkdownArtifact;
