import { StreamingTextResponse } from "ai";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: Request) {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		return new Response("OPENAI_API_KEY is not set", { status: 500 });
	}

	const openai = new OpenAI({ apiKey });
	const { messages } = await req.json();
	const response = await openai.chat.completions.create({
		model: "gpt-3.5-turbo",
		stream: true,
		messages,
	});

	return new StreamingTextResponse(response.toReadableStream());
}
