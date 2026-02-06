import { Spinner } from "@/components/ui/spinner";

export default function MainLoading() {
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<Spinner className="size-6" />
		</div>
	);
}
