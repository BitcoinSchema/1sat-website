import Link from "next/link";
import JsonTable from "@/components/jsonTable";
import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

interface Props {
	outpoint: string;
}

const InscriptionContent = async ({ outpoint }: Props) => {
	const url = `${API_HOST}/api/inscriptions/${outpoint}`;
	const { promise } = http.customFetch<OrdUtxo>(url);
	const artifact = await promise;

	if (!artifact) {
		return <div>Artifact not found</div>;
	}

	return (
		<div className="space-y-4 text-sm text-foreground">
			<div className="text-base font-medium text-muted-foreground">
				{artifact.origin ? "Inscription Origin" : "Not Inscribed"}
			</div>
			<Link
				className="text-xs text-muted-foreground underline-offset-4 transition hover:text-primary"
				href={`/outpoint/${artifact.origin?.outpoint}`}
			>
				{artifact.origin?.outpoint}
			</Link>
			{artifact.origin?.data?.insc && (
				<div className="space-y-2">
					<div className="text-sm font-medium text-muted-foreground">File</div>
					<JsonTable data={artifact.origin?.data?.insc.file} />
				</div>
			)}
			{artifact.origin?.data?.b && (
				<div className="space-y-2">
					<div className="text-sm font-medium text-muted-foreground">B File</div>
					<JsonTable data={artifact.origin?.data?.b} />
				</div>
			)}
			{artifact.origin?.data?.map && (
				<div className="space-y-2">
					<div className="text-sm font-medium text-muted-foreground">Metadata</div>
					<JsonTable data={artifact.origin?.data?.map} />
				</div>
			)}
			{artifact.origin?.data?.sigma &&
				artifact.origin?.data?.sigma.length > 0 && (
					<div className="space-y-2">
						<div className="text-sm font-medium text-muted-foreground">
							Sigma Signature
						</div>
						<JsonTable data={artifact.origin?.data?.sigma[0]} />
					</div>
				)}
		</div>
	);
};

export default InscriptionContent;
