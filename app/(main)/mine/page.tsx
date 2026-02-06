import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";

export default function MinePage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Mine</PageTitle>
			</PageHeader>
			<PageContent>
				<p className="text-muted-foreground">Mining interface.</p>
			</PageContent>
		</Page>
	);
}
