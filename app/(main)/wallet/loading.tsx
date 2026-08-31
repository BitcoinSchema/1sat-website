import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletLoading() {
	return (
		<Page>
			<PageHeader className="flex-wrap gap-3">
				<div className="space-y-2">
					<PageTitle>Wallet</PageTitle>
					<Skeleton className="h-4 w-72" />
				</div>
				<Skeleton className="h-6 w-36 rounded-full" />
			</PageHeader>
			<PageContent className="space-y-6">
				<Skeleton className="h-9 w-full max-w-[675px] rounded-md" />
				<Skeleton className="h-40 rounded-xl" />
				<div className="grid gap-4 md:grid-cols-2">
					<Skeleton className="h-40 rounded-xl" />
					<Skeleton className="h-40 rounded-xl" />
				</div>
			</PageContent>
		</Page>
	);
}
