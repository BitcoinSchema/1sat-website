"use client";

/**
 * Wallet Diagnostic Page
 * 
 * This page provides detailed diagnostics for wallet-toolbox integration testing.
 * It shows wallet state, connection status, balance, and allows testing operations.
 */

import { useState, useEffect } from "react";
import { PrivateKey } from "@bsv/sdk";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";
import { wifToRootKeyHex, wifToAddress } from "@/lib/keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DiagnosticItem {
  label: string;
  value: string | number | boolean | null | undefined;
  status?: "success" | "warning" | "error" | "info";
}

function DiagnosticRow({ item }: { item: DiagnosticItem }) {
  const statusColors = {
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{item.label}</span>
      <div className="flex items-center gap-2">
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded max-w-[300px] truncate">
          {item.value === null ? "null" : item.value === undefined ? "undefined" : String(item.value)}
        </code>
        {item.status && (
          <span className={`w-2 h-2 rounded-full ${statusColors[item.status]}`} />
        )}
      </div>
    </div>
  );
}

export default function WalletDiagnosticPage() {
  const wallet = useWallet();
  const toolbox = useWalletToolbox();

  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingToolbox, setIsTestingToolbox] = useState(false);

  // Derived values
  const payAddress = wallet.walletKeys?.payPk
    ? wifToAddress(wallet.walletKeys.payPk)
    : null;
  const ordAddress = wallet.walletKeys?.ordPk
    ? wifToAddress(wallet.walletKeys.ordPk)
    : null;
  const rootKeyHex = wallet.walletKeys?.payPk
    ? wifToRootKeyHex(wallet.walletKeys.payPk)
    : null;

  // Test wallet-toolbox initialization
  const testToolboxInit = async () => {
    setIsTestingToolbox(true);
    setTestResults([]);

    const results: string[] = [];

    try {
      results.push("Starting wallet-toolbox initialization test...");

      if (!wallet.walletKeys?.payPk) {
        results.push("❌ No wallet keys available - unlock wallet first");
        setTestResults(results);
        setIsTestingToolbox(false);
        return;
      }

      results.push(`✅ Pay key available: ${payAddress?.slice(0, 8)}...`);
      results.push(`✅ Ord key available: ${ordAddress?.slice(0, 8)}...`);
      results.push(`✅ Root key hex length: ${rootKeyHex?.length} chars`);

      // Try to initialize wallet-toolbox
      if (!toolbox.isInitialized) {
        results.push("🔄 Initializing wallet-toolbox...");
        const success = await toolbox.initializeWallet(rootKeyHex!, ordAddress!);

        if (success) {
          results.push("✅ Wallet-toolbox initialized successfully!");
          results.push(`✅ Identity key: ${toolbox.identityKey?.slice(0, 16)}...`);
        } else {
          results.push("❌ Wallet-toolbox initialization failed");
        }
      } else {
        results.push("✅ Wallet-toolbox already initialized");
        results.push(`✅ Identity key: ${toolbox.identityKey?.slice(0, 16)}...`);
      }

      // Test balance refresh
      results.push("🔄 Refreshing balance...");
      await toolbox.refreshBalance();
      results.push(`✅ Balance: ${toolbox.balance?.total ?? 0} sats`);
      results.push(`✅ Ordinals: ${toolbox.ordinals.length} items`);

    } catch (error) {
      results.push(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    setTestResults(results);
    setIsTestingToolbox(false);
  };

  // Provider diagnostics
  const walletProviderDiagnostics: DiagnosticItem[] = [
    { label: "Has Wallet", value: wallet.hasWallet, status: wallet.hasWallet ? "success" : "warning" },
    { label: "Is Locked", value: wallet.isWalletLocked, status: wallet.isWalletLocked ? "warning" : "success" },
    { label: "Is Initialized", value: wallet.isWalletInitialized, status: wallet.isWalletInitialized ? "success" : "info" },
    { label: "Is Syncing", value: wallet.isSyncing, status: wallet.isSyncing ? "info" : "success" },
    { label: "Wallet Service", value: wallet.walletService ? "Connected" : "Not Connected", status: wallet.walletService ? "success" : "warning" },
    { label: "Pay Address", value: payAddress, status: payAddress ? "success" : "warning" },
    { label: "Ord Address", value: ordAddress, status: ordAddress ? "success" : "warning" },
    { label: "Root Key Hex", value: rootKeyHex ? `${rootKeyHex.slice(0, 16)}...` : null, status: rootKeyHex ? "success" : "warning" },
  ];

  const toolboxDiagnostics: DiagnosticItem[] = [
    { label: "Is Initialized", value: toolbox.isInitialized, status: toolbox.isInitialized ? "success" : "warning" },
    { label: "Is Initializing", value: toolbox.isInitializing, status: toolbox.isInitializing ? "info" : "success" },
    { label: "Init Error", value: toolbox.initError, status: toolbox.initError ? "error" : "success" },
    { label: "Chain", value: toolbox.chain, status: "info" },
    { label: "Identity Key", value: toolbox.identityKey ? `${toolbox.identityKey.slice(0, 16)}...` : null, status: toolbox.identityKey ? "success" : "warning" },
    { label: "Wallet Instance", value: toolbox.wallet ? "Created" : "Not Created", status: toolbox.wallet ? "success" : "warning" },
    { label: "Services", value: toolbox.services ? "Connected" : "Not Connected", status: toolbox.services ? "success" : "warning" },
    { label: "Storage Manager", value: toolbox.storageManager ? "Active" : "Not Active", status: toolbox.storageManager ? "success" : "warning" },
  ];

  const balanceDiagnostics: DiagnosticItem[] = [
    { label: "Legacy Balance (confirmed)", value: wallet.balance?.confirmed ?? 0, status: "info" },
    { label: "Legacy Balance (unconfirmed)", value: wallet.balance?.unconfirmed ?? 0, status: "info" },
    { label: "Legacy Balance (total)", value: wallet.balance?.total ?? 0, status: "info" },
    { label: "Toolbox Balance (total)", value: toolbox.balance?.total ?? 0, status: "info" },
    { label: "Ordinals Count", value: toolbox.ordinals.length, status: "info" },
    { label: "Exchange Rate", value: wallet.exchangeRate, status: wallet.exchangeRate ? "success" : "warning" },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallet Diagnostics</h1>
          <p className="text-muted-foreground">Debug and test wallet-toolbox integration</p>
        </div>
        <Badge variant={wallet.isWalletLocked ? "destructive" : "default"}>
          {wallet.isWalletLocked ? "Locked" : "Unlocked"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Legacy Wallet Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legacy Wallet Provider</CardTitle>
            <CardDescription>Current wallet-provider.tsx state</CardDescription>
          </CardHeader>
          <CardContent>
            {walletProviderDiagnostics.map((item, i) => (
              <DiagnosticRow key={i} item={item} />
            ))}
          </CardContent>
        </Card>

        {/* Wallet Toolbox Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wallet Toolbox Provider</CardTitle>
            <CardDescription>New wallet-toolbox-provider.tsx state</CardDescription>
          </CardHeader>
          <CardContent>
            {toolboxDiagnostics.map((item, i) => (
              <DiagnosticRow key={i} item={item} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Balance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Balance Comparison</CardTitle>
          <CardDescription>Compare balances between legacy and toolbox providers</CardDescription>
        </CardHeader>
        <CardContent>
          {balanceDiagnostics.map((item, i) => (
            <DiagnosticRow key={i} item={item} />
          ))}
        </CardContent>
      </Card>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Actions</CardTitle>
          <CardDescription>Run diagnostic tests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={testToolboxInit}
              disabled={isTestingToolbox || wallet.isWalletLocked}
            >
              {isTestingToolbox ? "Testing..." : "Test Toolbox Init"}
            </Button>
            <Button
              variant="outline"
              onClick={() => toolbox.refreshBalance()}
              disabled={!toolbox.isInitialized}
            >
              Refresh Toolbox Balance
            </Button>
            <Button
              variant="outline"
              onClick={() => wallet.syncWallet()}
              disabled={wallet.isWalletLocked}
            >
              Sync Legacy Wallet
            </Button>
          </div>

          {testResults.length > 0 && (
            <>
              <Separator />
              <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                {testResults.map((result, i) => (
                  <div key={i}>{result}</div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
