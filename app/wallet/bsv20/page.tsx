import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import TokenGrid from "@/components/wallet/token-grid";
import { WalletTabs } from "@/components/wallet/wallet-tabs";

export default function WalletBSV20Page() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletTabs>
					<div className="mt-4">
						<TokenGrid type="bsv20" />
					</div>
				</WalletTabs>
			</PageContent>
		</Page>
	);
}
