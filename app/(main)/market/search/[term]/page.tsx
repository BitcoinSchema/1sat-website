import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { API_HOST } from "@/lib/constants";

interface SearchPageProps {
	params: Promise<{ term: string }>;
}

type MarketSearchItem = {
	outpoint?: string;
	txid?: string;
	vout?: number;
	origin?: {
		data?: {
			insc?: {
				file?: {
					type?: string;
				};
			};
		};
	};
};

export async function generateMetadata({
	params,
}: SearchPageProps): Promise<Metadata> {
	const { term } = await params;
	const searchTerm = decodeURIComponent(term);

	return {
		title: `Search Results for "${searchTerm}" - 1SatOrdinals`,
		description: `Explore listings for "${searchTerm}" on 1SatOrdinals.`,
	};
}

export default async function SearchResultsPage({ params }: SearchPageProps) {
	const { term } = await params;
	const searchTerm = decodeURIComponent(term);

	if (!searchTerm) {
		notFound();
	}

	// Fetch search results from API
	let results: MarketSearchItem[] = [];
	try {
		const response = await fetch(
			`${API_HOST}/api/market?limit=30&offset=0&q=${encodeURIComponent(searchTerm)}`,
			{ next: { revalidate: 60 } },
		);
		if (response.ok) {
			results = await response.json();
		}
	} catch (error) {
		console.error("Search fetch error:", error);
	}

	return (
		<Page>
			<PageHeader>
				<PageTitle>Search: "{searchTerm}"</PageTitle>
			</PageHeader>
			<PageContent>
				{results.length > 0 ? (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{results.map((item) => (
							<div
								key={item.outpoint || `${item.txid}_${item.vout}`}
								className="aspect-square bg-muted rounded-lg overflow-hidden border border-border"
							>
								<div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
									{item.origin?.data?.insc?.file?.type || "Item"}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-12">
						<p className="text-muted-foreground">
							No results found for "{searchTerm}"
						</p>
						<p className="text-sm text-muted-foreground mt-2">
							Try searching for a different term or browse the market.
						</p>
					</div>
				)}
			</PageContent>
		</Page>
	);
}
