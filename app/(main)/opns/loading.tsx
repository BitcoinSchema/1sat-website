import { Loader2 } from "lucide-react";

export default function OpnsLoading() {
	return (
		<div
			className="flex min-h-64 items-center justify-center text-muted-foreground"
			role="status"
		>
			<Loader2 className="mr-2 size-5 animate-spin" />
			Loading OpNS…
		</div>
	);
}
