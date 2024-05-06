// import { ChatOllama } from "@langchain/community/chat_models/ollama";
// import { AIMessage, HumanMessage } from "@langchain/core/messages";
// import { BytesOutputParser } from "@langchain/core/output_parsers";
import { ModelFusionTextStream, asChatMessages } from "@modelfusion/vercel-ai";
import { StreamingTextResponse } from "ai";
import { ollama, streamText } from "modelfusion";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
	const { messages, selectedModel } = await req.json();

	// langchain method
	// const model = new ChatOllama({
	// 	baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434",
	// 	model: selectedModel,
	// });
	// const parser = new BytesOutputParser();

	// const stream = await model.pipe(parser).stream(
	// 	(messages as Message[]).map((m) => {
	// 		console.log(m);
	// 		return m.role === "user"
	// 			? new HumanMessage(m.content)
	// 			: new AIMessage(m.content);
	// 		// return m.content;
	// 	})
	// );
	// 	return new StreamingTextResponse(stream);

	// modelfusion method
	const model = ollama
		.ChatTextGenerator({ model: selectedModel })
		.withChatPrompt();

	const prompt = {
		system: "You are an AI chatbot. Follow the user's instructions carefully.",

		// map Vercel AI SDK Message to ModelFusion ChatMessage:
		messages: asChatMessages(messages),
	};
	const textStream = await streamText({ model, prompt });
	return new StreamingTextResponse(ModelFusionTextStream(textStream));
}
