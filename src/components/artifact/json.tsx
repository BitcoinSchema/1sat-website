import { FetchStatus, ORDFS } from "@/constants";
import type { BSV20 } from "@/types/bsv20";
import type { LRC20 } from "@/types/ordinals";
import type React from "react";
import { useEffect, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import { FaCode } from "react-icons/fa6";
import { ArtifactType } from ".";

type TextArtifactProps = {
  origin?: string;
  className?: string;
  json?: JSON;
  type?: ArtifactType;
  mini?: boolean;
  artifact?: any;
};

const JsonArtifact: React.FC<TextArtifactProps> = ({
  origin,
  className,
  json: j,
  type = ArtifactType.JSON,
  mini = false,
  artifact,
}) => {
  const [json, setJson] = useState<JSON | any>(j);
  const [bsv20, setBsv20] = useState<Partial<BSV20> | undefined>();
  const [_lrc20, setLrc20] = useState<Partial<LRC20> | undefined>(undefined);
  const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [_fetchBsv20Status, setFetchBsv20Status] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [limCache, setLimCache] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchTextStatus(FetchStatus.Loading);

        const result = await fetch(`${ORDFS}/${origin}`);
        const resultText = await result.json();
        setFetchTextStatus(FetchStatus.Success);
        setJson(resultText);

        if (type === ArtifactType.LRC20 || type === ArtifactType.BSV20) {
          const txJson = artifact.origin;
          setFetchBsv20Status(FetchStatus.Success);
          if (type === ArtifactType.LRC20) {
            setLrc20(txJson);
          } else if (type === ArtifactType.BSV20) {
            setBsv20(txJson);
          }
        }
      } catch (_e) {
        setFetchTextStatus(FetchStatus.Error);
      }
    };
    if (!json && fetchTextStatus === FetchStatus.Idle) {
      fire();
    }
  }, [
    json,
    bsv20,
    setJson,
    setBsv20,
    setFetchTextStatus,
    setFetchBsv20Status,
    type,
    limCache.size,
    setLimCache,
    fetchTextStatus,
    limCache,
    origin,
    artifact,
  ]);

  // useEffect(() => {
  //   console.log({ bsv20 });
  // }, [bsv20]);

  return fetchTextStatus === FetchStatus.Success ? (
    <div className="relative w-full h-full flex">
      {!mini && (
        <pre
          className={`overflow-hidden max-h-96 flex items-center justify-start w-full h-full transition text-xs  ${
            className ? className : ""
          }`}
        >
          {JSON.stringify(json, null, 2)}
        </pre>
      )}
      {mini && (
        <div>
          <FaCode />
        </div>
      )}
      {/* {!mini &&
        type === ArtifactType.BSV20 &&
        bsv20 &&
        bsv20.status !== Bsv20Status.Valid && (
          <div
            className={`rounded bg-black bg-opacity-75 absolute bottom-0 p-2 md:p-4 ${
              bsv20.status === Bsv20Status.Pending
                ? "text-yellow-400"
                : "text-red-400"
            } left-0 font-semibold w-full flex items-center justify-center text-sm`}
          >
            <IoMdWarning className="mr-2 w-8" />{" "}
            {`${
              bsv20.status === Bsv20Status.Pending
                ? "PENDING VALIDATION"
                : "INVALID BSV20"
            }`}
          </div>
        )} */}
    </div>
  ) : (
    <LoaderIcon className="mx-auto" />
  );
};

export default JsonArtifact;
