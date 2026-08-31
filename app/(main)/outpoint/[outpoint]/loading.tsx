import { Loader2 } from "lucide-react";

export default function OutpointLoading() {
	return (
		<div className="mx-auto flex w-full max-w-5xl items-center gap-2 p-4 text-muted-foreground">
			<Loader2 className="size-4 animate-spin" />
			<p role="status">Loading indexed outpoint…</p>
		</div>
	);
}
