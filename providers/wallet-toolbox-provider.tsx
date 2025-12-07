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

  // Balance and assets
  balance: WalletBalance | null;
  ordinals: Ordinal[];
  bsv20Tokens: TokenBalance[];
  bsv21Tokens: TokenBalance[];

  // Actions
  initializeWallet: (rootKeyHex: string, ordAddress?: string, payAddress?: string) => Promise<boolean>;
  destroyWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;

  // Internal services (exposed for advanced usage)
  services: Services | null;
  storageManager: WalletStorageManager | null;
}

// Token balance interface
interface TokenBalance {
  outpoint: string;
  txid: string;
  vout: number;
  data?: any;
  height?: number;
}

const WalletToolboxContext = createContext<WalletToolboxContextValue | undefined>(undefined);

interface WalletToolboxProviderProps {
  children: ReactNode;
  chain?: Chain;
  databaseName?: string;
  // Optional: auto-initialize with these keys
  autoInitRootKeyHex?: string;
  autoInitOrdAddress?: string;
  autoInitPayAddress?: string;
}

export function WalletToolboxProvider({
  children,
  chain = "main",
  databaseName = "1sat-wallet",
  autoInitRootKeyHex,
  autoInitOrdAddress,
  autoInitPayAddress,
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
  const [bsv20Tokens, setBsv20Tokens] = useState<TokenBalance[]>([]);
  const [bsv21Tokens, setBsv21Tokens] = useState<TokenBalance[]>([]);

  // Services for external API calls
  const gorillaPoolService = useMemo(() => new GorillaPoolService(), []);
  const walletAPI = useMemo(() => new WalletAPI(chain === "main" ? "mainnet" : "testnet"), [chain]);
  const chainService = useMemo(() => new ChainService(chain === "main" ? "mainnet" : "testnet"), [chain]);

  // Store wallet addresses for ordinal and balance lookups
  const [ordAddress, setOrdAddress] = useState<string | null>(null);
  const [payAddress, setPayAddress] = useState<string | null>(null);

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
    ordAddressParam?: string,
    payAddressParam?: string
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
      setPayAddress(payAddressParam || null);
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
      initializeWallet(autoInitRootKeyHex, autoInitOrdAddress, autoInitPayAddress);
    }
  }, [autoInitRootKeyHex, autoInitOrdAddress, autoInitPayAddress, isInitialized, isInitializing, initializeWallet]);

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
        // Collect all wallet addresses (remove duplicates)
        const allAddresses = [ordAddress];
        if (payAddress && payAddress !== ordAddress) {
          allAddresses.push(payAddress);
        }
        console.log("[WalletToolbox] Refreshing for addresses:", allAddresses);

        // Create overlay service with ALL wallet addresses
        const overlayService = new OneSatOverlayService(
          identityKey || ordAddress, // Use identity key as account name
          allAddresses // All owner addresses
        );

        // Get balance from overlay
        const overlayBalance = await overlayService.getBalance(true);
        if (overlayBalance) {
          setBalance(overlayBalance);
          console.log("[WalletToolbox] Balance from overlay:", overlayBalance);
        }

        // Get ALL ordinals and tokens in a single efficient fetch
        const { ordinals: overlayOrdinals, tokens: overlayTokens } = await overlayService.getAllOrdinalsAndTokens();

        // Map ordinals
        const mappedOrdinals: Ordinal[] = overlayOrdinals.map(txo => ({
          txid: txo.txid || txo.outpoint.split("_")[0],
          vout: txo.vout ?? parseInt(txo.outpoint.split("_")[1], 10),
          satoshis: txo.satoshis ?? 1,
          script: txo.script || "",
          owner: ordAddress,
          data: txo.data,
        }));
        setOrdinals(mappedOrdinals);
        console.log(`[WalletToolbox] Ordinals from overlay: ${mappedOrdinals.length} (NFTs)`);

        // Map tokens (all in bsv21 since we can't distinguish without fetching inscription content)
        const mapToken = (txo: any): TokenBalance => ({
          outpoint: txo.outpoint,
          txid: txo.txid || txo.outpoint.split("_")[0],
          vout: txo.vout ?? parseInt(txo.outpoint.split("_")[1], 10),
          data: txo.data,
          height: txo.height,
        });

        setBsv20Tokens([]); // No easy way to distinguish BSV20 vs BSV21 yet
        setBsv21Tokens(overlayTokens.map(mapToken));
        console.log(`[WalletToolbox] Tokens from overlay: ${overlayTokens.length} (BSV20/BSV21 combined)`);
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
  }, [wallet, isInitialized, ordAddress, payAddress, identityKey]);

  // Auto-refresh balance when wallet is initialized and address is available
  useEffect(() => {
    if (isInitialized && wallet && ordAddress) {
      console.log("[WalletToolbox] Auto-refreshing balance for addresses:", ordAddress, payAddress);
      refreshBalance();
    }
  }, [isInitialized, wallet, ordAddress, payAddress, refreshBalance]);

  const value = useMemo<WalletToolboxContextValue>(() => ({
    wallet,
    isInitialized,
    isInitializing,
    initError,
    chain,
    identityKey,
    balance,
    ordinals,
    bsv20Tokens,
    bsv21Tokens,
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
    bsv20Tokens,
    bsv21Tokens,
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
