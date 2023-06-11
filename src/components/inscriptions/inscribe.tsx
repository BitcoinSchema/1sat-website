import { API_HOST, BSV20, useOrdinals } from "@/context/ordinals";
import { PendingTransaction, useWallet } from "@/context/wallet";
import { addressFromWif } from "@/utils/address";
import { formatBytes } from "@/utils/bytes";
import { PrivateKey } from "bsv-wasm-web";
import { Utxo, createOrdinal } from "js-1sat-ord";
import { debounce, head } from "lodash";
import Router, { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { CheckmarkIcon, ErrorIcon, LoaderIcon } from "react-hot-toast";
import { IoMdWarning } from "react-icons/io";
import { RiMagicFill, RiSettings2Fill } from "react-icons/ri";
import { TbClick } from "react-icons/tb";
import styled from "styled-components";
import Artifact from "../artifact";
import { FetchStatus, toastErrorProps } from "../pages";
import InscriptionTabs, { InscriptionTab } from "./tabs";

const Input = styled.input`
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 0.5rem 0 0.5rem 0;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
`;

enum ActionType {
  Mint = "mint",
  Deploy = "deploy",
}

type InscribeProps = {
  inscribedCallback: (inscription: PendingTransaction) => void;
  className?: string;
};

const Inscribe: React.FC<InscribeProps> = ({
  inscribedCallback,
  className,
}) => {
  const {
    setPendingTransaction,
    fundingUtxos,
    ordAddress,
    payPk,
    initialized,
    broadcastCache,
    createdUtxos,
    getUTXOs,
    bsv20Balances,
  } = useWallet();
  const { fetchStatsStatus, stats } = useOrdinals();

  const { tab, tick, op } = useRouter().query as {
    tab: InscriptionTab;
    tick: string;
    op: string;
  };
  const [iterations, setIterations] = useState<number>(1);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [tickerAvailable, setTickerAvailable] = useState<boolean | undefined>(
    undefined
  );
  const [fetchTickerStatus, setFetchTickerStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const [selectedActionType, setSelectedActionType] = useState<ActionType>(
    ActionType.Mint
  );

  const selectedTab = useMemo(() => {
    if (tab) {
      return tab as InscriptionTab;
    }
    return InscriptionTab.Image;
  }, [tab]);

  const [selectedBsv20, setSelectedBsv20] = useState<BSV20>();
  const [limit, setLimit] = useState<string | undefined>("1337");
  const [maxSupply, setMaxSupply] = useState<string>("21000000");
  const [decimals, setDecimals] = useState<number>(18);
  const [amount, setAmount] = useState<string>();
  const [ticker, setTicker] = useState<string>(tick);
  const [text, setText] = useState<string>();
  const [mintError, setMintError] = useState<string>();
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);

  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);

  useEffect(() => {
    if (op) {
      setSelectedActionType(op as ActionType);
    }
  }, [selectedActionType, op]);

  useEffect(() => {
    if (tick) {
      setTicker(tick);
    }
  }, [setTicker, tick]);

  const changeAddress = useMemo(() => {
    if (initialized && payPk) {
      return addressFromWif(payPk);
    }
  }, [initialized, payPk]);

  const toggleOptionalFields = useCallback(() => {
    setShowOptionalFields(!showOptionalFields);
  }, [showOptionalFields]);

  function readFileAsBase64(file: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader?.result as string).split(",")[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  const handleFileChange = useCallback(
    (event: any) => {
      const file = event.target.files[0] as File;
      setSelectedFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    },
    [setPreview, setSelectedFile]
  );

  // const utxo = useMemo(() => {
  //   return changeAddress
  //     ? head(
  //         (fundingUtxos || [])
  //           // .concat(createdUtxos)
  //           .map((utxo: any) => {
  //             return {
  //               satoshis: utxo.satoshis,
  //               vout: utxo.vout,
  //               txid: utxo.txid,
  //               script: !!utxo.script
  //                 ? utxo.script
  //                 : P2PKHAddress.from_string(changeAddress)
  //                     .get_locking_script()
  //                     .to_asm_string(),
  //             } as Utxo;
  //           })
  //           .sort((a: Utxo, b: Utxo) =>
  //             a.satoshis > b.satoshis ? -1 : 1
  //           ) as Utxo[]
  //       )
  //     : undefined;
  // }, [changeAddress, fundingUtxos]);

  // useEffect(() => {
  //   console.log({ utxo });
  // }, [utxo]);

  const inscribeImage = useCallback(
    async (utxo: Utxo) => {
      if (!selectedFile?.type || !utxo) {
        return;
      }
      setInscribeStatus(FetchStatus.Loading);
      try {
        const fileAsBase64 = await readFileAsBase64(selectedFile);
        try {
          setInscribeStatus(FetchStatus.Loading);
          const tx = await handleInscribing(
            payPk!,
            fileAsBase64,
            selectedFile.type,
            ordAddress!,
            changeAddress!,
            utxo
          );
          const satsIn = utxo!.satoshis;
          const satsOut = Number(tx.satoshis_out());
          if (satsIn && satsOut) {
            const fee = satsIn - satsOut;

            if (fee < 0) {
              console.error("Fee inadequate");
              toast.error("Fee Inadequate", toastErrorProps);
              setInscribeStatus(FetchStatus.Error);
              return;
            }
            const result = {
              rawTx: tx.to_hex(),
              size: tx.get_size(),
              fee,
              numInputs: tx.get_ninputs(),
              numOutputs: tx.get_noutputs(),
              txid: tx.get_id_hex(),
              inputTxid: tx.get_input(0)?.get_prev_tx_id_hex(),
            } as PendingTransaction;
            console.log(Object.keys(result));

            setPendingTransaction(result);
            inscribedCallback(result);
            setInscribeStatus(FetchStatus.Success);
            return;
          }
        } catch (e) {
          console.error(e);
          setInscribeStatus(FetchStatus.Error);
          return;
        }
      } catch (e) {
        setInscribeStatus(FetchStatus.Error);
        toast.error("Failed to inscribe " + e, toastErrorProps);
        console.error(e);
      }
    },
    [
      iterations,
      setInscribeStatus,
      selectedFile,
      inscribedCallback,
      payPk,
      ordAddress,
      changeAddress,
      setPendingTransaction,
    ]
  );

  const inscribeUtf8 = useCallback(
    async (text: string, contentType: string, utxo: Utxo) => {
      const fileAsBase64 = Buffer.from(text).toString("base64");
      const tx = await handleInscribing(
        payPk!,
        fileAsBase64,
        contentType,
        ordAddress!,
        changeAddress!,
        utxo
      );

      const result = {
        rawTx: tx.to_hex(),
        size: tx.get_size(),
        fee: utxo!.satoshis - Number(tx.satoshis_out()),
        numInputs: tx.get_ninputs(),
        numOutputs: tx.get_noutputs(),
        txid: tx.get_id_hex(),
        inputTxid: tx.get_input(0)!.get_prev_tx_id_hex(),
        iterations,
      };
      setPendingTransaction(result);
      inscribedCallback(result);
    },
    [
      iterations,
      setPendingTransaction,
      inscribedCallback,
      payPk,
      ordAddress,
      changeAddress,
    ]
  );

  const inscribeText = useCallback(
    async (utxo: Utxo) => {
      if (!text) {
        return;
      }
      setInscribeStatus(FetchStatus.Loading);

      await inscribeUtf8(text, "text/plain", utxo);

      console.log("TODO: Inscribe text");
      setInscribeStatus(FetchStatus.Success);
    },
    [inscribeUtf8, text]
  );

  const inscribeBsv20 = useCallback(
    async (utxo: Utxo) => {
      if (!ticker || ticker?.length === 0) {
        return;
      }

      setInscribeStatus(FetchStatus.Loading);

      try {
        let inscription = {
          p: "bsv-20",
          op: selectedActionType,
        } as BSV20;

        switch (selectedActionType) {
          case ActionType.Deploy:
            if (parseInt(maxSupply) == 0 || BigInt(maxSupply) > maxMaxSupply) {
              alert(
                `Invalid input: please enter a number less than or equal to ${
                  maxMaxSupply - BigInt(1)
                }`
              );
              return;
            }

            inscription.tick = ticker;
            inscription.max = maxSupply;

            // optional fields
            if (decimals !== 18) {
              inscription.dec = decimals.toString();
            }
            if (limit) inscription.lim = limit;
            else if (
              !confirm(
                "Warning: Token will have no mint limit. This means all tokens can be minted at once. Are you sure this is what you want?"
              )
            ) {
              setInscribeStatus(FetchStatus.Idle);
              return;
            }

            break;
          case ActionType.Mint:
            if (
              !amount ||
              parseInt(amount) == 0 ||
              BigInt(amount) > maxMaxSupply ||
              !selectedBsv20
            ) {
              alert(
                `Max supply must be a positive integer less than or equal to ${
                  maxMaxSupply - BigInt(1)
                }`
              );
              return;
            }
            inscription.tick = selectedBsv20.tick;
            inscription.amt = amount;
          default:
            break;
        }

        const text = JSON.stringify(inscription);

        inscribeUtf8(text, "application/bsv-20", utxo);

        setInscribeStatus(FetchStatus.Success);
      } catch (error) {
        setInscribeStatus(FetchStatus.Error);

        alert("Invalid max supply: please enter a number. " + error);
        return;
      }
    },
    [
      amount,
      decimals,
      inscribeUtf8,
      limit,
      maxSupply,
      selectedActionType,
      selectedBsv20,
      ticker,
    ]
  );

  const submitDisabled = useMemo(() => {
    switch (selectedTab) {
      case InscriptionTab.Image:
        return !selectedFile || inscribeStatus === FetchStatus.Loading;
      case InscriptionTab.Text:
        return inscribeStatus === FetchStatus.Loading;
      case InscriptionTab.BSV20:
        return (
          !tickerAvailable ||
          !ticker?.length ||
          inscribeStatus === FetchStatus.Loading ||
          fetchTickerStatus === FetchStatus.Loading
        );
      default:
        return true;
    }
  }, [
    selectedTab,
    selectedFile,
    inscribeStatus,
    tickerAvailable,
    ticker?.length,
    fetchTickerStatus,
  ]);

  const bulkInscribe = useCallback(async () => {
    if (!payPk || !ordAddress || !changeAddress) {
      return;
    }

    for (let i = 0; i < iterations; i++) {
      const utxos = await getUTXOs(changeAddress);
      const sortedUtxos = utxos.sort((a, b) =>
        a.satoshis > b.satoshis ? -1 : 1
      );
      const u = head(sortedUtxos);
      if (!u) {
        console.log("no utxo");
        return;
      }
      switch (selectedTab) {
        case InscriptionTab.Image:
          return await inscribeImage(u);
        case InscriptionTab.Text:
          return await inscribeText(u);
        case InscriptionTab.BSV20:
          return await inscribeBsv20(u);
        default:
          return;
      }
    }
  }, [
    getUTXOs,
    changeAddress,
    inscribeBsv20,
    inscribeImage,
    inscribeText,
    ordAddress,
    payPk,
    selectedTab,
  ]);
  const clickInscribe = useCallback(async () => {
    if (!payPk || !ordAddress || !changeAddress) {
      return;
    }

    const utxos = await getUTXOs(changeAddress);
    const sortedUtxos = utxos.sort((a, b) =>
      a.satoshis > b.satoshis ? -1 : 1
    );
    const u = head(sortedUtxos);
    if (!u) {
      console.log("no utxo");
      return;
    }
    switch (selectedTab) {
      case InscriptionTab.Image:
        return await inscribeImage(u);
      case InscriptionTab.Text:
        return await inscribeText(u);
      case InscriptionTab.BSV20:
        return await inscribeBsv20(u);
      default:
        return;
    }
  }, [
    getUTXOs,
    changeAddress,
    inscribeBsv20,
    inscribeImage,
    inscribeText,
    ordAddress,
    payPk,
    selectedTab,
  ]);

  const artifact = useMemo(() => {
    return (
      selectedFile?.type &&
      preview && (
        <Artifact
          classNames={{ media: "w-full h-full" }}
          contentType={selectedFile.type}
          src={preview as string}
        />
      )
    );
  }, [preview, selectedFile?.type]);

  const changeLimit = useCallback(
    (e: any) => {
      setLimit(e.target.value);
    },
    [setLimit]
  );

  const changeDecimals = useCallback(
    (e: any) => {
      setDecimals(parseInt(e.target.value));
    },
    [setDecimals]
  );

  const changeAmount = useCallback(
    (e: any) => {
      if (selectedActionType === ActionType.Mint && selectedBsv20?.lim) {
        if (parseInt(e.target.value) <= parseInt(selectedBsv20.lim)) {
          setAmount(e.target.value);
        }
        return;
      }
      // exclude 0
      if (parseInt(e.target.value) !== 0) {
        setAmount(e.target.value);
      }
    },
    [selectedBsv20, selectedActionType, setAmount]
  );

  const changeText = useCallback(
    (e: any) => {
      setText(e.target.value);
    },
    [setText]
  );

  const changeTicker = useCallback(
    (e: any) => {
      setTicker(e.target.value);
      if (mintError) setMintError(undefined);
    },
    [setTicker, mintError]
  );

  const checkTicker = useCallback(
    async (tick: string, expectExist: boolean, event?: any) => {
      if (!tick || tick.length === 0) {
        setTickerAvailable(false);
        return;
      }
      try {
        setFetchTickerStatus(FetchStatus.Loading);
        const resp = await fetch(`${API_HOST}/api/bsv20/${tick}`);

        if (resp.status === 200) {
          if (!expectExist) {
            // prevent form from submitting
            event.preventDefault();
            setTickerAvailable(false);
          } else if (expectExist) {
            const bsv20 = (await resp.json()) as BSV20;

            console.log(
              "selected BSV20",
              { bsv20 },
              parseInt(bsv20.supply!) < parseInt(bsv20.max!)
            );
            setSelectedBsv20(bsv20);
            if (
              !!bsv20 &&
              bsv20.max !== undefined &&
              bsv20.supply !== undefined &&
              parseInt(bsv20.supply) < parseInt(bsv20.max)
            ) {
              setTickerAvailable(true);
            } else {
              setTickerAvailable(false);
              setMintError("Minted Out");
            }
          }
        } else if (resp.status === 404) {
          console.log("ticker not found", tick, "expectExist", expectExist);
          if (expectExist) {
            setTickerAvailable(false);
            setSelectedBsv20(undefined);
          } else {
            setTickerAvailable(true);
          }
        }
        setFetchTickerStatus(FetchStatus.Success);
      } catch (e) {
        console.error({ e });
        setFetchTickerStatus(FetchStatus.Error);
      }
    },
    [setSelectedBsv20, setTickerAvailable, setFetchTickerStatus]
  );

  const changeMaxSupply = useCallback(
    (e: any) => {
      setMaxSupply(e.target.value);
    },
    [setMaxSupply]
  );

  const changeSelectedActionType = useCallback(
    async (e: any) => {
      console.log({ val: e.target.value });
      const actionType = e.target.value.toLowerCase() as ActionType;
      setSelectedActionType(actionType);
      if (ticker) {
        await checkTicker(ticker, actionType === ActionType.Mint);
      }
    },
    [setSelectedActionType, ticker, checkTicker]
  );

  // Define the debounced function outside of the render method
  const debouncedCheckTicker = debounce(async (event, expectExist) => {
    await checkTicker(event.target.value, expectExist, event);
  }, 300); // This is a common debounce time. Adjust as needed.

  const inSync = useMemo(() => {
    return (
      fetchStatsStatus !== FetchStatus.Loading &&
      stats &&
      stats.settled + 6 >= stats.latest
    );
  }, [fetchStatsStatus, stats]);

  const changeIterations = useCallback(
    (e: any) => {
      console.log("changing iterations to", e.target.value);
      setIterations(parseInt(e.target.value));
    },
    [setIterations]
  );

  const tickerNote = useMemo(() => {
    return tickerAvailable === false
      ? selectedActionType === ActionType.Deploy
        ? ticker === ""
          ? `¯\\_(ツ)_/¯`
          : "Ticker Unavailable"
        : mintError
      : inSync
      ? "1-4 Characters"
      : selectedActionType === ActionType.Deploy
      ? "Syncing. May already be deployed."
      : "Syncing. May be minted out.";
  }, [ticker, mintError, selectedActionType, tickerAvailable, inSync]);

  const totalTokens = useMemo(() => {
    return iterations * parseInt(amount || "0");
  }, [amount, iterations]);

  return (
    <div
      className={`${
        className ? className : ""
      } flex flex-col w-full mx-auto p-4`}
    >
      <InscriptionTabs currentTab={selectedTab || InscriptionTab.Image} />
      <div className="w-full">
        <form>
          {(!selectedTab || selectedTab === InscriptionTab.Image) && (
            <Label
              className={`${
                selectedFile
                  ? ""
                  : "min-h-[300px] min-w-[360px] md:min-w-[420px]"
              } rounded border border-dashed border-[#222] flex items-center justify-center`}
            >
              {!selectedFile && (
                <TbClick className="text-6xl my-4 text-[#555]" />
              )}
              {selectedFile ? selectedFile.name : "Choose a file to inscribe"}
              <Input
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              {selectedFile && (
                <div className="text-sm text-center w-full">
                  {formatBytes(selectedFile.size)} Bytes
                </div>
              )}
            </Label>
          )}

          {selectedTab === InscriptionTab.Text && (
            <div className="w-full min-w-[25vw]">
              <textarea
                className="w-full rounded min-h-[20vh] p-2"
                onChange={changeText}
                value={text}
              />
            </div>
          )}

          {selectedTab === InscriptionTab.BSV20 && (
            <div className="w-full min-w-[25vw]">
              <select
                className="text-white w-full p-2 rounded my-2 cursor-pointer"
                value={selectedActionType}
                onChange={changeSelectedActionType}
              >
                <option value={ActionType.Deploy}>Deploy New Ticker</option>
                <option value={ActionType.Mint}>Mint Existing Ticker</option>
              </select>
              <div className="my-2">
                <label className="block mb-4">
                  {/* TODO: Autofill */}
                  <div className="flex items-center justify-between my-2">
                    Ticker <span className="text-[#555]">{tickerNote}</span>
                  </div>
                  <div className="relative">
                    <input
                      className="text-white w-full rounded p-2 uppercase"
                      maxLength={4}
                      pattern="^\S+$"
                      onKeyDown={(event) => {
                        if (event.key === " " || event.key === "Enter") {
                          event.preventDefault();
                          return;
                        }
                      }}
                      value={ticker}
                      onChange={(event) => {
                        changeTicker(event);
                        debouncedCheckTicker(
                          event,
                          selectedActionType === ActionType.Mint
                        );
                      }}
                    />

                    {tickerAvailable === true && !inSync && (
                      <div className="absolute right-0 bottom-0 mb-2 mr-2">
                        <IoMdWarning />
                      </div>
                    )}

                    {tickerAvailable === true && inSync && (
                      <div className="absolute right-0 bottom-0 mb-2 mr-2">
                        <CheckmarkIcon />
                      </div>
                    )}
                    {tickerAvailable === false && (
                      <div className="absolute right-0 bottom-0 mb-2 mr-2">
                        <ErrorIcon />
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {selectedActionType === ActionType.Deploy && (
                <div className="my-2">
                  <label className="block mb-4">
                    <div className="my-2">Max Supply</div>
                    <input
                      pattern="\d+"
                      type="text"
                      className="text-white w-full rounded p-2 uppercase"
                      onChange={changeMaxSupply}
                      value={maxSupply}
                    />
                  </label>
                </div>
              )}

              {selectedActionType === ActionType.Mint && (
                <React.Fragment>
                  <div className="my-2">
                    <label className="block mb-4">
                      <div className="my-2 flex justify-between items-center">
                        Amount{" "}
                        {selectedBsv20 && (
                          <span
                            className="text-[#555] cursor-pointer transition hover:text-[#777]"
                            onClick={() => {
                              setAmount(
                                selectedBsv20?.lim && selectedBsv20.lim !== "0"
                                  ? selectedBsv20.lim
                                  : selectedBsv20.max
                              );
                            }}
                          >
                            Max:{" "}
                            {selectedBsv20?.lim && selectedBsv20.lim !== "0"
                              ? selectedBsv20.lim
                              : selectedBsv20?.max}
                          </span>
                        )}
                      </div>

                      <input
                        disabled={!!mintError}
                        className="text-white w-full rounded p-2"
                        type="number"
                        min={1}
                        max={selectedBsv20?.lim}
                        onChange={changeAmount}
                        value={amount}
                        onFocus={(event) =>
                          checkTicker(
                            ticker,
                            selectedActionType === ActionType.Mint,
                            event
                          )
                        }
                      />
                    </label>
                  </div>
                  <div>
                    {bsv20Balances &&
                      !Object.keys(bsv20Balances)?.some(
                        (b) => b.toUpperCase() === "BULK"
                      ) && (
                        <div className="p-2 bg-[#111] my-2 rounded">
                          Acquire{" "}
                          <span
                            className="font-mono text-blue-400 hover:text-blue-500 cursor-pointer"
                            onClick={() => {
                              Router.push(
                                "/inscribe?tab=bsv20&tick=BULK&op=mint"
                              );
                            }}
                          >
                            BULK
                          </span>{" "}
                          to enable bulk minting.
                        </div>
                      )}
                    <label className="block mb-4">
                      <div className="my-2 flex justify-between items-center">
                        <div>Iterations</div>
                        <div className="opacity-75 text-purple-400 font-mono flex items-center">
                          <RiMagicFill className="mr-2" />
                          BULK
                        </div>
                      </div>
                      <input
                        className="text-white w-full rounded p-2"
                        type="text"
                        onChange={changeIterations}
                        value={iterations}
                        max={30}
                      />
                    </label>
                    {/* TODO: Display accurately at end of supply */}
                    {amount && ticker && (
                      <div className="bg-[#111] text-[#555] rounded p-2">
                        You will recieve {totalTokens} {ticker.toUpperCase()}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              )}

              {selectedActionType === ActionType.Deploy && (
                <div className="my-2">
                  <label className="block mb-4">
                    <div className="flex items-center justify-between my-2">
                      Limit Per Mint{" "}
                      <span className="text-[#555]">Optional</span>
                    </div>
                    <input
                      className="text-white w-full rounded p-2"
                      type="string"
                      value={limit}
                      pattern="^\S+$"
                      onKeyDown={(event) => {
                        if (event.key === " " || event.key === "Enter") {
                          event.preventDefault();
                        }
                      }}
                      onChange={changeLimit}
                    />
                  </label>
                </div>
              )}

              {selectedActionType === ActionType.Deploy &&
                !showOptionalFields && (
                  <div
                    className="my-2 flex items-center justify-end cursor-pointer text-blue-500 hover:text-blue-400 transition"
                    onClick={toggleOptionalFields}
                  >
                    <RiSettings2Fill className="mr-2" /> More Options
                  </div>
                )}

              {selectedActionType === ActionType.Deploy &&
                showOptionalFields && (
                  <div className="my-2">
                    <label className="block mb-4">
                      <div className="my-2 flex items-center justify-between">
                        Decimal Precision
                      </div>
                      <input
                        className="text-white w-full rounded p-2"
                        type="number"
                        min={0}
                        max={18}
                        value={decimals}
                        onChange={changeDecimals}
                      />
                    </label>
                  </div>
                )}
            </div>
          )}
        </form>

        {preview && <hr className="my-2 h-2 border-0 bg-[#222]" />}

        {selectedFile && preview && <>{artifact}</>}

        {/* {selectedFile?.type.startsWith("video") ? (
          <video
          src={preview as string}
          autoPlay={true}
          controls={true}
          loop={true}
          className="w-full"
          />
          ) : selectedFile?.type.startsWith("audio") ? (
            <audio
            src={preview as string}
            autoPlay
            controls
            className="w-full"
            />
            ) : (
              <img src={preview as string} alt="Preview" className="w-full" />
              )}
              
              </>
            )} */}

        {preview && <hr className="my-2 h-2 border-0 bg-[#222]" />}
        <button
          disabled={submitDisabled}
          type="submit"
          onClick={bulkEnabled && iterations > 1 ? bulkInscribe : clickInscribe}
          className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
        >
          {selectedTab === InscriptionTab.BSV20 ? (
            fetchTickerStatus === FetchStatus.Loading ? (
              <div className="flex items-center justify-center">
                <LoaderIcon />
              </div>
            ) : bulkEnabled && iterations > 1 ? (
              "Bulk Inscribe"
            ) : (
              "Preview"
            )
          ) : (
            "Preview"
          )}
        </button>
      </div>
    </div>
  );
};

export default Inscribe;

const handleInscribing = async (
  payPk: string,
  fileAsBase64: string,
  fileContentType: string,
  ordAddress: string,
  changeAddress: string,
  fundingUtxo: Utxo
) => {
  const paymentPk = PrivateKey.from_wif(payPk);

  // inscription
  const inscription = {
    dataB64: fileAsBase64,
    contentType: fileContentType,
  };

  // const idKey = PrivateKey.from_wif(
  //   "L1tFiewYRivZciv146HnCPBWzV35BR65dsJWZBYkQsKJ8UhXLz6q"
  // );
  try {
    const tx = await createOrdinal(
      fundingUtxo,
      ordAddress,
      paymentPk,
      changeAddress,
      0.9,
      inscription
      // undefined // optional metadata
      // idKey // optional id key
    );
    return tx;
  } catch (e) {
    throw e;
  }
};

const maxMaxSupply = BigInt("18446744073709551615");
const bulkEnabled = false;
