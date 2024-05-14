"use client"

import { generatedImage } from "@/signals/ai";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import type { ChatRequestOptions } from "ai";
import { useChat } from "ai/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useState, type ChangeEvent, type FormEvent } from "react";
import { FaMicrophone } from "react-icons/fa";
import { FaStop } from "react-icons/fa6";
import { v4 as uuidv4 } from "uuid";

interface ViviBtnProps {
  className?: string;
}

const ViviButton: React.FC<ViviBtnProps> = ({ className }) => {
  useSignals();
  const router = useRouter();
  const formRef = React.createRef<HTMLFormElement>();
  const { append, setMessages, messages, input, handleInputChange, handleSubmit } = useChat();
  const [chatId, setChatId] = React.useState<string>("");
  const audioChunks = useSignal<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [loadingSubmit, setLoadingSubmit] = React.useState(false);

  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSubmit(true);

    if (messages.length === 0) {
      // Generate a random id for the chat
      const id = uuidv4();
      setChatId(id);
    }

    setMessages([...messages]);

    // Prepare the options object with additional body data, to pass the model.
    const requestOptions: ChatRequestOptions = {
      options: {
        body: {
          selectedModel: "llava",
        },
      },
    };

    // Call the handleSubmit function with the options
    handleSubmit(e, requestOptions);
  }, [messages, setMessages, handleSubmit]);

  const doneRecording = useCallback(
    async (audioFile: File) => {
      console.log("Audio data is available. Sending to OpenAI...");

      const { transcription } = await fetchTranscription(audioFile);
      if (transcription) {
        console.log("Transcription:", transcription);
        const e: ChangeEvent<HTMLInputElement> = {
          target: { value: transcription },
        } as ChangeEvent<HTMLInputElement>;

        handleInputChange(e);
      }
    },
    [handleInputChange]
  );

  // useEffect(() => {
  //   if (input) {
  //     const e: React.FormEvent<HTMLFormElement> = {
  //       currentTarget: formRef.current,
  //       preventDefault: () => { },
  //     } as React.FormEvent<HTMLFormElement>;

  //     handleSubmit(e, options);
  //   }
  // }, [formRef, handleSubmit, input]);

  const handleRecording = () => {
    if (!isRecording) {
      console.log("Starting recording...");
      if (!navigator.mediaDevices || !window.AudioContext) {
        console.error(
          "Your browser does not support the required audio features."
        );
        return;
      }
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const newMediaRecorder = new MediaRecorder(stream);
          setMediaRecorder(newMediaRecorder);
          newMediaRecorder.start();
          setIsRecording(true);

          newMediaRecorder.ondataavailable = (event) => {
            audioChunks.value.push(event.data);
          };

          newMediaRecorder.onstop = async () => {
            const blob = new Blob(audioChunks.value, {
              type: "audio/ogg; codecs=opus",
            });
            const file = new File([blob], "audio.ogg", {
              type: blob.type,
            });
            // console.log("Recording stopped. Audio data is available.", file.size);
            // const uploadResponse = await uploadFiles("audioUploader", {
            //   files: [file],
            // });
            // audioChunks.value = []; // Reset audio chunks for the next recording
            doneRecording(file);
          };
        })
        .catch((error) => {
          console.error("Error accessing microphone:", error);
        });
    } else {
      console.log("Stopping recording...");
      // Stop the recording
      mediaRecorder?.stop();
      setIsRecording(false);
    }
  };

  const handleImageGeneration = useCallback(async () => {
    if (input) {
      const b64Json = await generateImage(input);
      if (b64Json) {
        generatedImage.value = {
          name: b64Json.created.toString(),
          data: b64Json.data[0].b64_json,
        }
        // Add the generated image URL to the content with a prefix
        // const imageMessage = `[B64JSON]: ${imageUrl}`;
        // append({ role: "assistant", content: imageMessage, id: Date.now().toString() });
        // Navigate to the inscribe page with the imageUrl parameter
        router.push("/inscribe?tab=image&generated=true");
      }
    }
  }, [input, router, generatedImage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const e: FormEvent<HTMLFormElement> = {
        currentTarget: formRef.current,
        preventDefault: () => { },
      } as FormEvent<HTMLFormElement>;

      onSubmit(e) //, options);
    }
  }, [formRef, onSubmit]);

  const renderMessage = (message: string) => {
    const imageUrlPrefix = "[IMAGE_URL]: ";
    if (message.startsWith(imageUrlPrefix)) {
      const imageUrl = message.slice(imageUrlPrefix.length);
      return (
        <>
          <Image src={imageUrl} alt="Generated" className="mt-2" width={200} height={200} />
        </>
      );
    }
    return message;
  };


  return (
    <div>
      <div className="flex space-x-2">
        <button
          type="button"
          className={`btn btn-ghost btn-primary ${className}`}
          onClick={handleRecording}
        >
          {isRecording ? <FaStop /> : <FaMicrophone />}
        </button>
        <button
          type="button"
          className={`btn btn-ghost btn-primary ${className}`}
          onClick={handleImageGeneration}
        >
          Generate Image
        </button>
      </div>
      <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            {m.role === "user" ? "User: " : "AI: "}
            {renderMessage(m.content)}
          </div>
        ))}
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="input input-bordered"
        />

        <form
          ref={formRef}
          onSubmit={(e) => {
            onSubmit(e);
          }}
        />
      </div>
    </div>
  );
};

export default ViviButton;

export const fetchTranscription = async (audioFile: File) => {
  const formData = new FormData();
  formData.append("file", audioFile);

  try {
    const response = await fetch("/api/openai/transcribe", {
      method: "POST",
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching transcription:", error);
  }
};

// const options = {
//   data: {
//     imageUrl:
//       "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Field_sparrow_in_CP_%2841484%29_%28cropped%29.jpg/733px-Field_sparrow_in_CP_%2841484%29_%28cropped%29.jpg",
//   },
// };

type ImageData = {
  revised_prompt: string;
  b64_json: string;
}

type ImageGenerationResponse = {
  created: number,
  data: ImageData[],
}

export const generateImage = async (prompt: string) => {
  const formData = new FormData();
  formData.append("prompt", prompt);
  if (prompt.length === 0) {
    return;
  }
  try {
    const response = await fetch("/api/openai/generate", {
      method: "POST",
      body: formData,
    });
    return await response.json() as ImageGenerationResponse;
  } catch (error) {
    console.error("Error fetching transcription:", error);
  }
};

