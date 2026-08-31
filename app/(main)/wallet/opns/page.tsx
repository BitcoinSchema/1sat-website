import { OwnedOpns } from "@/components/opns/owned-opns";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { WalletTabs } from "@/components/wallet/wallet-tabs";

export default function WalletOpnsPage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletTabs>
					<div className="mt-4">
						<OwnedOpns />
					</div>
				</WalletTabs>
			</PageContent>
		</Page>
	);
}
