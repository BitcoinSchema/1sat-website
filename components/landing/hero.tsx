"use client";

import { ArrowRight, Globe, Shield, Smartphone, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";
import { EncryptionGrid } from "@/components/landing/encryption-grid";
import { ThreeBoundary } from "@/components/landing/three-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSound } from "@/hooks/use-sound";
import { useWallet } from "@/providers/wallet-provider";

function StaticLogo() {
	return (
		<div className="flex h-[280px] items-center justify-center md:h-[360px]">
			<Image
				alt="1Sat Wallet"
				fetchPriority="high"
				height={160}
				priority
				src="/oneSatLogoDark.svg"
				width={160}
			/>
		</div>
	);
}

const Logo3D = dynamic(
	() => import("@/components/landing/logo-3d").then(({ Logo3D }) => Logo3D),
	{ ssr: false, loading: StaticLogo },
);

export function LandingHero() {
	const { hasWallet } = useWallet();
	const { play } = useSound();
	const useStaticLogo = useMediaQuery(
		"(max-width: 767px), (prefers-reduced-motion: reduce)",
		{ initializeWithValue: false },
	);

	return (
		<div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background selection:bg-primary/20">
			{/* Background Layers */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
			<EncryptionGrid />

			<div className="relative z-10 text-center w-full animate-in fade-in duration-1000">
				{/* Hero Content */}
				<div>
					<ThreeBoundary>
						{useStaticLogo ? <StaticLogo /> : <Logo3D />}
					</ThreeBoundary>

					<p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
						Satoshi's favorite asset wallet.
						<br />
						Use it here or connect a compatible wallet.{" "}
						<span className="text-primary">One BRC-100 interface.</span>
					</p>
				</div>

				{/* CTAs */}
				<div className="max-w-6xl mx-auto p-4">
					<div className="flex flex-col sm:flex-row items-center justify-center gap-6">
						<Button
							className="shadow-[0_0_20px_-5px_var(--primary)] hover:shadow-[0_0_30px_-5px_var(--primary)] transition-all duration-300 scale-100 hover:scale-105 font-bold"
							asChild
							onClick={() => play("click")}
						>
							{hasWallet ? (
								<Link href="/wallet">
									<Wallet className="mr-2 w-6 h-6" /> Browser Wallet
								</Link>
							) : (
								<Link href="/wallet">
									<Wallet className="mr-2 w-6 h-6" /> Choose Wallet
								</Link>
							)}
						</Button>
						<Button
							variant="outline"
							className="border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
							asChild
							onClick={() => play("click")}
						>
							<Link href="/download">
								Apple App <ArrowRight className="ml-2 w-6 h-6" />
							</Link>
						</Button>
					</div>

					{/* Feature Grid */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
						<Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-colors group">
							<CardHeader>
								<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
									<Globe className="w-6 h-6 text-primary" />
								</div>
								<CardTitle className="text-xl">Browser Wallet</CardTitle>
							</CardHeader>
							<CardContent className="text-muted-foreground">
								Create a wallet in this browser. Keys stay on this device. You
								can start now.
							</CardContent>
						</Card>

						<Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-colors group">
							<CardHeader>
								<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
									<Smartphone className="w-6 h-6 text-primary" />
								</div>
								<CardTitle className="text-xl">Apple App</CardTitle>
							</CardHeader>
							<CardContent className="text-muted-foreground">
								Native app for iPhone, iPad, and Mac. Open it from TestFlight.
								iCloud Keychain holds the seed.
							</CardContent>
						</Card>

						<Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-colors group">
							<CardHeader>
								<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
									<Shield className="w-6 h-6 text-primary" />
								</div>
								<CardTitle className="text-xl">BRC-100 Connections</CardTitle>
							</CardHeader>
							<CardContent className="text-muted-foreground">
								Connect 1Sat Desktop, Yours, or another compatible wallet
								without importing its keys into this site.
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
