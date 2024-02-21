import { API_HOST, AssetType } from "@/constants";
import { NextRequest, NextResponse } from "next/server";

interface TickHolder {
	address: string;
	amt: number;
	pct: number;
}

export const dynamic = "auto"; // defaults to auto

export async function GET(
	request: NextRequest,
  { params: {type, id }}: { params: { type: string; id: string }},
) {
  const url = type === AssetType.BSV20
    ? `${API_HOST}/api/bsv20/tick/${id}`
    : `${API_HOST}/api/bsv20/id/${id}`;

	const resp = await fetch(url, {
    next: { revalidate: 120 }, // Revalidate every 2 minutes
  })
  const details = await resp.json();
	return NextResponse.json(details);
}
