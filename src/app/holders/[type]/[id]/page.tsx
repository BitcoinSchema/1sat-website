import { API_HOST, AssetType } from "@/constants";
import type { BSV20 } from "@/types/bsv20";
import Link from "next/link";
import { NextRequest } from "next/server";
import HoldersTable from "@/components/holders";
import { Separator } from "@/components/ui/separator";

const Page = async ({
	params,
}: {
	params: Promise<{ type: AssetType; id: string }>;
}) => {
	const { type, id } = await params;

	console.log(`type: ${type}, id: ${id}`);

	const url =
		type === AssetType.BSV20
			? `${API_HOST}/api/bsv20/tick/${id}`
			: `${API_HOST}/api/bsv20/id/${id}`;

	const details = await getDetails(new NextRequest(url), type, id);

	return (
		<div className="mx-auto flex flex-col max-w-5xl w-full">
			<h1 className="text-xl px-6">
				<Link href={`/market/${type}/${id}`}>
					{type === AssetType.BSV20 ? id : details.sym}
				</Link>{" "}
				Ownership Breakdown
			</h1>
			{type === AssetType.BSV21 && (
				<Link className="text-sm px-6" href={`/outpoint/${id}`}>
					ID: {id}
				</Link>
			)}
			<Separator className="my-4" />
			<HoldersTable type={type} id={id} details={details} />
		</div>
	);
};

export default Page;

const getDetails = async (req: NextRequest, type: AssetType, id: string) => {
	const res = await import("./details/route");
	const resp = await res.GET(req, {
		params: Promise.resolve({
			type,
			id,
		}),
	});
	const details = (await resp.json()) as BSV20;
	return details;
};

export async function generateMetadata({
	params,
}: {
	params: Promise<{ type: AssetType; id: string }>;
}) {
	const { type, id } = await params;

	const url =
		type === AssetType.BSV20
			? `${API_HOST}/api/bsv20/tick/${id}`
			: `${API_HOST}/api/bsv20/id/${id}`;

	const details = await getDetails(new NextRequest(url), type, id);

	const tokenName = type === AssetType.BSV20 ? id : details.sym;

	return {
		title: `${tokenName} token holders`,
		description: `Explore the details of ${tokenName} on 1SatOrdinals.`,
		openGraph: {
			title: `${tokenName} token holders`,
			description: `Explore the details of ${tokenName} on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: `${tokenName} token holders`,
			description: `Explore the details of ${tokenName} on 1SatOrdinals.`,
		},
	};
}
