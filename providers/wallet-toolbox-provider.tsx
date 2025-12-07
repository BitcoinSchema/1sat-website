"use client";

/**
 * Wallet Toolbox Provider
 * 
 * This provider integrates @bsv/wallet-toolbox for BRC-100 compliant wallet operations.
 * Based on bsv-desktop's WalletContext.tsx patterns.
 * 
 * Key components from wallet-toolbox:
 * - Wallet: The main BRC-100 wallet class
 * - WalletStorageManager: Manages storage providers
 * - Services: Network service abstraction
 * - StorageIdb: IndexedDB storage for browser
 * - WalletSigner: Transaction signing
 */

import {
  CachedKeyDeriver,
  PrivateKey,
} from "@bsv/sdk";
// Use client-specific exports for browser compatibility
// The main index.js requires Node.js dependencies like dotenv
import {
  Wallet,
  WalletStorageManager,
  Services,
  WalletSigner,
  SetupClient,
  StorageIdb,
} from "@bsv/wallet-toolbox/out/src/index.client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GorillaPoolService, type Ordinal } from "@/lib/wallet/gorillapool-service";
import { WalletAPI } from "@/lib/wallet/WalletAPI";
import { OneSatOverlayService } from "@/lib/wallet/OneSatOverlayService";
import { ChainService } from "@/lib/wallet/chain-service";

// TODO: Phase 3 - Remove GorillaPoolService once overlay sync is verified

// Types
type Chain = "main" | "test";

interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

interface WalletToolboxContextValue {
  // Wallet state
  wallet: Wallet | null;
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;
  chain: Chain;
  identityKey: string | null;

  // Balance
  balance: WalletBalance | null;
  ordinals: Ordinal[];

  // Actions
  initializeWallet: (rootKeyHex: string, ordAddress?: string) => Promise<boolean>;
  destroyWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;

  // Internal services (exposed for advanced usage)
  services: Services | null;
  storageManager: WalletStorageManager | null;
}

const WalletToolboxContext = createContext<WalletToolboxContextValue | undefined>(undefined);

interface WalletToolboxProviderProps {
  children: ReactNode;
  chain?: Chain;
  databaseName?: string;
  // Optional: auto-initialize with these keys
  autoInitRootKeyHex?: string;
  autoInitOrdAddress?: string;
}

