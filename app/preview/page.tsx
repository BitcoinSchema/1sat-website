import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";

export default function PreviewPage() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Preview</PageTitle>
			</PageHeader>
			<PageContent>
				<p className="text-muted-foreground">Transaction preview.</p>
			</PageContent>
		</Page>
	);
}
