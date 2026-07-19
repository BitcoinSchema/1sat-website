import { type NextRequest, NextResponse } from "next/server";
import { MARKET_API_HOST } from "@/lib/constants";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const term = searchParams.get("term");

	if (!term) {
		return NextResponse.json(
			{ error: "Missing term parameter" },
			{ status: 400 },
		);
	}

	const safeTerm = encodeURIComponent(term);
	// BSV20 is deprecated on this site — BSV21 only
	const bsv21Url = `${MARKET_API_HOST}/ticker/autofill/bsv21/${safeTerm}`;

	try {
		const bsv21Res = await fetch(bsv21Url);
		const bsv21 = bsv21Res.ok ? await bsv21Res.json() : [];

		return NextResponse.json(bsv21 || []);
	} catch (error) {
		console.error("[Autofill API] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch autofill results" },
			{ status: 500 },
		);
	}
}
