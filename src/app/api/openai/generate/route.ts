import { generateImage } from "@/components/vivi/ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	// form data "file"
	const data = await request.formData();
	const prompt: string | null = data.get("prompt") as unknown as string;

	if (!prompt) {
		return NextResponse.json({ success: false });
	}

	const b64Json = await generateImage(prompt);
	return Response.json(b64Json);
}
