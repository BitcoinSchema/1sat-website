"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { WalletSettingsForm } from "@/components/wallet/wallet-settings-form";
import { useSound } from "@/hooks/use-sound";

export default function WalletSettingsPage() {
	const { play } = useSound();

	return (
		<Page>
			<PageHeader className="gap-2 justify-start">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="-ml-2"
					onClick={() => play("click")}
				>
					<Link href="/settings">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<PageTitle>Wallet Settings</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletSettingsForm />
			</PageContent>
		</Page>
	);
}
