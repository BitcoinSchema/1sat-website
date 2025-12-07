import { NextRequest, NextResponse } from "next/server";
import { MARKET_API_HOST } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const term = searchParams.get("term");

  if (!term) {
    return NextResponse.json({ error: "Missing term parameter" }, { status: 400 });
  }

  const bsv20Url = `${MARKET_API_HOST}/ticker/autofill/bsv20/${term}`;
  const bsv21Url = `${MARKET_API_HOST}/ticker/autofill/bsv21/${term}`;

  console.log("[Autofill API] Fetching:", bsv20Url, bsv21Url);

  try {
    const [bsv20Res, bsv21Res] = await Promise.all([
      fetch(bsv20Url),
      fetch(bsv21Url),
    ]);

    console.log("[Autofill API] BSV20 status:", bsv20Res.status);
    console.log("[Autofill API] BSV21 status:", bsv21Res.status);

    const [bsv20, bsv21] = await Promise.all([
      bsv20Res.ok ? bsv20Res.json() : [],
      bsv21Res.ok ? bsv21Res.json() : [],
    ]);

    console.log("[Autofill API] BSV20 results:", bsv20?.length || 0);
    console.log("[Autofill API] BSV21 results:", bsv21?.length || 0);

    return NextResponse.json([...(bsv20 || []), ...(bsv21 || [])]);
  } catch (error) {
    console.error("[Autofill API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch autofill results" }, { status: 500 });
  }
}
