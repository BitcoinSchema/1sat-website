import Link from "next/link";
import FlowGrid from "@/components/feed/flow-grid";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Button } from "@/components/ui/button";

export default function ActivityPage() {
	return (
		<Page>
			<PageHeader className="flex-wrap gap-3">
				<div>
					<PageTitle>Market Activity</PageTitle>
					<p className="text-muted-foreground">
						Paginated active listings from the current 1Sat Market index.
					</p>
				</div>
				<Button asChild className="ml-auto" variant="outline">
					<Link href="/search">Search explorer</Link>
				</Button>
			</PageHeader>
			<PageContent className="space-y-4">
				<p className="text-muted-foreground text-xs" role="status">
					Live PubSub updates are disabled because the installed @1sat/client
					does not expose a typed PubSub client. Results refresh through indexed
					pagination.
				</p>
				<FlowGrid />
			</PageContent>
		</Page>
	);
}
