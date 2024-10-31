"use client";

import { FetchStatus, MARKET_API_HOST, OLD_ORD_PK_KEY, OLD_PAY_PK_KEY } from "@/constants";
import {
  bsv20Balances,
  chainInfo,
  encryptedBackup,
  exchangeRate,
  hasUnprotectedKeys,
  indexers,
  ordPk,
  payPk,
  showDepositModal,
  showUnlockWalletButton,
  showUnlockWalletModal,
  usdRate,
  utxos
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import {
  loadKeysFromBackupFiles,
  loadKeysFromSessionStorage,
} from "@/signals/wallet/client";
import type { BSV20Balance } from "@/types/bsv20";
import type { ChainInfo, IndexerStats } from "@/types/common";
import type { FileEvent } from "@/types/file";
import type { PendingTransaction } from "@/types/preview";
import { getUtxos } from "@/utils/address";
import { useIDBStorage, useLocalStorage } from "@/utils/storage";
import { backupKeys } from "@/utils/wallet";
import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";
import {
  FaExclamationCircle,
  FaFileImport,
  FaPlus,
  FaUnlock,
} from "react-icons/fa";
import { FaCopy, FaWallet } from "react-icons/fa6";
import { toBitcoin, toSatoshi } from "satoshi-token";
import { useCopyToClipboard } from "usehooks-ts";
import * as http from "../../utils/httpClient";
import DepositModal from "../modal/deposit";
import { EnterPassphraseModal } from "../modal/enterPassphrase";
import ImportWalletModal from "../modal/importWallet";
import ProtectKeysModal from "../modal/protectKeys";
import WithdrawalModal from "../modal/withdrawal";

const WalletMenu: React.FC = () => {
  useSignals();
  const [pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    []
  );
  const router = useRouter();

  const fetchRateStatus = useSignal(FetchStatus.Idle);
  const showWithdrawalModal = useSignal(false);
  const showImportWalletModal = useSignal(false);
  const showProtectKeysModal = useSignal(false);
  const showDropdown = useSignal(false);

  const [eb] = useLocalStorage("encryptedBackup", undefined);

  const [value, copy] = useCopyToClipboard();
  const ordAddressHover = useSignal(false);

  const mouseEnterOrdAddress = () => {
    ordAddressHover.value = true;
  };

  const mouseLeaveOrdAddress = () => {
    console.log("mouseLeaveOrdAddress");
    ordAddressHover.value = false;
  };

  // useEffect needed so that we can use localStorage
  // useEffect(() => {
  //   if (payPk.value && ordPk.value) {
  //     const localTxsStr = localStorage.getItem("1satpt");
  //     const localTxs = localTxsStr ? JSON.parse(localTxsStr) : null;
  //     if (localTxs) {
  //       setPendingTxs(localTxs as PendingTransaction[]);
  //     }
  //   }
  // }, [ordPk.value, payPk.value, setPendingTxs]);

  useEffect(() => {
    loadKeysFromSessionStorage();

    if (eb && !encryptedBackup.value) {
      // TODO: This is triggering upon signout! Fix this
      // Reproduce: Sign in, encrypt backup
      // close tab and reopen
      // unlock wallet
      // sign out - this will fire forcing the unlock button to show again!
      console.log("showing unlock wallet button on purpose")
      showUnlockWalletButton.value = true;
    }
  }, [encryptedBackup.value, eb]);

  useEffect(() => {
    if (
      !!localStorage.getItem(OLD_PAY_PK_KEY) &&
      !!localStorage.getItem(OLD_ORD_PK_KEY)
    ) {
      hasUnprotectedKeys.value = true;
    }
  }, []);

  const balance = computed(() => {
    if (!utxos.value) {
      return 0;
    }
    return utxos.value.reduce((acc, utxo) => acc + utxo.satoshis, 0);
  });

  useEffect(() => {
    const address = ordAddress.value;
    const fire = async () => {
      bsv20Balances.value = [];
      try {
        const { promise } = http.customFetch<BSV20Balance[]>(
          `${MARKET_API_HOST}/user/${address}/balance`
        );
        const u = await promise;
        bsv20Balances.value = u.sort((a, b) => {
          return b.all.confirmed + b.all.pending >
            a.all.confirmed + a.all.pending
            ? 1
            : -1;
        });
      } catch (e) {
        console.log(e);
      }
    };

    if (address && !bsv20Balances.value) {
      fire();
    }
  }, [ordAddress.value, bsv20Balances.value]);

  useEffect(() => {
    const fire = async () => {
      fetchRateStatus.value = FetchStatus.Loading;
      const statusUrl =
        `${MARKET_API_HOST}/status`;
      const { promise: promiseStatus } = http.customFetch<{
        exchangeRate: number;
        chainInfo: ChainInfo;
        indexers: IndexerStats;
      }>(statusUrl);
      const {
        chainInfo: info,
        exchangeRate: er,
        indexers: indx,
      } = await promiseStatus;
      fetchRateStatus.value = FetchStatus.Success;
      // console.log({ info, exchangeRate, indexers });
      chainInfo.value = info;
      usdRate.value = toSatoshi(1) / er;
      exchangeRate.value = er;
      indexers.value = indx;
    }
    if (fetchRateStatus.value === FetchStatus.Idle) {
      fire();
    }
  }, [fetchRateStatus.value]);

  useEffect(() => {
    const fire = async (a: string) => {
      utxos.value = [];
      utxos.value = await getUtxos(a);
    };

    if (fundingAddress && !utxos.value) {
      const address = fundingAddress.value;
      if (address) {
        fire(address);
      }
    }
  }, [fundingAddress.value, utxos.value]);

  // const importKeys = (e: SyntheticEvent) => {
  // 	e.preventDefault();
  // 	const el = document.getElementById("backupFile");
  // 	el?.click();
  // 	return;
  // };

  const handleFileChange = async (e: FileEvent) => {
    console.log("handleFileChange called", e.target.files[0]);
    if (payPk.value || ordPk.value) {
      const c = confirm(
        "Are you sure you want to import this wallet? Doing so will replace your existing keys so be sure to back them up first."
      );
      if (!c) {
        return;
      }
    }
    await loadKeysFromBackupFiles(e.target.files[0]);
    showDropdown.value = false;
    router?.push("/wallet");
  };

  const handleUnlockWallet = () => {
    showUnlockWalletModal.value = true;
    showDropdown.value = false;
  };

  const handleImportWallet = () => {
    showImportWalletModal.value = true;
    showDropdown.value = false;
  };

  const handleProtectKeys = () => {
    showProtectKeysModal.value = true;
    showDropdown.value = false;
  };

  return (
    <ul className="dropdown dropdown-end">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <div
        className="btn btn-ghost m-1 rounded relative"
        tabIndex={0}
        role="button"
        onClick={() => {
          showDropdown.value = true;
        }}
      >
        <div className="tooltip tooltip-bottom" data-tip="Wallet">
          <FaWallet />
        </div>
      </div>
      {showDropdown.value && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <ul
          // biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
          tabIndex={0}
          onClick={() => {
            showDropdown.value = false;
          }}
          className="dropdown-content menu shadow border-yellow-200/25 bg-base-100 rounded-box w-64 border"
        >
          {payPk.value && ordPk.value && (
            <div>
              <div className="text-center mb-2">
                <div className="text-[#555] text-lg">
                  Balance
                </div>
                <div className="text-2xl font-mono my-2">
                  {balance.value === undefined ? (
                    "" // user has no wallet yet
                  ) : usdRate.value > 0 ? (
                    `$${(
                      balance.value / usdRate.value
                    ).toFixed(2)}`
                  ) : (
                    <CgSpinner className="animate-spin inline-flex w-4" />
                  )}
                  <span className="text-xs ml-1">USD</span>
                </div>
                <div className="text-[#555] my-2">
                  {toBitcoin(balance.value)}{" "}
                  <span className="text-xs">BSV</span>
                </div>
              </div>
              <div className="flex gap-2 justify-center items-center">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    showDepositModal.value = true;
                  }}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  disabled={
                    usdRate.value <= 0 ||
                    balance.value === 0
                  }
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    showWithdrawalModal.value = true;
                  }}
                >
                  Withdraw
                </button>
              </div>

              <div className="divider">1Sat Wallet</div>
              <ul className="p-0">
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <li
                  onClick={() => {
                    showDropdown.value = false;
                  }}
                >
                  <Link href="/wallet/ordinals" >
                    Ordinals
                  </Link>
                </li>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <li
                  onClick={() => {
                    showDropdown.value = false;
                  }}
                >
                  <Link href="/wallet/bsv20">BSV20</Link>
                </li>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <li
                  onClick={() => {
                    showDropdown.value = false;
                  }}
                >
                  <Link href="/wallet/bsv21">BSV21</Link>
                </li>
                <li
                  onMouseEnter={mouseEnterOrdAddress}
                  onMouseLeave={mouseLeaveOrdAddress}
                >
                  <button
                    type="button"
                    className={
                      "flex items-center justify-between w-full"
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      copy(ordAddress.value || "");
                      console.log(
                        "Copied",
                        ordAddress.value
                      );
                      toast.success(
                        "Copied Ordinals Address"
                      );
                      showDropdown.value = false;
                    }}
                  >
                    {ordAddressHover.value
                      ? `${ordAddress.value?.slice(
                        0,
                        8
                      )}...${ordAddress.value?.slice(
                        -8
                      )}`
                      : "Ordinals Address"}{" "}
                    <FaCopy className="text-[#333]" />
                  </button>
                </li>
              </ul>

              <div className="divider">Keys</div>
              <ul className="p-0">
                <li>
                  <button
                    type="button"
                    onClick={handleImportWallet}
                  >
                    Import Wallet
                  </button>
                </li>
                <li>
                  <button type="button" onClick={backupKeys}>
                    Export Keys
                  </button>
                </li>
                {/* <li>
                  <button
                    className="btn btn-sm btn-secondary"
                    type="button"
                    onClick={exportKeysViaFragment}
                  >
                    Migrate to 1Sat.Market
                  </button>
                </li> */}
                {/* <li className="hover:bg-error hover:text-error-content rounded transition opacity-25">
                <Link href="/wallet/swap">Swap Keys</Link>
              </li> */}
                <li className="hover:bg-error hover:text-error-content rounded transition opacity-25">
                  <Link href="/wallet/delete">Sign Out</Link>
                </li>
              </ul>
            </div>
          )}
          {hasUnprotectedKeys.value && (
            <li>
              <button
                type="button"
                className="flex w-full flex-row items-center justify-between bg-yellow-600 text-black hover:bg-yellow-500"
                onClick={handleProtectKeys}
              >
                Protect Your Keys
                <FaExclamationCircle className="w-4 h-4" />
              </button>
            </li>
          )}
          {!payPk.value && !ordPk.value && (
            <>
              {showUnlockWalletButton.value && (
                <ul className="p-0">
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                  <li onClick={handleUnlockWallet}>
                    <div className="flex w-full flex-row items-center justify-between">
                      Unlock Wallet
                      <FaUnlock className="w-4 h-4" />
                    </div>
                  </li>
                </ul>
              )}
              <ul className="p-0">
                <li>
                  <Link
                    href="/wallet/create"
                    className="flex w-full flex-row items-center justify-between"
                  >
                    Create New Wallet
                    <FaPlus className="w-4 h-4" />
                  </Link>
                </li>
              </ul>
              <ul className="p-0">
                <li>
                  <button
                    type="button"
                    onClick={handleImportWallet}
                    className="flex flex-row items-center justify-between w-full"
                  >
                    Import Wallet
                    <FaFileImport className="w-4 h-4" />
                  </button>
                </li>
              </ul>
            </>
          )}
        </ul>
      )}
      {showDepositModal.value && (
        <DepositModal
          onClose={() => {
            showDepositModal.value = false;
          }}
        />
      )}
      {showWithdrawalModal.value && (
        <WithdrawalModal
          onClose={() => {
            showWithdrawalModal.value = false;
          }}
        />
      )}
      <EnterPassphraseModal
        open={showUnlockWalletModal.value}
        onClose={() => {
          showUnlockWalletModal.value = false;
        }}
        onUnlock={() => {
          showUnlockWalletModal.value = false;
        }}
      />

      <ImportWalletModal
        open={showImportWalletModal.value}
        onClose={() => {
          showImportWalletModal.value = false;
        }}
      />

      <ProtectKeysModal
        open={showProtectKeysModal.value}
        onClose={() => {
          showProtectKeysModal.value = false;
        }}
      />

      <input
        accept=".json"
        className="hidden"
        id="backupFile"
        onChange={handleFileChange}
        type="file"
      />
    </ul>
  );
};

export default WalletMenu;

export const exportKeysViaFragment = () => {
  // redirect to https://1sat.market/wallet/import#import=<b64KeyBackupData>
  const fk = localStorage.getItem("1satfk");
  const ok = localStorage.getItem("1satok");
  let data = ""
  if (!fk || !ok) {
    if (!payPk.value || !ordPk.value) {
      toast.error("No keys to export. Encrypt your keys first.");
    }
    data = JSON.stringify({ payPk: payPk.value, ordPk: ordPk.value });
  } else {
    data = JSON.stringify({ payPk: JSON.parse(fk), ordPk: JSON.parse(ok) });
  }
  const b64 = btoa(data);
  const base = "http://localhost:3000" // "https://1sat.market"
  // window.location.href = `${base}/wallet/import#import=${b64}`;
}

export const swapKeys = () => {
  // swaps paypk with ordpk values
  const tempPayPk = payPk.value;
  const tempOrdPk = ordPk.value;
  if (!tempPayPk || !tempOrdPk) {
    return;
  }
  ordPk.value = tempPayPk;
  payPk.value = tempOrdPk;
  toast.success("Keys Swapped");
};
