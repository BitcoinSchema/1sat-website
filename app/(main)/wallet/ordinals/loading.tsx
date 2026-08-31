import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { OrdinalsGridSkeleton } from "@/components/wallet/ordinals-grid-skeleton";

export default function WalletOrdinalsLoading() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Ordinals</PageTitle>
			</PageHeader>
			<PageContent>
				<Skeleton className="h-9 w-full max-w-[675px] rounded-md" />
				<div className="mt-4">
					<OrdinalsGridSkeleton />
				</div>
			</PageContent>
		</Page>
	);
}
