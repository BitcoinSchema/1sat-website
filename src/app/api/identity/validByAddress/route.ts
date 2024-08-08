import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const { address } = await req.json();
	try {
		const response = await fetch(
			"https://go-bap-indexer-production.up.railway.app/v1/identity/validByAddress",

			{
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				method: "POST",
				body: JSON.stringify({ address: address }),
			}
		);
		const data = await response.json();
		return NextResponse.json(data);
	} catch (err) {
		return new NextResponse(null, {
			status: 500,
			statusText: "Internal Server Error",
		});
	}
}
