import { whisperTranscribe } from "@/components/vivi/ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // form data "file"
  const data = await request.formData();
  const file: File | null = data.get("file") as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false });
  }

  const transcription = await whisperTranscribe(file);

  return Response.json({ transcription });
}
