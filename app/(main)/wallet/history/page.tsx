import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HistoryList from "@/components/wallet/history-list";
import { WalletTabs } from "@/components/wallet/wallet-tabs";

export default function WalletHistoryPage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet History</PageTitle>
			</PageHeader>
			<PageContent>
				<WalletTabs />
				<div className="mt-6">
					<Card>
						<CardHeader>
							<CardTitle>Transaction History</CardTitle>
						</CardHeader>
						<CardContent>
							<HistoryList />
						</CardContent>
					</Card>
				</div>
			</PageContent>
		</Page>
	);
}