export function WalletToolboxProvider({
  children,
  chain = "main",
  databaseName = "1sat-wallet",
  autoInitRootKeyHex,
  autoInitOrdAddress,
}: WalletToolboxProviderProps) {
  // Core wallet state
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [services, setServices] = useState<Services | null>(null);
  const [storageManager, setStorageManager] = useState<WalletStorageManager | null>(null);
  const [identityKey, setIdentityKey] = useState<string | null>(null);

  // UI state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Balance state
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [ordinals, setOrdinals] = useState<Ordinal[]>([]);

  // Services for external API calls
  const gorillaPoolService = useMemo(() => new GorillaPoolService(), []);
  const walletAPI = useMemo(() => new WalletAPI(chain === "main" ? "mainnet" : "testnet"), [chain]);
  const chainService = useMemo(() => new ChainService(chain === "main" ? "mainnet" : "testnet"), [chain]);

  // Store ord address for ordinal lookups
  const [ordAddress, setOrdAddress] = useState<string | null>(null);

  /**
   * Initialize the wallet with a root key
   * 
   * Following bsv-desktop pattern:
   * 1. Create KeyDeriver from root key
   * 2. Create Services for network operations
   * 3. Create WalletStorageManager with StorageIdb
   * 4. Create WalletSigner
   * 5. Create Wallet
   */
  const initializeWallet = useCallback(async (
    rootKeyHex: string,
    ordAddressParam?: string
  ): Promise<boolean> => {
    if (isInitializing || isInitialized) {
      console.warn("[WalletToolbox] Already initializing or initialized");
      return false;
    }

    setIsInitializing(true);
    console.log("[WalletToolbox] Starting wallet initialization...");

    try {
      // Use SetupClient.createWalletIdb for browser-compatible wallet setup
      const result = await SetupClient.createWalletIdb({
        chain,
        rootKeyHex,
        databaseName,
      });

      const { wallet: newWallet, storage, services: newServices, identityKey: newIdentityKey } = result;

      setWallet(newWallet);
      setServices(newServices);
      setStorageManager(storage);
      setIdentityKey(newIdentityKey);
      setOrdAddress(ordAddressParam || null);
      setIsInitialized(true);
      setInitError(null);

      console.log("[WalletToolbox] Wallet initialized successfully");
      console.log("[WalletToolbox] Identity Key:", newIdentityKey);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[WalletToolbox] Failed to initialize wallet:", error);
      setInitError(errorMessage);
      setIsInitialized(false);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [chain, databaseName, isInitializing, isInitialized]);

  // Auto-initialize when keys are provided via props
  useEffect(() => {
    if (autoInitRootKeyHex && !isInitialized && !isInitializing) {
      console.log("[WalletToolbox] Auto-initializing with provided keys...");
      initializeWallet(autoInitRootKeyHex, autoInitOrdAddress);
    }
  }, [autoInitRootKeyHex, autoInitOrdAddress, isInitialized, isInitializing, initializeWallet]);

  /**
   * Destroy the wallet and clear all state
   */
  const destroyWallet = useCallback(async () => {
    console.log("[WalletToolbox] Destroying wallet...");

    // Clear state
    setWallet(null);
    setServices(null);
    setStorageManager(null);
    setIdentityKey(null);
    setOrdAddress(null);
    setIsInitialized(false);
    setBalance(null);
    setOrdinals([]);

    console.log("[WalletToolbox] Wallet destroyed");
  }, []);

  /**
   * Refresh balance from 1sat overlay and ordinals
   */
  const refreshBalance = useCallback(async () => {
    if (!wallet || !isInitialized) {
      console.warn("[WalletToolbox] Cannot refresh balance - wallet not initialized");
      return;
    }

    try {
      // Use 1sat overlay to get balance and ordinals
      if (ordAddress) {
        // Create overlay service with wallet addresses
        const overlayService = new OneSatOverlayService(
          identityKey || ordAddress, // Use identity key as account name
          [ordAddress] // Owner addresses
        );

        // Get balance from overlay
        const overlayBalance = await overlayService.getBalance(true);
        if (overlayBalance) {
          setBalance(overlayBalance);
          console.log("[WalletToolbox] Balance from overlay:", overlayBalance);
        }

        // Get ordinals from overlay
        const overlayOrdinals = await overlayService.getOrdinals(100);
        const mappedOrdinals: Ordinal[] = overlayOrdinals.map(txo => ({
          txid: txo.txid || txo.outpoint.split("_")[0],
          vout: txo.vout ?? parseInt(txo.outpoint.split("_")[1], 10),
          satoshis: txo.satoshis ?? 1,
          script: txo.script || "",
          owner: ordAddress,
          data: txo.data,
        }));
        setOrdinals(mappedOrdinals);
        console.log(`[WalletToolbox] Ordinals from overlay: ${mappedOrdinals.length}`);
      } else {
        // Fallback to wallet-toolbox internal storage
        const outputs = await wallet.listOutputs({
          basket: "default",
          include: "locking scripts",
        });

        let total = 0;
        if (outputs.outputs) {
          for (const output of outputs.outputs) {
            if (output.spendable) {
              total += output.satoshis || 0;
            }
          }
        }

        setBalance({
          confirmed: total,
          unconfirmed: 0,
          total,
        });
      }
    } catch (error) {
      console.error("[WalletToolbox] Failed to refresh balance:", error);
    }
  }, [wallet, isInitialized, ordAddress, identityKey]);

  // Auto-refresh balance when wallet is initialized
  useEffect(() => {
    if (isInitialized && wallet) {
      refreshBalance();
    }
  }, [isInitialized, wallet, refreshBalance]);

  const value = useMemo<WalletToolboxContextValue>(() => ({
    wallet,
    isInitialized,
    isInitializing,
    initError,
    chain,
    identityKey,
    balance,
    ordinals,
    initializeWallet,
    destroyWallet,
    refreshBalance,
    services,
    storageManager,
  }), [
    wallet,
    isInitialized,
    isInitializing,
    initError,
    chain,
    identityKey,
    balance,
    ordinals,
    initializeWallet,
    destroyWallet,
    refreshBalance,
    services,
    storageManager,
  ]);

  return (
    <WalletToolboxContext.Provider value={value}>
      {children}
    </WalletToolboxContext.Provider>
  );
}

export function useWalletToolbox() {
  const context = useContext(WalletToolboxContext);
  if (context === undefined) {
    throw new Error("useWalletToolbox must be used within a WalletToolboxProvider");
  }
  return context;
}
