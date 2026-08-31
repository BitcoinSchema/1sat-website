import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { OrdinalsGrid } from "@/components/wallet/ordinals-grid";
import { WalletTabs } from "@/components/wallet/wallet-tabs";

export default function WalletOrdinalsPage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Ordinals</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletTabs>
					<div className="mt-4">
						<OrdinalsGrid />
					</div>
				</WalletTabs>
			</PageContent>
		</Page>
	);
}
