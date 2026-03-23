"use client";

import { Check, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DownloadInfo } from "./page";

type Platform = "macos" | "windows" | "other";

function detectPlatform(): Platform {
	if (typeof navigator === "undefined") return "macos";
	const ua = navigator.userAgent.toLowerCase();
	if (ua.includes("win")) return "windows";
	if (ua.includes("mac")) return "macos";
	return "other";
}

function AppleLogo({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 384 512"
			fill="currentColor"
			className={className}
			aria-hidden="true"
		>
			<path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
		</svg>
	);
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DownloadPageClientProps {
	macos: DownloadInfo | null;
	windows: DownloadInfo | null;
}

export function DownloadPageClient({
	macos,
	windows,
}: DownloadPageClientProps) {
	const [platform, setPlatform] = useState<Platform>("macos");

	useEffect(() => {
		setPlatform(detectPlatform());
	}, []);

	const version = macos?.version ?? "0.0.1";
	const macUrl = macos?.url ?? "/download/macos";

	return (
		<div className="relative">
			{/* Hero */}
			<section className="pt-16 md:pt-24 pb-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
							Download{" "}
							<span className="text-primary">1Sat</span> Wallet
						</h1>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
							A native BSV wallet with Touch ID, on-chain browsing,
							and a built-in indexer. Your keys never leave the Secure Enclave.
						</p>

						{/* Download buttons */}
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
							<Button
								size="lg"
								className="gap-3 h-14 px-8 text-base"
								asChild
							>
								<a href={macUrl}>
									<AppleLogo className="h-5 w-5" />
									<div className="text-left">
										<div className="text-xs opacity-80">
											Download for
										</div>
										<div className="font-semibold">macOS</div>
									</div>
								</a>
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="gap-3 h-14 px-8 text-base"
								disabled
							>
								<div className="text-left">
									<div className="text-xs opacity-80">
										Coming soon for
									</div>
									<div className="font-semibold">
										Windows & Linux
									</div>
								</div>
							</Button>
						</div>

						<p className="text-sm text-muted-foreground">
							Version {version}
							{macos?.size ? ` (${formatBytes(macos.size)})` : null}{" "}
							&middot; Requires macOS 12+ &middot; Apple Silicon
						</p>
					</div>
				</div>
			</section>

			{/* Quick Start Guide */}
			<section className="py-16 bg-muted/30">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-center mb-12">
						Get started in 3 steps
					</h2>

					<div className="grid md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
								1
							</div>
							<h3 className="font-semibold mb-2">Install</h3>
							<p className="text-sm text-muted-foreground">
								Download the DMG, drag to Applications, and open
								1Sat Wallet
							</p>
						</div>

						<div className="text-center">
							<div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
								2
							</div>
							<h3 className="font-semibold mb-2">
								Create or Import
							</h3>
							<p className="text-sm text-muted-foreground">
								Generate a new wallet or import an existing
								mnemonic. Your keys are protected by Touch ID.
							</p>
						</div>

						<div className="text-center">
							<div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
								3
							</div>
							<h3 className="font-semibold mb-2">
								Connect to BSV
							</h3>
							<p className="text-sm text-muted-foreground">
								The built-in indexer syncs the blockchain locally.
								Browse on-chain content and manage ordinals.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="py-16">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-center mb-12">
						What&apos;s Included
					</h2>

					<div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
						<div className="rounded-xl border bg-card p-6">
							<h3 className="font-semibold mb-2">
								Touch ID Key Protection
							</h3>
							<p className="text-sm text-muted-foreground">
								Private keys are encrypted in the macOS Secure
								Enclave. Unlock with Touch ID — keys never leave
								the hardware.
							</p>
						</div>

						<div className="rounded-xl border bg-card p-6">
							<h3 className="font-semibold mb-2">
								Built-in Browser
							</h3>
							<p className="text-sm text-muted-foreground">
								Browse on-chain inscriptions, dApps, and ORDFS
								content natively with per-origin permission
								scoping.
							</p>
						</div>

						<div className="rounded-xl border bg-card p-6">
							<h3 className="font-semibold mb-2">
								Local Indexer
							</h3>
							<p className="text-sm text-muted-foreground">
								1sat-stack runs as a sidecar, syncing the
								blockchain locally. No third-party APIs needed for
								core wallet operations.
							</p>
						</div>

						<div className="rounded-xl border bg-card p-6">
							<h3 className="font-semibold mb-2">
								BRC-100 Compatible
							</h3>
							<p className="text-sm text-muted-foreground">
								Full wallet interface spec support. Connect dApps
								via HTTP on standard ports with manifest-based
								trust.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* System Requirements */}
			<section className="py-16 bg-muted/30">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-center mb-12">
						System Requirements
					</h2>

					<div className="max-w-sm mx-auto">
						<div className="rounded-xl border bg-card p-6">
							<div className="flex items-center gap-3 mb-4">
								<AppleLogo className="h-5 w-5" />
								<h3 className="font-semibold">macOS</h3>
							</div>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-primary" />
									macOS 12 (Monterey) or later
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-primary" />
									Apple Silicon (M1+)
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-primary" />
									Touch ID for key protection
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-primary" />
									200 MB disk space
								</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ */}
			<section className="py-16">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
					<h2 className="text-2xl font-bold text-center mb-12">FAQ</h2>

					<div className="space-y-6">
						<div className="border-b pb-6">
							<h3 className="font-medium mb-2">
								How are my keys protected?
							</h3>
							<p className="text-sm text-muted-foreground">
								Your root key is encrypted using the macOS Secure
								Enclave (P-256 ECIES) and stored in the system
								keychain. It can only be decrypted with Touch ID
								biometric authentication. The key never exists
								unencrypted on disk.
							</p>
						</div>

						<div className="border-b pb-6">
							<h3 className="font-medium mb-2">
								What is the built-in indexer?
							</h3>
							<p className="text-sm text-muted-foreground">
								1sat-stack is a local BSV indexing server that
								syncs blockchain data to your machine. It serves
								ORDFS content, tracks your UTXOs, and provides
								the data layer for wallet operations — all without
								relying on external services.
							</p>
						</div>

						<div className="border-b pb-6">
							<h3 className="font-medium mb-2">
								Can I browse on-chain content?
							</h3>
							<p className="text-sm text-muted-foreground">
								Yes. The built-in browser loads inscriptions and
								dApps via the 1sat:// protocol. Each inscription
								gets its own permission scope so on-chain apps
								request wallet access independently.
							</p>
						</div>

						<div className="border-b pb-6">
							<h3 className="font-medium mb-2">
								Will Windows and Linux be supported?
							</h3>
							<p className="text-sm text-muted-foreground">
								Yes. The wallet is built on Electrobun which
								supports all platforms. macOS with Apple Silicon
								is the first release target, with Windows and
								Linux coming next.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-20 bg-gradient-to-b from-background via-primary/5 to-background">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold mb-4">
							Ready to get started?
						</h2>
						<p className="text-muted-foreground mb-8">
							Download 1Sat Wallet and take control of your BSV.
						</p>
						<div className="flex items-center justify-center gap-4">
							<Button size="lg" className="gap-2" asChild>
								<a href={macUrl}>
									<Download className="h-5 w-5" />
									Download for macOS
								</a>
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="gap-2"
								asChild
							>
								<a
									href="https://github.com/b-open-io/1sat-sdk"
									target="_blank"
									rel="noopener noreferrer"
								>
									View on GitHub
									<ExternalLink className="h-4 w-4" />
								</a>
							</Button>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
