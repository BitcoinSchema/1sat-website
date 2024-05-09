import OpenAI from "openai";

export const whisperTranscribe = async (file: File) => {
	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

	try {
		const response = await openai.audio.transcriptions.create({
			file,
			model: "whisper-1",
			prompt: "",
		});
		console.log("Whisper response:", response, file.size, file.type);

		return response.text;
	} catch (error) {
		console.error("Error sending data to Whisper:", error);
	}
};

export const sendToOpenAI = async (content: string) => {
	// use the /api/chat endpoint which uses edge routing
	const response = await fetch("/api/chat", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messages: [{ role: "system", content }],
		}),
	});
	const data = await response.json();
	console.log("OpenAI response:", data);
	return data;
};

export const sendToOpenOllama = async (content: string) => {
	// use the /api/chat endpoint which uses edge routing
	const response = await fetch("/api/ollama/chat", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messages: [{ role: "system", content }],
		}),
	});
	const data = await response.json();
	console.log("Ollama response:", data);
	return data;
};

export const generateImage = async (prompt: string) => {
	const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
	try {
		const b64Json = await openai.images.generate({
			model: "dall-e-3",
			prompt,
			n: 1,
			size: "1024x1024",
			response_format: "b64_json",
		});
		if (!b64Json) {
			console.error("No object returned from OpenAI");
			return;
		}
		console.log("B64 Json:", b64Json);

		return b64Json;
	} catch (error) {
		console.error("Error sending data to OpenAI:", error);
	}
};

export const getOllamaModels = async () => {
	console.log("unimplemented");
};

export const generateOllamaImage = async (prompt: string) => {
	console.log("unimplemented");
};
