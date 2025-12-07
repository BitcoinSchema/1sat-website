import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WalletHistoryPage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet History</PageTitle>
			</PageHeader>
			<PageContent>
				<Card>
					<CardHeader>
						<CardTitle>Transaction History</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-sm text-muted-foreground">
							No recent transactions found for this wallet.
						</div>
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}
