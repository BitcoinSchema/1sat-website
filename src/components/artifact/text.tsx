import type React from "react";
import { useEffect, useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import { FaPaperclip } from "react-icons/fa6";
import { FetchStatus, ORDFS } from "@/constants";
import { ArtifactType } from ".";
import JsonArtifact from "./json";

type TextArtifactProps = {
	origin?: string;
	className?: string;
	mini?: boolean;
};

const TextArtifact: React.FC<TextArtifactProps> = ({
	origin,
	className,
	mini = false,
}) => {
	const [text, setText] = useState<string>();
	const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
		FetchStatus.Idle,
	);
	const [isJson, setIsJson] = useState<boolean>(false);
	const [isBsv20, setIsBsv20] = useState<boolean>(false);

	useEffect(() => {
		const fire = async () => {
			try {
				setFetchTextStatus(FetchStatus.Loading);
				const result = await fetch(`${ORDFS}/${origin}`);
				const resultText = await result.text();
				setFetchTextStatus(FetchStatus.Success);
				try {
					const res = JSON.parse(resultText);

					if (res.op && res.p && res.p === "bsv-20") {
						setIsBsv20(true);
					} else {
						setIsJson(true);
					}
				} catch (_e) {
					// not json
					setText(resultText);
					return;
				}
			} catch (e) {
				console.error("Failed to fetch inscription", e);
				setFetchTextStatus(FetchStatus.Error);
			}
		};
		if (!text && fetchTextStatus === FetchStatus.Idle) {
			fire();
		}
	}, [text, fetchTextStatus, origin, setText, setFetchTextStatus]);

	return fetchTextStatus === FetchStatus.Success ? (
		isBsv20 ? (
			<JsonArtifact
				type={ArtifactType.BSV20}
				origin={origin}
				className={className ? className : ""}
				mini={mini}
			/>
		) : isJson ? (
			<JsonArtifact
				type={ArtifactType.JSON}
				origin={origin}
				className={className ? className : ""}
				mini={mini}
			/>
		) : mini ? (
			<FaPaperclip className="m-auto" />
		) : (
			<code
				className={`overflow-auto flex items-center justify-center w-full h-full transition  ${
					className ? className : ""
				}`}
			>
				{text}
			</code>
		)
	) : (
		<LoaderIcon className="m-auto" />
	);
};

export default TextArtifact;
