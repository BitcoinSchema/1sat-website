import { PendingTransaction, useWallet } from "@/context/wallet";
import { addressFromWif } from "@/utils/address";
import { formatBytes } from "@/utils/bytes";
import { PrivateKey } from "bsv-wasm-web";
import { createOrdinal } from "js-1sat-ord";
import { head } from "lodash";
import { useRouter } from "next/router";
import React, { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
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

type BSV20 = {
  p: string;
  op: string;
  amount?: string;
  tick: string;
  max?: number;
  dec?: number;
  lim?: number;
};

enum ActionType {
  Mint = "mint",
  Deploy = "deploy",
}

type InscribeProps = {
  inscribedCallback: (inscription: PendingTransaction) => void;
};

const Inscribe: React.FC<InscribeProps> = ({ inscribedCallback }) => {
  const {
    setPendingTransaction,
    fundingUtxos,
    ordAddress,
    payPk,
    initialized,
  } = useWallet();

  const { tab } = useRouter().query as { tab: InscriptionTab };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const [selectedActionType, setSelectedActionType] = useState<ActionType>(
    ActionType.Deploy
  );
  const [selectedBsv20, setSelectedBsv20] = useState<BSV20>();
  const [limit, setLimit] = useState<string>("1000");
  const [maxSupply, setMaxSupply] = useState<string>("21000000");
  const [decimals, setDecimals] = useState<number>(0);
  const [amount, setAmount] = useState<string>();
  const [ticker, setTicker] = useState<string>();

  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);

  const changeAddress = useMemo(() => {
    if (initialized && payPk) {
      return addressFromWif(payPk);
    }
  }, [initialized, payPk]);

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
    [setPreview]
  );

  const utxo = useMemo(() => head(fundingUtxos), [fundingUtxos]);

  const inscribeImage = async () => {
    if (!selectedFile?.type) {
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
  };

  const inscribeText = async () => {
    setInscribeStatus(FetchStatus.Loading);

    console.log("TODO: Inscribe text");
    setInscribeStatus(FetchStatus.Success);
  };

  const inscribeBsv20 = async () => {
    if (ticker?.length === 0) {
      return;
    }

    setInscribeStatus(FetchStatus.Loading);

    try {
      let inscription = {
        p: "bsv-20",
        op: selectedActionType,
      } as any;

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

          inscription.max = maxSupply;
          inscription.decimals = decimals;

          break;
        case ActionType.Mint:
          if (
            !amount ||
            parseInt(amount) == 0 ||
            BigInt(amount) > maxMaxSupply
          ) {
            alert(
              `Invalid input: please enter a positive integer less than or equal to ${
                maxMaxSupply - BigInt(1)
              }`
            );
            return;
          }
          inscription.tick = selectedBsv20?.ticker;
          inscription.amount = amount;
        default:
          break;
      }

      const fileAsBase64 = Buffer.from(JSON.stringify(inscription)).toString(
        "base64"
      );
      const tx = await handleInscribing(
        payPk!,
        fileAsBase64,
        "application/bsv-20",
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
      };
      setPendingTransaction(result);
      inscribedCallback(result);

      setInscribeStatus(FetchStatus.Success);
    } catch (error) {
      setInscribeStatus(FetchStatus.Error);

      alert("Invalid max supply: please enter a number. " + error);
      return;
    }
  };

  const submitDisabled = useMemo(() => {
    switch (tab as InscriptionTab) {
      case InscriptionTab.Image:
        return !selectedFile || inscribeStatus === FetchStatus.Loading;
      case InscriptionTab.Text:
        return inscribeStatus === FetchStatus.Loading;
      case InscriptionTab.BSV20:
        return !ticker?.length || inscribeStatus === FetchStatus.Loading;
      default:
        return true;
    }
  }, [ticker, selectedFile, inscribeStatus]);

  const clickInscribe = async () => {
    if (!utxo || !payPk || !ordAddress || !changeAddress) {
      return;
    }
    switch (tab as InscriptionTab) {
      case InscriptionTab.Image:
        return inscribeImage();
      case InscriptionTab.Text:
        return inscribeText();
      case InscriptionTab.BSV20:
        return inscribeBsv20();
      default:
        return;
    }
  };

  const artifact = useMemo(() => {
    console.log({ artifactType: selectedFile?.type });
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

  console.log({ preview });

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
      setAmount(e.target.value);
    },
    [setAmount]
  );
  const changeTicker = useCallback(
    (e: any) => {
      setTicker(e.target.value);
    },
    [setTicker]
  );

  const changeMaxSupply = useCallback(
    (e: any) => {
      setMaxSupply(e.target.value);
    },
    [setMaxSupply]
  );

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto p-4">
      <InscriptionTabs currentTab={tab} />
      <div className="w-full">
        <form>
          {(!tab || tab === InscriptionTab.Image) && (
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

          {tab === InscriptionTab.Text && (
            <div className="w-full min-w-[25vw]">
              <textarea className="w-full rounded min-h-[20vh] p-2" />
            </div>
          )}

          {tab === InscriptionTab.BSV20 && (
            <div className="w-full min-w-[25vw]">
              <select
                className="w-full p-2 rounded my-2 cursor-pointer"
                value={selectedActionType}
                onChange={(e) => {
                  console.log({ val: e.target.value });
                  setSelectedActionType(
                    e.target.value.toLocaleLowerCase() as ActionType
                  );
                }}
              >
                <option value={ActionType.Deploy}>Deploy</option>
                <option value={ActionType.Mint}>Mint</option>
              </select>
              <div className="my-2">
                <label>
                  {/* TODO: Autofill */}
                  Ticker
                  <input
                    className="w-full rounded p-2 uppercase"
                    maxLength={4}
                    pattern="^\S+$"
                    onKeyDown={(event) => {
                      if (event.key === " " || event.key === "Enter") {
                        event.preventDefault();
                      }
                    }}
                    value={ticker}
                    onChange={changeTicker}
                  />
                </label>
              </div>

              <div className="my-2">
                <label>
                  Max Supply
                  <input
                    pattern="\d+"
                    type="text"
                    className="w-full rounded p-2 uppercase"
                    onChange={changeMaxSupply}
                    value={maxSupply}
                  />
                </label>
              </div>

              {selectedActionType === ActionType.Deploy && (
                <div className="my-2">
                  <label>
                    Limit Per Mint
                    <input
                      className="w-full rounded p-2"
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

              {selectedActionType === ActionType.Deploy && (
                <div className="my-2">
                  <label>
                    Decimal Precision
                    <input
                      className="w-full rounded p-2"
                      type="number"
                      min={0}
                      max={18}
                      value={decimals}
                      onChange={changeDecimals}
                    />
                  </label>
                </div>
              )}
              {selectedActionType === ActionType.Mint && (
                <div className="my-2">
                  <label>
                    Amount
                    <input
                      className="w-full rounded p-2"
                      type="number"
                      min={1}
                      max={selectedBsv20?.lim}
                      onChange={changeAmount}
                      value={amount}
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
          onClick={clickInscribe}
          className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
        >
          Preview
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
  fundingUtxo: any
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
      0.06,
      inscription,
      undefined // optional metadata
      // idKey // optional id key
    );
    return tx;
  } catch (e) {
    throw e;
  }
};

const maxMaxSupply = BigInt("18446744073709551615");
