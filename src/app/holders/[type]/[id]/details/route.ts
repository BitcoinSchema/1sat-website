import { NextRequest, NextResponse } from "next/server";

interface TickHolder {
	address: string;
	amt: number;
	pct: number;
}

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(
	request: NextRequest
) {
	const resDetails = await fetch(request.url, {
		next: { revalidate: 60 }, // Revalidate every 60 seconds
	});
	const details = await resDetails.json();
	return NextResponse.json(details);
}
