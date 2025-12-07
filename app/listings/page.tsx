import { ListingsTabs } from "@/components/listings/listings-tabs";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";

export default function ListingsPage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>My Listings</PageTitle>
			</PageHeader>
			<PageContent>
				<ListingsTabs />
			</PageContent>
		</Page>
	);
}
