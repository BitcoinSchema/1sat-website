"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "@/components/ui/command";
import { useStackFeatures } from "@/lib/hooks/use-stack-features";
import type { StackFeature } from "@/lib/stack-features";

const commands: Array<{
	label: string;
	href: string;
	shortcut?: string;
	feature?: StackFeature;
}> = [
	{ label: "Home", href: "/", shortcut: "G H" },
	{
		label: "Activity",
		href: "/activity",
		shortcut: "G A",
		feature: "activity",
	},
	{
		label: "Ordinal market",
		href: "/market/ordinals",
		shortcut: "G M",
		feature: "ordinalMarket",
	},
	{
		label: "BSV21 market",
		href: "/market/bsv21",
		shortcut: "G V",
		feature: "bsv21",
	},
	{
		label: "Inscribe",
		href: "/inscribe",
		shortcut: "G I",
		feature: "inscribe",
	},
	{ label: "Wallet", href: "/wallet", shortcut: "G W" },
	{
		label: "Wallet identity",
		href: "/wallet/identity",
		feature: "identity",
	},
	{
		label: "Wallet ordinals",
		href: "/wallet/ordinals",
		shortcut: "G O",
		feature: "ordinals",
	},
	{
		label: "Wallet BSV21",
		href: "/wallet/bsv21",
		shortcut: "G 1",
		feature: "bsv21",
	},
	{ label: "Wallet history", href: "/wallet/history", shortcut: "G Y" },
	{ label: "Wallet settings", href: "/wallet/settings", shortcut: "G ," },
	{ label: "Download", href: "/download" },
	{ label: "Documentation", href: "/docs", shortcut: "G D" },
	{ label: "Settings", href: "/settings", shortcut: "G S" },
];

export function KeyboardShortcuts() {
	const router = useRouter();
	const { resolvedTheme, setTheme } = useTheme();
	const features = useStackFeatures().data?.features;
	const [commandMenuOpen, setCommandMenuOpen] = React.useState(false);
	// We can't easily access both sidebar contexts here because they are nested.
	// This component needs to be inside the context to toggle.
	// But we have TWO contexts.

	// Strategy: This component handles NAVIGATION shortcuts only.
	// Sidebar toggles need to be handled where the context is available (in Layout).

	const gPressedAt = React.useRef(0);

	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setCommandMenuOpen((open) => !open);
				return;
			}

			// Ignore if typing in an input
			if (
				e.target instanceof HTMLElement &&
				(e.target.matches("input, textarea, select") ||
					e.target.isContentEditable)
			) {
				return;
			}

			const key = e.key.toLowerCase();
			if ((e.metaKey || e.ctrlKey) && e.shiftKey && key === "d") {
				e.preventDefault();
				setTheme(resolvedTheme === "dark" ? "light" : "dark");
				return;
			}

			if (gPressedAt.current && e.timeStamp - gPressedAt.current <= 1000) {
				gPressedAt.current = 0;
				switch (key) {
					case "h":
						router.push("/");
						break;
					case "w":
						router.push("/wallet");
						break;
					case "m":
						if (features?.ordinalMarket) router.push("/market/ordinals");
						break;
					case "v":
						if (features?.bsv21) router.push("/market/bsv21");
						break;
					case "i":
						if (features?.inscribe) router.push("/inscribe");
						break;
					case "d":
						router.push("/docs");
						break;
					case "s":
						router.push("/settings");
						break;
					case "o":
						if (features?.ordinals) router.push("/wallet/ordinals");
						break;
					case "1":
						if (features?.bsv21) router.push("/wallet/bsv21");
						break;
					case ",":
						router.push("/wallet/settings");
						break;
					case "y":
						router.push("/wallet/history");
						break;
					case "a":
						if (features?.activity) router.push("/activity");
						break;
				}
			} else if (key === "g") {
				gPressedAt.current = e.timeStamp;
			} else {
				gPressedAt.current = 0;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [features, resolvedTheme, router, setTheme]);

	return (
		<CommandDialog open={commandMenuOpen} onOpenChange={setCommandMenuOpen}>
			<CommandInput placeholder="Search pages…" />
			<CommandList>
				<CommandEmpty>No matching page.</CommandEmpty>
				<CommandGroup heading="Navigate">
					{commands.map((command) => {
						if (command.feature && !features?.[command.feature]) return null;
						return (
							<CommandItem
								key={command.href}
								onSelect={() => {
									setCommandMenuOpen(false);
									router.push(command.href);
								}}
							>
								{command.label}
								{command.shortcut && (
									<CommandShortcut>{command.shortcut}</CommandShortcut>
								)}
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
