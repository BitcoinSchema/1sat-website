import { streamText } from "ai";
import { createOllama } from "ollama-ai-provider-v2";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
	const { messages, selectedModel } = await req.json();
	console.log({ selectedModel, messages });

	const ollama = createOllama({
		baseURL: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434",
	});

	const result = streamText({
		model: ollama(selectedModel),
		messages,
		system: "You are an AI chatbot. Follow the user's instructions carefully.",
	});

	return result.toTextStreamResponse();
}
