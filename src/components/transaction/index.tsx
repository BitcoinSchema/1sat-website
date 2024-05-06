"use client"

import type { InputOutpoint } from "@/app/outpoint/[outpoint]/[tab]/page";
import { API_HOST } from "@/constants";
import { bsvWasmReady } from "@/signals/wallet";
import { Signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { Transaction } from "bsv-wasm-web";
import { useCallback, useEffect, useMemo, useState } from "react";
import OutpointHeading from "../pages/outpoint/heading";
import DisplayIO from "./display";

export const showDetails = new Signal<boolean>(undefined);

export interface TxDetailsProps {
  vout: number;
  txid: string;
  showing?: boolean;
}

const TxDetails = ({ txid, vout, showing }: TxDetailsProps) => {
  useSignals();
  const [rawtx, setRawtx] = useState<string | undefined>();
  const [inputOutpoints, setInputOutpoints] = useState<InputOutpoint[]>([]);
  const [outputSpends, setOutputSpends] = useState<string[]>([]);

  useEffect(() => {
    const fire = async () => {
      try {
        const response = await fetch(
          `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
        );
        const rawTx = await response.text();
        console.log("Setting rawtx");
        setRawtx(rawTx);

      } catch (e) {
        console.error(e);
      }
    };

    if (!rawtx && bsvWasmReady.value && txid && showDetails.value) {
      fire();
    }
  }, [bsvWasmReady.value, txid, showDetails.value]);


  useEffect(() => {
    const fire = async (rawTx: string) => {
      const tx = Transaction.from_hex(rawTx);
      const numInputs = tx.get_ninputs();
      const inputOutpointsData: InputOutpoint[] = [];
      for (let i = 0; i < numInputs; i++) {
        const input = tx.get_input(i);
        const txid = input?.get_prev_tx_id_hex()!;
        const vout = input?.get_vout()!;
        const url = `https://junglebus.gorillapool.io/v1/txo/get/${txid}_${vout}`;
        const spentOutpointResponse = await fetch(url, {
          headers: {
            Accept: "application/octet-stream",
          },
        });
        const res = await spentOutpointResponse.arrayBuffer();
        const { script, satoshis } = parseOutput(res);
        inputOutpointsData.push({ script, satoshis, txid, vout });
      }
      setInputOutpoints(inputOutpointsData);

      const outputOutpoints: string[] = [];
      const numOutputs = tx.get_noutputs();
      for (let i = 0; i < numOutputs; i++) {
        outputOutpoints.push(`${txid}_${i}`);
      }

      const outputSpendsResponse = await fetch(`${API_HOST}/api/spends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(outputOutpoints),
      });

      const outputSpendsData = ((await outputSpendsResponse.json()) || []).filter(
        (s: string) => s && s !== ""
      );
      setOutputSpends(outputSpendsData);

    }

    if (rawtx) {
      fire(rawtx);
    }
  }, [rawtx, setOutputSpends, setInputOutpoints]);

  const toggleDetails = useCallback(() => {
    showDetails.value = !showDetails.value;
    console.log({ showDetails: showDetails.value });
  }, [showDetails]);

  useMemo(() => {
    if (showDetails.value === undefined) {
      showDetails.value = showing !== false;
      showing = showDetails.value;
    }
  }, [showing, showDetails]);

  useEffect(() => {
    console.log({ showDetails: showDetails.value });
  }, [showDetails]);

  return (
    <>
      <div className="flex">
        <OutpointHeading outpoint={`${txid}_${vout}`} toggleDetails={toggleDetails} showing={showDetails.value} />
      </div>
      {showDetails.value && <DisplayIO
        rawtx={rawtx}
        inputOutpoints={inputOutpoints}
        outputSpends={outputSpends}
        vout={vout}
      />}
    </>
  );
};

export default TxDetails;


function parseOutput(output: ArrayBuffer): {
  satoshis: bigint;
  script: string;
} {
  // Extract the amount (8 bytes) and convert from little-endian format
  const view = new DataView(output);
  const satoshis = view.getBigUint64(0, true); // true for little-endian

  // Convert the rest of the buffer to hex and extract the script
  const hex = Buffer.from(output.slice(8)).toString("hex");
  const [scriptLength, remainingHex] = parseVarInt(hex);
  const script = remainingHex.substring(0, scriptLength * 2);

  return {
    satoshis: satoshis,
    script: script,
  };
}


function parseVarInt(hex: string): [number, string] {
  let len = 1;
  let value = Number.parseInt(hex.substring(0, 2), 16);

  if (value < 0xfd) {
    return [value, hex.substring(2)];
  }
  if (value === 0xfd) {
    len = 3;
  } else if (value === 0xfe) {
    len = 5;
  } else {
    len = 9;
  }

  value = Number.parseInt(hex.substring(2, len * 2), 16);
  return [value, hex.substring(len * 2)];
}
