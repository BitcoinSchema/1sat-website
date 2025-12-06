"use client";

import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { Loader2, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  FaCopy,
  FaExclamationCircle,
  FaFileImport,
  FaPlus,
  FaUnlock,
  FaWallet,
} from "react-icons/fa";
import { FaHashtag } from "react-icons/fa6";
import { toBitcoin, toSatoshi } from "satoshi-token";
import { useCopyToClipboard } from "usehooks-ts";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MARKET_API_HOST, OLD_ORD_PK_KEY, OLD_PAY_PK_KEY } from "@/constants";
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
  utxos,
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
import * as http from "../utils/httpClient";
import DepositModal from "./modal/deposit";
import { EnterPassphraseModal } from "./modal/enterPassphrase";
import ImportWalletModal from "./modal/importWallet";
import ProtectKeysModal from "./modal/protectKeys";
import WithdrawalModal from "./modal/withdrawal";
import { ThemeToggle } from "./header/ThemeToggle";

export function AppSidebar({ side = "left", ...props }: React.ComponentProps<typeof Sidebar>) {
  useSignals();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();
  const [_pendingTxs, _setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    [],
  );
  const [eb] = useLocalStorage("encryptedBackup", undefined);

  const fetchRateStatus = useSignal("idle");
  const showWithdrawalModal = useSignal(false);
  const showImportWalletModal = useSignal(false);
  const showProtectKeysModal = useSignal(false);

  const [_value, copy] = useCopyToClipboard();
  const ordAddressHover = useSignal(false);

  const mouseEnterOrdAddress = () => {
    ordAddressHover.value = true;
  };

  const mouseLeaveOrdAddress = () => {
    ordAddressHover.value = false;
  };

  useEffect(() => {
    loadKeysFromSessionStorage();

    if (eb && !encryptedBackup.value) {
      console.log("showing unlock wallet button on purpose");
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
          `${MARKET_API_HOST}/user/${address}/balance`,
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
      fetchRateStatus.value = "loading";
      const statusUrl = `${MARKET_API_HOST}/status`;
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
      fetchRateStatus.value = "success";
      chainInfo.value = info;
      usdRate.value = toSatoshi(1) / er;
      exchangeRate.value = er;
      indexers.value = indx;
    };
    if (fetchRateStatus.value === "idle") {
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

  const handleUnlockWallet = () => {
    showUnlockWalletModal.value = true;
    if (isMobile) setOpenMobile(false);
  };

  const handleImportWallet = () => {
    showImportWalletModal.value = true;
    if (isMobile) setOpenMobile(false);
  };

  const handleProtectKeys = () => {
    showProtectKeysModal.value = true;
    if (isMobile) setOpenMobile(false);
  };

  const handleFileChange = async (e: FileEvent) => {
    if (payPk.value || ordPk.value) {
      const c = confirm(
        "Are you sure you want to import this wallet? Doing so will replace your existing keys so be sure to back them up first.",
      );
      if (!c) {
        return;
      }
    }
    await loadKeysFromBackupFiles(e.target.files[0]);
    if (isMobile) setOpenMobile(false);
    router?.push("/wallet");
  };

  const handleNavigation = (href: string) => {
    if (isMobile) setOpenMobile(false);
    router.push(href);
  };

  return (
    <>
      <Sidebar side={side} collapsible="offcanvas" variant="sidebar" {...props}>
        <SidebarHeader>
          <div className="px-4 py-3">
            <h2 className="text-lg font-semibold">1Sat Menu</h2>
            <p className="text-sm text-muted-foreground">
              Navigate and manage your wallet
            </p>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Market</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {exchangeRate.value > 0 && (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <span>1 BSV = ${exchangeRate.value.toFixed(2)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleNavigation("/market/ordinals")}>
                    <FaHashtag />
                    <span>Ordinals</span>
                    <span className="ml-auto text-xs text-muted-foreground">NFT</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleNavigation("/collection")}>
                    <Store />
                    <span>Collections</span>
                    <span className="ml-auto text-xs text-muted-foreground">NFT</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleNavigation("/market/bsv20")}>
                    <FaHashtag />
                    <span>BSV20</span>
                    <span className="ml-auto text-xs text-muted-foreground">FT</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleNavigation("/market/bsv21")}>
                    <FaHashtag />
                    <span>BSV21</span>
                    <span className="ml-auto text-xs text-muted-foreground">FT</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Wallet Status</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-4 py-2 text-sm text-muted-foreground">
                {payPk.value && ordPk.value
                  ? "Connected"
                  : hasUnprotectedKeys.value
                    ? "Unprotected Keys"
                    : "No Wallet"}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          {payPk.value && ordPk.value && (
            <SidebarGroup>
              <SidebarGroupLabel>1Sat Wallet</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-4 py-3 text-sm rounded-md bg-sidebar-accent text-sidebar-foreground space-y-1 mx-2">
                  <div className="text-2xl font-mono font-semibold">
                    {balance.value === undefined ? (
                      "..."
                    ) : usdRate.value > 0 ? (
                      `$${(balance.value / usdRate.value).toFixed(2)}`
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </div>
                  <div className="text-muted-foreground font-mono">
                    {toBitcoin(balance.value)} BSV
                  </div>
                </div>

                <SidebarMenu className="mt-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        showDepositModal.value = true;
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <FaWallet />
                      <span>Deposit</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      disabled={usdRate.value <= 0 || balance.value === 0}
                      onClick={() => {
                        showWithdrawalModal.value = true;
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <FaWallet />
                      <span>Withdraw</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>

                <Separator className="my-2" />

                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => handleNavigation("/wallet/ordinals")}>
                      <FaWallet />
                      <span>Ordinals</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => handleNavigation("/wallet/bsv20")}>
                      <FaHashtag />
                      <span>BSV20</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => handleNavigation("/wallet/bsv21")}>
                      <FaHashtag />
                      <span>BSV21</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onMouseEnter={mouseEnterOrdAddress}
                      onMouseLeave={mouseLeaveOrdAddress}
                      onClick={(e) => {
                        e.preventDefault();
                        copy(ordAddress.value || "");
                        toast.success("Copied Ordinals Address");
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <FaCopy />
                      <span>
                        {ordAddressHover.value
                          ? `${ordAddress.value?.slice(0, 8)}...${ordAddress.value?.slice(-8)}`
                          : "Ordinals Address"}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>

                <Separator className="my-2" />

                <SidebarGroupLabel>Keys</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleImportWallet}>
                      <FaFileImport />
                      <span>Import</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        backupKeys();
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <FaWallet />
                      <span>Export</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="text-red-400 hover:text-red-500"
                      onClick={() => handleNavigation("/wallet/delete")}
                    >
                      <FaUnlock />
                      <span>Sign Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {hasUnprotectedKeys.value && (
            <SidebarGroup>
              <SidebarGroupLabel>Security</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleProtectKeys}>
                      <FaExclamationCircle />
                      <span>Protect Your Keys</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {!payPk.value && !ordPk.value && (
            <SidebarGroup>
              <SidebarGroupLabel>Wallet</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {showUnlockWalletButton.value && (
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleUnlockWallet}>
                        <FaUnlock />
                        <span>Unlock Wallet</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => handleNavigation("/wallet/create")}>
                      <FaPlus />
                      <span>Create New Wallet</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleImportWallet}>
                      <FaFileImport />
                      <span>Import Wallet</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Modals */}
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
}
