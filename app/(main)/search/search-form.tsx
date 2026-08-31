"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({ query }: { query: string }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const submit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const nextQuery = String(new FormData(event.currentTarget).get("q") ?? "");
		startTransition(() => {
			router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
		});
	};

	return (
		<form
			action="/search"
			className="flex max-w-2xl gap-2"
			method="get"
			onSubmit={submit}
		>
			<Input
				aria-label="Search query"
				defaultValue={query}
				maxLength={200}
				name="q"
				placeholder="Outpoint, txid, OpNS name, or listing name"
				required
			/>
			<Button aria-disabled={isPending} disabled={isPending} type="submit">
				{isPending && (
					<Loader2
						aria-hidden="true"
						className="size-4 animate-spin"
						data-icon="inline-start"
					/>
				)}
				{isPending ? "Searching…" : "Search"}
			</Button>
			<span aria-live="polite" className="sr-only">
				{isPending ? "Search in progress" : ""}
			</span>
		</form>
	);
}
