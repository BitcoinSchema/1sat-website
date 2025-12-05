import { API_HOST, AssetType } from "@/constants";

export const resultsPerPage = 100;

export const getHolders = async ({
	type,
	id,
	pageParam = 0,
	details,
}: {
	pageParam: number;
	type: AssetType;
	id: string;
	details: any;
}) => {
	const offset = resultsPerPage * pageParam;
	const url =
		type === AssetType.BSV20
			? `${API_HOST}/api/bsv20/tick/${id}/holders`
			: `${API_HOST}/api/bsv20/id/${id}/holders`;

	const holdersResp = await fetch(
		`${url}?limit=${resultsPerPage}&offset=${offset}`
	);
	const holdersJson = (await holdersResp.json()) || [];
	const holders =
		holdersJson?.length &&
		holdersJson
			?.sort((a: any, b: any) => parseInt(b.amt, 10) - parseInt(a.amt, 10))
			.map((h: any) => ({
				...h,
				amt: parseInt(h.amt, 10) / 10 ** (details?.dec || 0),
				pct:
					type === AssetType.BSV20
						? (parseInt(h.amt, 10) / parseInt(details?.supply!, 10)) * 100
						: (parseInt(h.amt, 10) / parseInt(details?.amt!, 10)) * 100,
			}));

	return holders;
};
