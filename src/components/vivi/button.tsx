"use client";

import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { FaStop } from "react-icons/fa6";
import { GiChatBubble } from "react-icons/gi";

import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useChat } from "ai/react";

interface ViviBtnProps {
	className?: string;
}

const ViviButton: React.FC<ViviBtnProps> = ({ className }) => {
	useSignals();
	const formRef = React.createRef<HTMLFormElement>();
	const { messages, input, handleInputChange, handleSubmit } = useChat();

	const audioChunks = useSignal<Blob[]>([]);
	const [isRecording, setIsRecording] = useState(false);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
		null
	);

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

	useEffect(() => {
		if (input) {
			// formRef.current?.submit();

			const e: React.FormEvent<HTMLFormElement> = {
				currentTarget: formRef.current,
				preventDefault: () => {},
			} as React.FormEvent<HTMLFormElement>;

			handleSubmit(e, options);
		}
	}, [formRef, handleSubmit, input]);

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

	return (
		<div>
			<button
				type="button"
				className={`btn btn-ghost btn-primary ${className}`}
				onClick={handleRecording}
			>
				{isRecording ? <FaStop /> : <GiChatBubble />}
			</button>
			<div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
				{messages.length > 0
					? messages.map((m) => (
							<div key={m.id} className="whitespace-pre-wrap">
								{m.role === "user" ? "User: " : "AI: "}
								{m.content}
							</div>
					  ))
					: null}

				<form
					ref={formRef}
					onSubmit={(e) => {
						handleSubmit(e, options);
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

const options = {
	data: {
		imageUrl:
			"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Field_sparrow_in_CP_%2841484%29_%28cropped%29.jpg/733px-Field_sparrow_in_CP_%2841484%29_%28cropped%29.jpg",
	},
};
