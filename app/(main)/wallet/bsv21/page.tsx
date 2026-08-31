import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Bsv21Deploy } from "@/components/wallet/bsv21-deploy";
import TokenGrid from "@/components/wallet/token-grid";
import { WalletTabs } from "@/components/wallet/wallet-tabs";

export default function WalletBSV21Page() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletTabs>
					<div className="mt-4 space-y-6">
						<TokenGrid />
						<Bsv21Deploy />
					</div>
				</WalletTabs>
			</PageContent>
		</Page>
	);
}
