"use client";

import {
	Calculator,
	Calendar,
	CreditCard,
	Search,
	Settings,
	Smile,
	User,
} from "lucide-react";
import * as React from "react";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarInput,
} from "@/components/ui/sidebar";
import { useHotkeys } from "@/hooks/use-hotkeys";

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
	const [open, setOpen] = React.useState(false);

	useHotkeys("k", () => setOpen((open) => !open));

	return (
		<>
			<form {...props} onSubmit={(e) => e.preventDefault()}>
				<SidebarGroup className="py-0">
					<SidebarGroupContent className="relative">
						<Label htmlFor="search" className="sr-only">
							Search
						</Label>
						<SidebarInput
							id="search"
							placeholder="Search market..."
							className="pl-8 cursor-pointer"
							onClick={() => setOpen(true)}
							readOnly
						/>
						<Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
						<kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 bg-muted text-muted-foreground inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
							<span className="text-xs">⌘</span>K
						</kbd>
					</SidebarGroupContent>
				</SidebarGroup>
			</form>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Type a command or search..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Suggestions">
						<CommandItem>
							<Calendar />
							<span>Calendar</span>
						</CommandItem>
						<CommandItem>
							<Smile />
							<span>Search Emoji</span>
						</CommandItem>
						<CommandItem disabled>
							<Calculator />
							<span>Calculator</span>
						</CommandItem>
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Settings">
						<CommandItem>
							<User />
							<span>Profile</span>
							<CommandShortcut>⌘P</CommandShortcut>
						</CommandItem>
						<CommandItem>
							<CreditCard />
							<span>Billing</span>
							<CommandShortcut>⌘B</CommandShortcut>
						</CommandItem>
						<CommandItem>
							<Settings />
							<span>Settings</span>
							<CommandShortcut>⌘S</CommandShortcut>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
}
