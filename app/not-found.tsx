"use client";

import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Dynamically import the heavy WebGL component to ensure it only loads on client
const GlitchCanvas = dynamic(() => import("@/components/ui/glitch-canvas"), {
	ssr: false,
});

export default function NotFound() {
	return (
		<div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-foreground overflow-hidden font-mono">
			{/* WebGL Background */}
			<div className="absolute inset-0 z-0">
				<GlitchCanvas />
			</div>

			{/* Vignette Overlay for better text readability */}
			<div className="absolute inset-0 z-10 bg-radial-gradient from-transparent via-background/40 to-background/90 pointer-events-none" />

			{/* Content */}
			<div className="relative z-20 flex flex-col items-center text-center px-4 space-y-8 max-w-2xl mx-auto">
				<div className="space-y-2 mix-blend-difference">
					<h1
						className="text-[8rem] md:text-[12rem] font-bold leading-none tracking-tighter text-primary opacity-90 glitch-text font-sans"
						data-text="404"
					>
						404
					</h1>
					<div className="h-1 w-full bg-primary/20 rounded-full overflow-hidden">
						<div className="h-full bg-primary w-1/3 animate-[loading_3s_ease-in-out_infinite]" />
					</div>
				</div>

				<div className="space-y-4 backdrop-blur-md bg-card/40 p-8 rounded-xl border border-border shadow-2xl">
					{" "}
					<div className="flex items-center justify-center gap-2 text-destructive font-bold tracking-widest uppercase text-sm font-sans">
						<span className="relative flex h-3 w-3">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
							<span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
						</span>
						Signal Lost
					</div>
					<p className="text-base text-muted-foreground font-light leading-relaxed font-sans">
						The requested artifact has been burned,{" "}
						<span className="text-foreground font-medium whitespace-nowrap">
							re-orged
						</span>
						, or vanished into the mempool.
					</p>
				</div>

				<Button
					asChild
					size="lg"
					className="group transition-all duration-300 hover:scale-105"
				>
					<Link href="/">
						<ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
						Return to Base
					</Link>
				</Button>
			</div>
		</div>
	);
}
