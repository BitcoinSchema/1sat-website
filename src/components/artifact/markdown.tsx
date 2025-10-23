"use client";

import { FetchStatus, ORDFS } from "@/constants";
import { MDXClient } from "next-mdx-remote-client/csr";
import type { SerializeResult } from "next-mdx-remote-client/serialize";
import { serialize } from "next-mdx-remote-client/serialize";
import type React from "react";
import { useEffect, useState } from "react";
import { LoaderIcon } from "react-hot-toast";

type MarkdownArtifactProps = {
	origin?: string;
	className?: string;
};

const MarkdownArtifact: React.FC<MarkdownArtifactProps> = ({
	origin,
	className,
}) => {
	const [mdxSource, setMdxSource] = useState<SerializeResult | null>(null);
	const [fetchTextStatus, setFetchTextStatus] = useState<FetchStatus>(
		FetchStatus.Idle,
	);

	useEffect(() => {
		const fire = async () => {
			try {
				setFetchTextStatus(FetchStatus.Loading);
				const result = await fetch(`${ORDFS}/${origin}`);
				const resultText = await result.text();

				const mdxSource = await serialize({
					source: resultText,
					options: {
						mdxOptions: {
							remarkPlugins: [],
							rehypePlugins: [],
						},
					},
				});

				setMdxSource(mdxSource);
				setFetchTextStatus(FetchStatus.Success);
			} catch (e) {
				console.error("Failed to fetch inscription", e);
				setFetchTextStatus(FetchStatus.Error);
			}
		};
		if (!mdxSource && fetchTextStatus === FetchStatus.Idle) {
			fire();
		}
	}, [mdxSource, fetchTextStatus, origin]);

	return fetchTextStatus === FetchStatus.Success && mdxSource && "compiledSource" in mdxSource ? (
		<div
			className={`flex items-center justify-center w-full h-full transition ${className || ""}`}
		>
			<MDXClient {...mdxSource} />
		</div>
	) : (
		<LoaderIcon className="mx-auto" />
	);
};

export default MarkdownArtifact;
