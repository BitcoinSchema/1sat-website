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
		<div>
			<div className="my-4 text-xl text-[#aaa]">
				{artifact.origin ? "Inscription Origin" : "Not Inscribed"}
			</div>
			<Link
				className="text-xs text-[#555] hover:text-blue-500 transition"
				href={`/outpoint/${artifact.origin?.outpoint}`}
			>
				{artifact.origin?.outpoint}
			</Link>
			{artifact.origin?.data?.insc && (
				<div>
					<div className="my-4 text-xl text-[#555]">File</div>
					<JsonTable data={artifact.origin?.data?.insc.file} />
				</div>
			)}
			{artifact.origin?.data?.b && (
				<div>
					<div className="my-4 text-xl text-[#555]">B File</div>
					<JsonTable data={artifact.origin?.data?.b} />
				</div>
			)}
			{artifact.origin?.data?.map && (
				<div>
					<div className="my-4 text-xl text-[#555]">Metadata</div>
					<JsonTable data={artifact.origin?.data?.map} />
				</div>
			)}
			{artifact.origin?.data?.sigma &&
				artifact.origin?.data?.sigma.length > 0 && (
					<div>
						<div className="my-4 text-xl text-[#555]">Sigma Signature</div>
						<JsonTable data={artifact.origin?.data?.sigma[0]} />
					</div>
				)}
		</div>
	);
};

export default InscriptionContent;
