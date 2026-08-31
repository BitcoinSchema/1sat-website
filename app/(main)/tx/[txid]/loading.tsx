import { Loader2 } from "lucide-react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";

export default function TransactionLoading() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Transaction</PageTitle>
			</PageHeader>
			<PageContent>
				<p
					className="flex items-center gap-2 text-muted-foreground"
					role="status"
				>
					<Loader2 className="size-4 animate-spin" /> Loading indexed outputs…
				</p>
			</PageContent>
		</Page>
	);
}
