import { Loader2, Paperclip } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { FetchStatus, ORDFS } from "@/lib/constants";
import { ArtifactType } from "@/lib/util/artifact";
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
			if (!origin || typeof origin !== "string") {
				return;
			}
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
				}
			} catch (_e) {
				setFetchTextStatus(FetchStatus.Error);
			}
		};
		if (!text && fetchTextStatus === FetchStatus.Idle) {
			fire();
		}
	}, [text, fetchTextStatus, origin]);

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
			<Paperclip className="m-auto" />
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
		<Loader2 className="m-auto animate-spin" />
	);
};

export default TextArtifact;
