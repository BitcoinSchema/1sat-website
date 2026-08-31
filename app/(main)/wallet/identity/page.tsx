"use client";

import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { BapIdentityCenter } from "@/components/wallet/bap-identity-center";
import { WalletTabs } from "@/components/wallet/wallet-tabs";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export default function WalletIdentityPage() {
	const { identityKey } = useWalletToolbox();

	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletTabs>
					<div className="mt-4 max-w-3xl">
						<BapIdentityCenter key={identityKey ?? "disconnected"} />
					</div>
				</WalletTabs>
			</PageContent>
		</Page>
	);
}
