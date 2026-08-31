import { Loader2 } from "lucide-react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";

export default function SearchLoading() {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Search</PageTitle>
			</PageHeader>
			<PageContent>
				<p
					className="flex items-center gap-2 text-muted-foreground"
					role="status"
				>
					<Loader2 className="size-4 animate-spin" /> Searching the 1Sat index…
				</p>
			</PageContent>
		</Page>
	);
}
