"use client";

import { ArrowRight, Globe, Shield, Smartphone, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Particles } from "@/components/ui/particles";
import { useWallet } from "@/providers/wallet-provider";
import { SharedPresence } from "./shared-presence";

export function LandingHero() {
	const { hasWallet } = useWallet();

	return (
		<div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background selection:bg-primary/20">
			{/* Background Layers */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0" />
			<Particles
				className="absolute inset-0 z-0 opacity-30"
				particleCount={150}
				color="oklch(0.6 0.12 240)"
			/>

			{/* Main Content - Lower Z-Index so SharedPresence can float on top if needed, 
                but SharedPresence is pointer-events-none wrapper. 
                Actually, SharedPresence needs to be on top to capture clicks on cursors.
            */}
			<div className="relative z-10 text-center space-y-12 max-w-6xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pt-20">
				{/* Hero Text */}
				<div className="space-y-6">
					<div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md shadow-[0_0_15px_-3px_var(--primary)]">
						<span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse shadow-[0_0_10px_2px_rgba(var(--primary),0.5)]" />
						Live P2P Network
					</div>

					<h1 className="text-5xl md:text-7xl lg:text-9xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground/90 to-foreground/50 drop-shadow-2xl">
						1Sat <span className="text-primary">Wallet</span>
					</h1>

					<p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light">
						The first web-native{" "}
						<span className="text-foreground font-medium">Bitcoin SV</span>{" "}
						wallet.
						<br />
						Trade Ordinals & Tokens directly with peers.{" "}
						<span className="text-primary">No servers. No middleman.</span>
					</p>
				</div>

				{/* CTAs */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-6">
					<Button
						size="lg"
						className="h-16 px-10 text-lg shadow-[0_0_20px_-5px_var(--primary)] hover:shadow-[0_0_30px_-5px_var(--primary)] transition-all duration-300 scale-100 hover:scale-105 font-bold"
						asChild
					>
						{hasWallet ? (
							<Link href="/wallet">
								<Wallet className="mr-2 w-6 h-6" /> My Wallet
							</Link>
						) : (
							<Link href="/wallet/create">
								<Wallet className="mr-2 w-6 h-6" /> Create Wallet
							</Link>
						)}
					</Button>
					<Button
						size="lg"
						variant="outline"
						className="h-16 px-10 text-lg border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
						asChild
					>
						<Link href="/activity">
							Live Activity <ArrowRight className="ml-2 w-6 h-6" />
						</Link>
					</Button>
				</div>

				{/* Feature Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
					<Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-colors group">
						<CardHeader>
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
								<Smartphone className="w-6 h-6 text-primary" />
							</div>
							<CardTitle className="text-xl">Mobile First PWA</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground">
							Install directly to your home screen. Works offline with local key
							storage. No App Store gatekeepers.
						</CardContent>
					</Card>

					<Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-colors group">
						<CardHeader>
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
								<Globe className="w-6 h-6 text-primary" />
							</div>
							<CardTitle className="text-xl">Shared Presence</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground">
							See other users in real-time. Right-click any cursor to initiate a
							direct, encrypted P2P trade instantly.
						</CardContent>
					</Card>

					<Card className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-colors group">
						<CardHeader>
							<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
								<Shield className="w-6 h-6 text-primary" />
							</div>
							<CardTitle className="text-xl">Non-Custodial</CardTitle>
						</CardHeader>
						<CardContent className="text-muted-foreground">
							Your keys stay in your browser. You have complete control. We
							never touch your assets.
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Shared Presence Overlay - Z-Index 30 to sit on top of content */}
			<div className="absolute inset-0 z-30 pointer-events-none">
				<SharedPresence />
			</div>
		</div>
	);
}
