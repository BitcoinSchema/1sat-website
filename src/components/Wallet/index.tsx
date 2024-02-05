"use client";

import { API_HOST } from "@/constants";
import {
  bsv20Balances,
  bsvWasmReady,
  chainInfo,
  indexers,
  ordPk,
  payPk,
  pendingTxs,
  usdRate,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { loadKeysFromBackupFiles } from "@/signals/wallet/client";
import { BSV20Balance } from "@/types/bsv20";
import { ChainInfo, IndexerStats } from "@/types/common";
import { PendingTransaction } from "@/types/preview";
import { getUtxos } from "@/utils/address";
import { useLocalStorage } from "@/utils/storage";
import { computed, effect } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import init from "bsv-wasm-web";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect } from "react";
import toast from "react-hot-toast";
import { FaCopy, FaWallet } from "react-icons/fa6";
import { toBitcoin, toSatoshi } from "satoshi-bitcoin-ts";
import { useCopyToClipboard } from "usehooks-ts";
import * as http from "../../utils/httpClient";
import DepositModal from "../modal/deposit";
import WithdrawalModal from "../modal/withdrawal";
let initAttempted = false;

const Wallet: React.FC = () => {
  useSignals();
  const router = useRouter();
  const [localPayPk, setLocalPayPk] = useLocalStorage<string>("1satfk");
  const [localOrdPk, setLocalOrdPk] = useLocalStorage<string>("1satok");
  const showDepositModal = useSignal(false);
  const showWithdrawalModal = useSignal(false);

  const [value, copy] = useCopyToClipboard();

  // useEffect needed so that we can use localStorage
  useEffect(() => {
    if (bsvWasmReady.value && localPayPk && localOrdPk) {
      payPk.value = localPayPk
      ordPk.value = localOrdPk
      const localTxsStr = localStorage.getItem("1satpt");
      const localTxs = localTxsStr ? JSON.parse(localTxsStr) : null;
      if (localTxs) {
        pendingTxs.value = localTxs as PendingTransaction[];
      }
    }
  }, [bsvWasmReady.value]);

  const balance = computed(() => {
    if (!utxos.value) {
      return 0;
    }
    return utxos.value.reduce((acc, utxo) => acc + utxo.satoshis, 0);
  });

  effect(() => {
    const address = ordAddress.value;
    const fire = async () => {
      bsv20Balances.value = [];
      try {
        const { promise } = http.customFetch<BSV20Balance[]>(
          `${API_HOST}/api/bsv20/${address}/balance`
        );
        const u = await promise;
        bsv20Balances.value = u.sort((a, b) => {
          return b.all.confirmed + b.all.pending >
            a.all.confirmed + a.all.pending
            ? 1
            : -1;
        });

        const statusUrl = `https://1sat-api-production.up.railway.app/status`;
        const { promise: promiseStatus } = http.customFetch<{
          exchangeRate: number;
          chainInfo: ChainInfo;
          indexers: IndexerStats;
        }>(statusUrl);
        const {
          chainInfo: info,
          exchangeRate,
          indexers: indx,
        } = await promiseStatus;
        console.log({ info, exchangeRate, indexers });
        chainInfo.value = info;
        usdRate.value = toSatoshi(1) / exchangeRate;
        indexers.value = indx;
      } catch (e) {
        console.log(e);
      }
    };

    if (bsvWasmReady.value && address && !bsv20Balances.value) {
      fire();
    }
  });

  useEffect(() => {
    const fire = async (a: string) => {
      utxos.value = [];
      utxos.value = await getUtxos(a);
    };

    if (bsvWasmReady.value && fundingAddress && !utxos.value) {
      const address = fundingAddress.value;
      if (address) {
        fire(address);
      }
    }
  }, [bsvWasmReady.value, fundingAddress.value, utxos.value]);

  effect(() => {
    const fire = async () => {
      await init();
      bsvWasmReady.value = true;
    };
    if (!initAttempted && bsvWasmReady.value === false) {
      initAttempted = true;
      fire();
    }
  });

  const importKeys = () => {
    const el = document.getElementById("backupFile");
    el?.click();
    return;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      console.log("handleFileChange called", e.target.files[0]);

      await loadKeysFromBackupFiles(e.target.files[0]);
      router?.push("/wallet");
    }
  };

  const backupKeys = (e?: any) => {
    var dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify({ payPk: payPk.value, ordPk: ordPk.value })
      );

    const clicker = document.createElement("a");
    clicker.setAttribute("href", dataStr);
    clicker.setAttribute("download", "1sat.json");
    clicker.click();
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        className="btn btn-ghost m-1 rounded relative"
        tabIndex={0}
        role="button"
      >
        <FaWallet />
      </div>

      <div className="dropdown-content z-[20] menu shadow bg-base-100 rounded-box w-64">
        <div className="text-center mb-2">
          <div>Balance</div>
          <div className="text-2xl font-mono">
            {toBitcoin(balance.value)} <span className="text-lg">BSV</span>
          </div>
        </div>

        <div className="flex gap-2 justify-center items-center">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => (showDepositModal.value = true)}
          >
            Deposit
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => (showWithdrawalModal.value = true)}
          >
            Withdraw
          </button>
        </div>
        <div className="divider">Inventory</div>

        <ul className="p-0">
          <li className="ml-2">
            <Link href="/wallet/ordinals">Ordinals</Link>
          </li>
          <li className="ml-2">
            <Link href="/wallet/bsv20">BSV20</Link>
          </li>
          <li className="ml-2">
            <Link href="/wallet/bsv20v2">BSV21</Link>
          </li>
          <div className="divider">Keys</div>
          <li>
            <button onClick={importKeys}>Import Keys</button>
          </li>
          <li>
            <button onClick={backupKeys}>Export Keys</button>
          </li>
          <div className="divider">Addresses</div>
          <li>
            <button
              className={`flex items-center justify-between w-full`}
              onClick={() => {
                copy(fundingAddress.value || "");
                toast.success("Copied Funding Address");
              }}
            >
              Bitcoin SV Address <FaCopy className="text-[#333]" />
            </button>
          </li>
          <li>
            <button
              className={`flex items-center justify-between w-full`}
              onClick={(e) => {
                e.preventDefault();
                copy(ordAddress.value || "");
                console.log("Copied", ordAddress.value);
                toast.success("Copied Ordinals Address");
              }}
            >
              Ordinals Address <FaCopy className="text-[#333]" />
            </button>
          </li>
        </ul>
      </div>
      {showDepositModal.value && (
        <DepositModal onClose={() => (showDepositModal.value = false)} />
      )}
      {showWithdrawalModal.value && (
        <WithdrawalModal onClose={() => (showWithdrawalModal.value = false)} />
      )}
      <input
        accept=".json"
        className="hidden"
        id="backupFile"
        onChange={handleFileChange}
        type="file"
      />
    </div>
  );
};

export default Wallet;
