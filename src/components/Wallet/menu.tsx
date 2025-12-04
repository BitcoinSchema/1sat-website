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
import { Loader2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
    <>
      <DropdownMenu open={showDropdown.value} onOpenChange={(open) => { showDropdown.value = open; }}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none hover:bg-zinc-800 hover:text-green-400"
            title="Wallet"
          >
            <FaWallet className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {payPk.value && ordPk.value && (
            <>
              {/* Balance Section */}
              <div className="px-3 py-4 text-center border-b border-zinc-800">
                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">
                  Balance
                </div>
                <div className="text-2xl font-mono text-zinc-100 mb-1">
                  {balance.value === undefined ? (
                    ""
                  ) : usdRate.value > 0 ? (
                    `$${(balance.value / usdRate.value).toFixed(2)}`
                  ) : (
                    <Loader2 className="animate-spin inline-flex w-4 h-4" />
                  )}
                  <span className="text-xs text-zinc-500 ml-1">USD</span>
                </div>
                <div className="text-zinc-500 text-sm">
                  {toBitcoin(balance.value)} <span className="text-xs">BSV</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 p-3 border-b border-zinc-800">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 text-xs font-mono uppercase tracking-wider bg-green-900/30 text-green-400 border border-green-500/50 hover:bg-green-900/50 transition"
                  onClick={() => {
                    showDepositModal.value = true;
                    showDropdown.value = false;
                  }}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  disabled={usdRate.value <= 0 || balance.value === 0}
                  className="flex-1 px-3 py-2 text-xs font-mono uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    showWithdrawalModal.value = true;
                    showDropdown.value = false;
                  }}
                >
                  Withdraw
                </button>
              </div>

              <DropdownMenuLabel>1Sat Wallet</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/wallet/ordinals">Ordinals</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/wallet/bsv20">BSV20</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/wallet/bsv21">BSV21</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onMouseEnter={mouseEnterOrdAddress}
                onMouseLeave={mouseLeaveOrdAddress}
                onClick={(e) => {
                  e.preventDefault();
                  copy(ordAddress.value || "");
                  toast.success("Copied Ordinals Address");
                  showDropdown.value = false;
                }}
                className="justify-between"
              >
                {ordAddressHover.value
                  ? `${ordAddress.value?.slice(0, 8)}...${ordAddress.value?.slice(-8)}`
                  : "Ordinals Address"}
                <FaCopy className="text-zinc-600 w-3 h-3" />
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Keys</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleImportWallet}>
                Import Wallet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={backupKeys}>
                Export Keys
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-red-400/50 hover:text-red-400 focus:text-red-400">
                <Link href="/wallet/delete">Sign Out</Link>
              </DropdownMenuItem>
            </>
          )}

          {hasUnprotectedKeys.value && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleProtectKeys}
                className="justify-between bg-yellow-900/30 text-yellow-400 focus:bg-yellow-900/50 focus:text-yellow-300"
              >
                Protect Your Keys
                <FaExclamationCircle className="w-4 h-4" />
              </DropdownMenuItem>
            </>
          )}

          {!payPk.value && !ordPk.value && (
            <>
              {showUnlockWalletButton.value && (
                <DropdownMenuItem onClick={handleUnlockWallet} className="justify-between">
                  Unlock Wallet
                  <FaUnlock className="w-4 h-4" />
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="justify-between">
                <Link href="/wallet/create">
                  Create New Wallet
                  <FaPlus className="w-4 h-4" />
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportWallet} className="justify-between">
                Import Wallet
                <FaFileImport className="w-4 h-4" />
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
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
