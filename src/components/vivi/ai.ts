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

export const sendToOpenAI = async (transcription: string) => {
// use the /api/chat endpoint which uses edge routing
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages: [{ role: "system", content: transcription }] }),
  });
  const data = await response.json();
  console.log("OpenAI response:", data);
  return data;
}