"use client";

import { ChevronRight, Keyboard, Palette, User, Wallet } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export function SettingsForm() {
	const { theme, setTheme } = useTheme();
	const [themeOrigin, setThemeOrigin] = useState("");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	return (
		<div className="grid gap-6 md:grid-cols-2">
			{/* Profile Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<User className="h-5 w-5 text-primary" />
						<CardTitle>Profile</CardTitle>
					</div>
					<CardDescription>Manage your public profile.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center gap-4">
						<Avatar className="h-16 w-16 border">
							<AvatarImage
								src="https://avatars.githubusercontent.com/u/1234567?v=4"
								alt="@username"
							/>
							<AvatarFallback>UN</AvatarFallback>
						</Avatar>
						<Button variant="outline" size="sm">
							Change Avatar
						</Button>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="username">Username</Label>
						<Input id="username" placeholder="@username" />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="bio">Bio</Label>
						<Input id="bio" placeholder="Tell us about yourself" />
					</div>
				</CardContent>
			</Card>

			{/* Appearance Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Palette className="h-5 w-5 text-primary" />
						<CardTitle>Appearance</CardTitle>
					</div>
					<CardDescription>Customize the UI.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between space-x-2">
						<div className="flex flex-col space-y-1">
							<Label htmlFor="dark-mode">Dark Mode</Label>
							<span className="text-xs text-muted-foreground">
								Switch themes.
							</span>
						</div>
						<Switch
							id="dark-mode"
							checked={theme === "dark"}
							onCheckedChange={(checked) =>
								setTheme(checked ? "dark" : "light")
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="theme-origin">Theme Origin</Label>
						<Input
							id="theme-origin"
							placeholder="Enter theme token origin..."
							value={themeOrigin}
							onChange={(e) => setThemeOrigin(e.target.value)}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between space-x-2">
						<div className="flex flex-col space-y-1">
							<Label htmlFor="compact-mode">Compact Mode</Label>
							<span className="text-xs text-muted-foreground">
								Increase density.
							</span>
						</div>
						<Switch id="compact-mode" />
					</div>
				</CardContent>
			</Card>

			{/* Wallet Settings Link */}
			<Link href="/wallet/settings" className="md:col-span-2">
				<Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-primary">
					<CardContent className="flex items-center justify-between p-6">
						<div className="flex items-center gap-4">
							<div className="p-2 bg-primary/10 rounded-full">
								<Wallet className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="font-semibold text-lg">Wallet Settings</h3>
								<p className="text-sm text-muted-foreground">
									Manage privacy, currency, and blockchain synchronization.
								</p>
							</div>
						</div>
						<ChevronRight className="h-5 w-5 text-muted-foreground" />
					</CardContent>
				</Card>
			</Link>

			{/* Shortcuts Card */}
			<Card className="md:col-span-2">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Keyboard className="h-5 w-5 text-primary" />
						<CardTitle>Keyboard Shortcuts</CardTitle>
					</div>
					<CardDescription>Navigate efficiently.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						{/* Re-organize for density */}
						<div>
							<span className="font-semibold block mb-1">Global</span>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Left Sidebar</span>{" "}
								<span className="font-mono">⌘ [</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Right Sidebar</span>{" "}
								<span className="font-mono">⌘ ]</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Search</span>{" "}
								<span className="font-mono">⌘ K</span>
							</div>
						</div>

						<div>
							<span className="font-semibold block mb-1">Nav (g + key)</span>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Home</span>{" "}
								<span className="font-mono">h</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Activity</span>{" "}
								<span className="font-mono">a</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Settings</span>{" "}
								<span className="font-mono">s</span>
							</div>
						</div>

						<div>
							<span className="font-semibold block mb-1">Market</span>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Ordinals</span>{" "}
								<span className="font-mono">m</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">BSV20</span>{" "}
								<span className="font-mono">b</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">BSV21</span>{" "}
								<span className="font-mono">v</span>
							</div>
						</div>

						<div>
							<span className="font-semibold block mb-1">Wallet</span>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Dash</span>{" "}
								<span className="font-mono">w</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">History</span>{" "}
								<span className="font-mono">y</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Listings</span>{" "}
								<span className="font-mono">l</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
