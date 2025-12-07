import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { WalletTabs } from "@/components/wallet/wallet-tabs";

export default function WalletBSV21Page() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletTabs>
					<div className="mt-4">
						<h2 className="text-xl font-semibold mb-4">BSV21 Tokens</h2>
						<div className="text-sm text-muted-foreground">
							Your BSV21 token inventory will appear here.
						</div>
					</div>
				</WalletTabs>
			</PageContent>
		</Page>
	);
}
