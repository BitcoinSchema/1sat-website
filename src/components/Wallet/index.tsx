"use client";

import { API_HOST } from "@/constants";
import {
  bsv20Balances,
  bsvWasmReady,
  ordPk,
  payPk,
  pendingTxs,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { BSV20Balance } from "@/types/bsv20";
import { WocUtxo } from "@/types/common";
import { PendingTransaction } from "@/types/preview";
import { useLocalStorage } from "@/utils/storage";
import { computed, effect } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import init, { P2PKHAddress } from "bsv-wasm-web";
import Link from "next/link";
import { useEffect } from "react";
import { FaWallet } from "react-icons/fa6";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { useCopyToClipboard } from "usehooks-ts";
import * as http from "../../utils/httpClient";
import DepositModal from "../modal/deposit";
import WithdrawalModal from "../modal/withdrawal";

const Wallet: React.FC = () => {
  useSignals();
  const [localPayPk, setLocalPayPk] = useLocalStorage<string>("1satfk");
  const [localOrdPk, setLocalOrdPk] = useLocalStorage<string>("1satok");
  const showDepositModal = useSignal(false);
  const showWithdrawalModal = useSignal(false);

  const [value, copy] = useCopyToClipboard();

  // useEffect needed so that we can use localStorage
  useEffect(() => {
    if (bsvWasmReady) {
      payPk.value = localPayPk || null;
      ordPk.value = localOrdPk || null;

      const localTxsStr = localStorage?.getItem("1satpt");
      const localTxs = localTxsStr ? JSON.parse(localTxsStr) : null;
      if (localTxs) {
        pendingTxs.value = localTxs as PendingTransaction[];
      }
    }
  }, [bsvWasmReady]);

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
        bsv20Balances.value = u;
        
      } catch (e) {
        console.log(e);
      }
    };

    if (address && !bsv20Balances.value) {
      fire();
    }
  })
  effect(() => {
    const address = fundingAddress.value;
    const fire = async () => {
      utxos.value = [];
      try {
        const { promise } = http.customFetch<WocUtxo[]>(
          `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`
        );
        const u = await promise;

        utxos.value = u.map((u: WocUtxo) => {
          return {
            satoshis: u.value,
            txid: u.tx_hash,
            vout: u.tx_pos,
            script: P2PKHAddress.from_string(address!)
              .get_locking_script()
              .to_asm_string(),
          };
        });
      } catch (e) {
        console.log(e);
      }
    };

    if (address && !utxos.value) {
      fire();
    }
  });

  effect(() => {
    const fire = async () => {
      await init();
      bsvWasmReady.value = true;
    };
    if (bsvWasmReady.value === false) {
      fire();
    }
  });

  return (
    <div className="dropdown dropdown-end">
      <div
        className="btn btn-ghost m-1 rounded relative"
        tabIndex={0}
        role="button"
      >
        <FaWallet />
      </div>

      <div className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box w-64">
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
        <div className="divider" />

        <ul className="p-0">
          <li>
            <Link href="/wallet">Inventory</Link>
          </li>
          <li className="ml-2">
            <Link href="/wallet/ordinals">Ordinals</Link>
          </li>
          <li className="ml-2">
            <Link href="/wallet/bsv20">BSV20 (Open Mint)</Link>
          </li>
          <li className="ml-2">
            <Link href="/wallet/bsv20">BSV20 V2 (Issued)</Link>
          </li>
          <div className="divider" />
          <li>
            <Link href="/wallet/keys/import">Import Keys</Link>
          </li>
          <li>
            <Link href="/wallet/keys/export">Export Keys</Link>
          </li>
          <div className="divider" />
          <li>
            <div onClick={() => {copy(fundingAddress.value || "")}}>
              Copy Funding Address
            </div>
          </li>
          <li
            onClick={ (e) => {
              e.preventDefault();
              copy(ordAddress.value || "");
              console.log("Copied", ordAddress.value);
            }}
          >
            <div>Copy Ordinals Address</div>
          </li>
        </ul>
      </div>
      {showDepositModal.value && (
        <DepositModal onClose={() => (showDepositModal.value = false)} />
      )}
      {showWithdrawalModal.value && (
        <WithdrawalModal onClose={() => (showWithdrawalModal.value = false)} />
      )}
    </div>
  );
};

export default Wallet;
