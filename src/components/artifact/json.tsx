import { API_HOST, BSV20, Bsv20Status, LRC20, ORDFS } from "@/context/ordinals";
import React, { useEffect, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import { IoMdWarning } from "react-icons/io";
import { ArtifactType } from ".";
import { FetchStatus } from "../../components/pages";

type TextArtifactProps = {
  origin?: string;
  className?: string;
  json?: JSON;
  type?: ArtifactType;
};

const JsonArtifact: React.FC<TextArtifactProps> = ({
  origin,
  className,
  json: j,
  type = ArtifactType.JSON,
}) => {
  const [json, setJson] = useState<JSON | any>(j);
  const [bsv20, setBsv20] = useState<Partial<BSV20> | undefined>();
  const [lrc20, setLrc20] = useState<Partial<LRC20> | undefined>(undefined);
  const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchBsv20Status, setFetchBsv20Status] = useState<FetchStatus>(
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
          const txResult = await fetch(`${API_HOST}/api/txos/${origin}`);
          if (txResult.status === 200) {
            const txJson = await txResult.json();
            setFetchBsv20Status(FetchStatus.Success);
            if (type === ArtifactType.LRC20) {
              setLrc20(txJson);
            } else if (type === ArtifactType.BSV20) {
              setBsv20(txJson);
            }
          } else {
            if (type === ArtifactType.BSV20) {
              // if we already know the ticker limit dont fetch it again
              if (limCache.has(resultText.tick)) {
                let limit = limCache.get(resultText.tick);
                setBsv20({
                  status:
                    resultText.op === "mint" &&
                    limit! > parseInt(resultText.amt)
                      ? Bsv20Status.Valid
                      : Bsv20Status.Invalid,
                });
              } else {
                // try to get by ticker, and check the limit
                const bsv20TickResult = await fetch(
                  `${API_HOST}/api/bsv20/tick/${resultText.tick}`
                );
                if (txResult.status === 200) {
                  const bsv20TickResultJson =
                    (await bsv20TickResult.json()) as BSV20;
                  console.log({ bsv20TickResultJson });
                  if (bsv20TickResultJson.lim) {
                    const newLimCache = new Map(limCache);
                    newLimCache.set(
                      resultText.tick.toLowercase(),
                      parseInt(bsv20TickResultJson.lim)
                    );
                    console.log(
                      "cached ticker limit",
                      resultText.tick.toLowercase(),
                      bsv20TickResultJson.lim
                    );
                    setLimCache(newLimCache);
                  }

                  setBsv20({
                    valid:
                      resultText.op === "mint" &&
                      bsv20TickResultJson &&
                      bsv20TickResultJson.lim &&
                      bsv20TickResultJson.lim > resultText.amt
                        ? Bsv20Status.Valid
                        : Bsv20Status.Invalid,
                  } as Partial<BSV20>);
                } else {
                  setBsv20({ valid: Bsv20Status.Pending } as Partial<BSV20>);
                }
                setFetchBsv20Status(FetchStatus.Success);
              }
            }
          }
        }
      } catch (e) {
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
  ]);

  return fetchTextStatus === FetchStatus.Success ? (
    <div className="relative w-full h-full flex">
      <pre
        className={`overflow-hidden max-h-96 flex items-center justify-start w-full h-full transition text-xs  ${
          className ? className : ""
        }`}
      >
        {JSON.stringify(json, null, 2)}
      </pre>
      {type === ArtifactType.BSV20 &&
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
        )}
    </div>
  ) : (
    <LoaderIcon className="mx-auto" />
  );
};

export default JsonArtifact;
