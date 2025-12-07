import FlowGrid from "@/components/feed/flow-grid";

export default function ActivityPage() {
	return (
		<div className="container mx-auto px-4 py-6">
			<div className="mb-8 space-y-2">
				<h1 className="text-3xl font-bold tracking-tight">Market Activity</h1>
				<p className="text-muted-foreground">
					Live feed of the latest inscriptions and artifacts.
				</p>
			</div>
			<FlowGrid />
		</div>
	);
}
