import { Code, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { FetchStatus, ORDFS } from "@/lib/constants";
import type { OrdUtxo } from "@/lib/types/ordinals";
import type { ArtifactType } from "@/lib/util/artifact";

type JsonArtifactProps = {
	origin?: string;
	className?: string;
	json?: unknown;
	type?: ArtifactType;
	mini?: boolean;
	artifact?: OrdUtxo;
};

const JsonArtifact: React.FC<JsonArtifactProps> = ({
	origin,
	className,
	json: j,
	mini = false,
}) => {
	const [json, setJson] = useState<unknown | null>(j ?? null);
	const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
		FetchStatus.Idle,
	);

	useEffect(() => {
		const fire = async () => {
			if (!origin || typeof origin !== "string") {
				return;
			}
			try {
				setFetchTextStatus(FetchStatus.Loading);
				const result = await fetch(`${ORDFS}/${origin}`);
				const resultText = await result.json();
				setFetchTextStatus(FetchStatus.Success);
				setJson(resultText);
			} catch (_e) {
				setFetchTextStatus(FetchStatus.Error);
			}
		};
		if (json === null && fetchTextStatus === FetchStatus.Idle) {
			fire();
		}
	}, [json, fetchTextStatus, origin]);

	return fetchTextStatus === FetchStatus.Success || json ? (
		<div className="relative w-full h-full flex">
			{!mini && (
				<pre
					className={`overflow-hidden max-h-96 flex items-center justify-start w-full h-full transition text-xs p-2 bg-muted rounded ${
						className ? className : ""
					}`}
				>
					{JSON.stringify(json, null, 2)}
				</pre>
			)}
			{mini && (
				<div>
					<Code />
				</div>
			)}
		</div>
	) : (
		<Loader2 className="mx-auto animate-spin" />
	);
};

export default JsonArtifact;
