"use client";

import { inscribe, mintCollection, mintCollectionItem } from "@1sat/actions";
import { HttpError } from "@1sat/client";
import {
	CheckCircle2,
	ExternalLink,
	FileText,
	Image as ImageIcon,
	Loader2,
	RefreshCcw,
	ShieldCheck,
	Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSound } from "@/hooks/use-sound";
import { useStackFeatures } from "@/lib/hooks/use-stack-features";
import {
	DEFAULT_INSCRIPTION_STREAM_CHUNK,
	fileToBase64,
	formatBytes,
	type InscriptionMode,
	inscriptionFailureMessage,
	normalizeCollectionId,
	parseOptionalNonNegativeInteger,
	parsePositiveInteger,
	SINGLE_TX_INSCRIPTION_LIMIT,
	textByteLength,
	textToBase64,
	validateInscriptionDraft,
} from "@/lib/inscriptions";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import { toStackOutpoint } from "@/lib/stack";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

type Stage = "edit" | "review" | "submitting" | "success" | "error";
type IndexingState =
	| "idle"
	| "checking"
	| "confirmed"
	| "pending"
	| "error"
	| "unavailable";

interface MintResult {
	txid: string;
	outpoint: string;
	collectionId?: string;
	contentHash?: string;
	streamed?: boolean;
	txids?: string[];
}

const labels: Record<InscriptionMode, string> = {
	file: "File",
	text: "Text",
	collection: "Collection",
	"collection-item": "Collection item",
};

function parseMetadata(value: string): Record<string, string> | undefined {
	if (!value.trim()) return undefined;
	const parsed: unknown = JSON.parse(value);
	if (
		!parsed ||
		Array.isArray(parsed) ||
		typeof parsed !== "object" ||
		Object.values(parsed).some((item) => typeof item !== "string")
	) {
		throw new Error("invalid-metadata");
	}
	return parsed as Record<string, string>;
}

function Toggle({
	checked,
	disabled,
	children,
	onChange,
}: {
	checked: boolean;
	disabled?: boolean;
	children: React.ReactNode;
	onChange: (value: boolean) => void;
}) {
	return (
		<label className="flex items-start gap-3 text-sm">
			<input
				type="checkbox"
				checked={checked}
				disabled={disabled}
				onChange={(event) => onChange(event.target.checked)}
				className="mt-1"
			/>
			<span>{children}</span>
		</label>
	);
}

function ContentPreview({
	file,
	previewUrl,
	mode,
	text,
}: {
	file: File | null;
	previewUrl: string | null;
	mode: InscriptionMode;
	text: string;
}) {
	if (mode === "text" && text) {
		return (
			<pre className="max-h-80 w-full overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-xs">
				{text}
			</pre>
		);
	}
	if (previewUrl && file?.type.startsWith("image/")) {
		return (
			<div className="relative aspect-square w-full max-w-sm">
				<Image
					src={previewUrl}
					alt="Selected content preview"
					fill
					unoptimized
					sizes="384px"
					className="object-contain"
				/>
			</div>
		);
	}
	if (previewUrl && file?.type.startsWith("video/")) {
		return (
			// biome-ignore lint/a11y/useMediaCaption: A local user-selected preview has no separate caption asset.
			<video src={previewUrl} controls className="max-h-80 w-full" />
		);
	}
	if (previewUrl && file?.type.startsWith("audio/")) {
		return (
			// biome-ignore lint/a11y/useMediaCaption: A local user-selected preview has no separate caption asset.
			<audio src={previewUrl} controls className="w-full" />
		);
	}
	if (file) {
		return (
			<div className="space-y-3 text-center">
				<FileText className="mx-auto size-12 text-muted-foreground" />
				<p className="font-medium">{file.name}</p>
				<p className="text-sm text-muted-foreground">
					{formatBytes(file.size)} · {file.type || "application/octet-stream"}
				</p>
			</div>
		);
	}
	return (
		<div className="space-y-3 text-center text-muted-foreground">
			<ImageIcon className="mx-auto size-12 opacity-30" />
			<p>Select content to preview it.</p>
		</div>
	);
}

export function InscriptionStudio() {
	const { play } = useSound();
	const { oneSatContext, services, refreshBalance } = useWalletToolbox();
	const stackFeatures = useStackFeatures();
	const [mode, setMode] = useState<InscriptionMode>("file");
	const [stage, setStage] = useState<Stage>("edit");
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [contentType, setContentType] = useState("application/octet-stream");
	const [text, setText] = useState("");
	const [metadata, setMetadata] = useState("");
	const [stream, setStream] = useState(false);
	const [signWithBap, setSignWithBap] = useState(false);
	const [usePermissionModule, setUsePermissionModule] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [quantity, setQuantity] = useState("1");
	const [collectionId, setCollectionId] = useState("");
	const [mintNumber, setMintNumber] = useState("");
	const [rank, setRank] = useState("");
	const [result, setResult] = useState<MintResult | null>(null);
	const [failure, setFailure] = useState("");
	const [partialTxids, setPartialTxids] = useState<string[]>([]);
	const [indexing, setIndexing] = useState<IndexingState>("idle");

	useEffect(
		() => () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		},
		[previewUrl],
	);

	const byteLength = mode === "text" ? textByteLength(text) : (file?.size ?? 0);
	const collectionMode = mode === "collection" || mode === "collection-item";
	const validation = useMemo(
		() =>
			validateInscriptionDraft({
				mode,
				byteLength,
				contentType,
				stream,
				signWithBap,
				name,
				description,
				quantity,
				collectionId,
				mintNumber,
				rank,
			}),
		[
			mode,
			byteLength,
			contentType,
			stream,
			signWithBap,
			name,
			description,
			quantity,
			collectionId,
			mintNumber,
			rank,
		],
	);

	const selectFile = (selected: File | null) => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setFile(selected);
		setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
		setContentType(selected?.type || "application/octet-stream");
		setStage("edit");
		setFailure("");
	};

	const changeMode = (value: string) => {
		const nextMode = value as InscriptionMode;
		setMode(nextMode);
		setContentType(
			nextMode === "text"
				? "text/plain;charset=utf-8"
				: file?.type || "application/octet-stream",
		);
		setStage("edit");
		setFailure("");
		setResult(null);
		setPartialTxids([]);
		setIndexing("idle");
		play("click");
	};

	const checkIndexing = useCallback(
		async (outpoint: string) => {
			if (!stackFeatures.data?.capabilities.has("ordfs") || !services) {
				setIndexing("unavailable");
				return;
			}
			setIndexing("checking");
			try {
				await services.ordfs.getMetadata(toStackOutpoint(outpoint));
				setIndexing("confirmed");
			} catch (error) {
				setIndexing(
					error instanceof HttpError && error.status === 404
						? "pending"
						: "error",
				);
			}
		},
		[services, stackFeatures.data],
	);

	const openReview = () => {
		if (!validation.valid) return;
		if ((mode === "file" || mode === "text") && metadata.trim()) {
			try {
				parseMetadata(metadata);
			} catch {
				setFailure("MAP metadata must be a JSON object with string values.");
				return;
			}
		}
		setFailure("");
		setStage("review");
	};

	const execute = async () => {
		if (!oneSatContext || !validation.valid) return;
		setStage("submitting");
		setFailure("");
		setPartialTxids([]);
		setIndexing("idle");
		try {
			const base64Content =
				mode === "text"
					? textToBase64(text)
					: file
						? await fileToBase64(file)
						: "";
			let completed: MintResult;
			if (mode === "file" || mode === "text") {
				const response = await inscribe.execute(oneSatContext, {
					base64Content,
					contentType,
					map: parseMetadata(metadata),
					stream: stream || undefined,
					signWithBAP: signWithBap || undefined,
					usePermissionModule: usePermissionModule || undefined,
				});
				if (response.partialTxids) setPartialTxids(response.partialTxids);
				if (response.error || !response.txid)
					throw new Error(response.error || "no-txid-returned");
				completed = {
					txid: response.txid,
					outpoint: `${response.txid}_0`,
					contentHash: response.contentHash,
					streamed: response.streamed,
					txids: response.txids,
				};
			} else if (mode === "collection") {
				const response = await mintCollection.execute(oneSatContext, {
					base64Content,
					contentType,
					name: name.trim(),
					description: description.trim(),
					quantity: parsePositiveInteger(quantity) as number,
					usePermissionModule: usePermissionModule || undefined,
					// 0.0.200's collection Sigma path still reads this deprecated alias.
					useModule: usePermissionModule || undefined,
				});
				if (response.error || !response.txid || !response.collectionId)
					throw new Error(response.error || "no-collection-id-returned");
				completed = {
					txid: response.txid,
					outpoint: response.collectionId,
					collectionId: response.collectionId,
				};
			} else {
				const response = await mintCollectionItem.execute(oneSatContext, {
					base64Content,
					contentType,
					name: name.trim(),
					collectionId: normalizeCollectionId(collectionId) as string,
					mintNumber: parseOptionalNonNegativeInteger(mintNumber) ?? undefined,
					rank: parseOptionalNonNegativeInteger(rank) ?? undefined,
					usePermissionModule: usePermissionModule || undefined,
					useModule: usePermissionModule || undefined,
				});
				if (response.error || !response.txid)
					throw new Error(response.error || "no-txid-returned");
				completed = { txid: response.txid, outpoint: `${response.txid}_0` };
			}
			setResult(completed);
			setStage("success");
			play("success");
			refreshBalance?.();
			void checkIndexing(completed.outpoint);
		} catch (error) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: `wallet.${mode}`,
				recoverable: true,
				context: { retryable: true },
			});
			setFailure(
				inscriptionFailureMessage(
					error instanceof Error ? error.message : undefined,
				),
			);
			setStage("error");
			play("error");
		}
	};

	const contentUrl =
		result && services
			? services.ordfs.getContentUrl(toStackOutpoint(result.outpoint))
			: null;

	return (
		<div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
			<div className="space-y-4">
				<Tabs value={mode} onValueChange={changeMode}>
					<TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4">
						{Object.entries(labels).map(([value, label]) => (
							<TabsTrigger key={value} value={value}>
								{label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
				<Card>
					<CardHeader>
						<CardTitle>{labels[mode]}</CardTitle>
						<CardDescription>
							{mode === "text"
								? "Encode UTF-8 text exactly as shown."
								: collectionMode
									? "Mint canonical 1Sat collection metadata with on-chain artwork."
									: "Create a file inscription through the connected BRC-100 wallet."}
						</CardDescription>
					</CardHeader>

					{stage === "edit" && (
						<>
							<CardContent className="space-y-5">
								{mode === "text" ? (
									<div className="space-y-2">
										<Label htmlFor="inscription-text">Text</Label>
										<Textarea
											id="inscription-text"
											className="min-h-48 font-mono"
											value={text}
											onChange={(event) => setText(event.target.value)}
											placeholder="Text is encoded as UTF-8"
										/>
									</div>
								) : (
									<div className="space-y-2">
										<Label htmlFor="inscription-file">
											{collectionMode ? "Artwork" : "Content"}
										</Label>
										<label
											htmlFor="inscription-file"
											className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground hover:bg-muted/40"
										>
											<Upload className="size-4" />
											{file ? "Replace file" : "Choose a file"}
										</label>
										<input
											id="inscription-file"
											type="file"
											className="sr-only"
											onChange={(event) =>
												selectFile(event.target.files?.[0] ?? null)
											}
										/>
									</div>
								)}
								<div className="space-y-2">
									<Label htmlFor="content-type">Content type</Label>
									<Input
										id="content-type"
										value={contentType}
										onChange={(event) => setContentType(event.target.value)}
									/>
								</div>

								{(mode === "file" || mode === "text") && (
									<>
										<div className="space-y-2">
											<Label htmlFor="metadata">
												MAP metadata (optional JSON)
											</Label>
											<Textarea
												id="metadata"
												className="min-h-24 font-mono"
												value={metadata}
												onChange={(event) => setMetadata(event.target.value)}
												placeholder={'{"name":"My inscription"}'}
											/>
										</div>
										<Toggle
											checked={stream}
											onChange={(checked) => {
												setStream(checked);
												if (checked) setSignWithBap(false);
											}}
										>
											Stream as an OrdFS chain (
											{formatBytes(DEFAULT_INSCRIPTION_STREAM_CHUNK)} chunks).
											Required only above{" "}
											{formatBytes(SINGLE_TX_INSCRIPTION_LIMIT)}.
										</Toggle>
										<Toggle
											checked={signWithBap}
											disabled={stream}
											onChange={setSignWithBap}
										>
											Add a BAP/Sigma signature. The wallet must grant the
											identity-signing request; this page never reads its key.
										</Toggle>
									</>
								)}

								{collectionMode && (
									<>
										<div className="space-y-2">
											<Label htmlFor="mint-name">Name</Label>
											<Input
												id="mint-name"
												value={name}
												onChange={(event) => setName(event.target.value)}
											/>
										</div>
										{mode === "collection" ? (
											<>
												<div className="space-y-2">
													<Label htmlFor="collection-description">
														Description
													</Label>
													<Textarea
														id="collection-description"
														value={description}
														onChange={(event) =>
															setDescription(event.target.value)
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="collection-quantity">Quantity</Label>
													<Input
														id="collection-quantity"
														inputMode="numeric"
														value={quantity}
														onChange={(event) =>
															setQuantity(event.target.value.replace(/\D/g, ""))
														}
													/>
												</div>
											</>
										) : (
											<>
												<div className="space-y-2">
													<Label htmlFor="collection-id">
														Collection origin
													</Label>
													<Input
														id="collection-id"
														className="font-mono"
														value={collectionId}
														onChange={(event) =>
															setCollectionId(event.target.value)
														}
														placeholder="txid_0"
													/>
												</div>
												<div className="grid grid-cols-2 gap-3">
													<div className="space-y-2">
														<Label htmlFor="mint-number">
															Mint number (optional)
														</Label>
														<Input
															id="mint-number"
															inputMode="numeric"
															value={mintNumber}
															onChange={(event) =>
																setMintNumber(
																	event.target.value.replace(/\D/g, ""),
																)
															}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="rank">Rank (optional)</Label>
														<Input
															id="rank"
															inputMode="numeric"
															value={rank}
															onChange={(event) =>
																setRank(event.target.value.replace(/\D/g, ""))
															}
														/>
													</div>
												</div>
											</>
										)}
										<div className="rounded-md border bg-muted/30 p-3 text-sm">
											<ShieldCheck className="mr-2 inline size-4" />
											The installed collection action always adds a BAP/Sigma
											seal. Your wallet can approve or decline the signing
											permission.
										</div>
									</>
								)}

								<Toggle
									checked={usePermissionModule}
									onChange={setUsePermissionModule}
								>
									Route this action through the optional 1Sat permission module.
									The connected wallet remains the authority.
								</Toggle>
								<div className="flex justify-between gap-4 rounded-md border p-3 text-sm">
									<span>Exact content size</span>
									<span className="font-mono">{formatBytes(byteLength)}</span>
								</div>
								{validation.errors.length > 0 && (
									<ul
										className="space-y-1 text-sm text-destructive"
										role="alert"
									>
										{validation.errors.map((error) => (
											<li key={error}>{error}</li>
										))}
									</ul>
								)}
								{failure && (
									<p className="text-sm text-destructive" role="alert">
										{failure}
									</p>
								)}
							</CardContent>
							<CardFooter>
								<Button
									className="w-full"
									disabled={!validation.valid || !oneSatContext}
									onClick={openReview}
								>
									{oneSatContext
										? "Review transaction"
										: "Connect a wallet to continue"}
								</Button>
							</CardFooter>
						</>
					)}

					{stage === "review" && (
						<>
							<CardContent className="space-y-3 text-sm">
								<div className="flex justify-between gap-4">
									<span>Action</span>
									<strong>{labels[mode]}</strong>
								</div>
								<div className="flex justify-between gap-4">
									<span>Content</span>
									<span className="text-right font-mono">
										{formatBytes(byteLength)} · {contentType}
									</span>
								</div>
								<div className="flex justify-between gap-4">
									<span>Inscription output</span>
									<span>1 satoshi</span>
								</div>
								{stream && (
									<div className="flex justify-between gap-4">
										<span>Delivery</span>
										<span>OrdFS stream chain</span>
									</div>
								)}
								{signWithBap && (
									<div className="flex justify-between gap-4">
										<span>Identity seal</span>
										<span>BAP/Sigma permission requested</span>
									</div>
								)}
								{collectionMode && (
									<div className="flex justify-between gap-4">
										<span>Identity seal</span>
										<span>BAP/Sigma required by action</span>
									</div>
								)}
								<div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
									Network fee and total are not quoted by the installed action.
									The connected wallet calculates them and must ask for final
									approval.
								</div>
							</CardContent>
							<CardFooter className="gap-2">
								<Button variant="outline" onClick={() => setStage("edit")}>
									Back
								</Button>
								<Button className="flex-1" onClick={execute}>
									Approve in wallet
								</Button>
							</CardFooter>
						</>
					)}

					{stage === "submitting" && (
						<CardContent
							className="flex min-h-56 flex-col items-center justify-center gap-4 text-center"
							role="status"
						>
							<Loader2 className="size-8 animate-spin" />
							<div>
								<p className="font-medium">Waiting for wallet and broadcast</p>
								<p className="text-sm text-muted-foreground">
									Keep this page open. A permission or spending prompt may
									appear.
								</p>
							</div>
						</CardContent>
					)}

					{stage === "error" && (
						<>
							<CardContent className="space-y-4" role="alert">
								<p className="text-sm text-destructive">{failure}</p>
								{partialTxids.length > 0 && (
									<div className="rounded-md border p-3 text-sm">
										<p className="font-medium">Unbroadcast stream recovery</p>
										<p className="text-muted-foreground">
											The action created {partialTxids.length} local chunk
											transaction(s), but did not batch-broadcast the incomplete
											chain. Retrying keeps this draft intact.
										</p>
									</div>
								)}
							</CardContent>
							<CardFooter className="gap-2">
								<Button variant="outline" onClick={() => setStage("edit")}>
									Edit draft
								</Button>
								<Button className="flex-1" onClick={() => setStage("review")}>
									Review and retry
								</Button>
							</CardFooter>
						</>
					)}

					{stage === "success" && result && (
						<>
							<CardContent className="space-y-4" aria-live="polite">
								<div className="flex items-center gap-2 text-primary">
									<CheckCircle2 className="size-5" />
									<strong>Broadcast accepted</strong>
								</div>
								<div className="break-all rounded-md border p-3 font-mono text-xs">
									{result.txid}
								</div>
								{result.collectionId && (
									<div className="space-y-1">
										<p className="text-sm font-medium">Collection ID</p>
										<p className="break-all font-mono text-xs">
											{result.collectionId}
										</p>
									</div>
								)}
								{result.contentHash && (
									<div className="space-y-1">
										<p className="text-sm font-medium">Content SHA-256</p>
										<p className="break-all font-mono text-xs">
											{result.contentHash}
										</p>
									</div>
								)}
								{result.streamed && (
									<Badge variant="secondary">
										Streamed · {result.txids?.length ?? 1} transactions
									</Badge>
								)}
								<div className="rounded-md border p-3 text-sm">
									<p className="font-medium">Indexer status</p>
									<p className="text-muted-foreground">
										{indexing === "checking" &&
											"Checking typed ORDFS metadata…"}
										{indexing === "confirmed" && "ORDFS metadata is available."}
										{indexing === "pending" &&
											"Not indexed yet. Broadcast success is preserved; try again shortly."}
										{indexing === "error" &&
											"The ORDFS status check failed. Broadcast success is preserved; retry when the service recovers."}
										{indexing === "unavailable" &&
											"Index confirmation is disabled because ORDFS capability or services are unavailable. The mint result is still valid."}
										{indexing === "idle" &&
											"This action does not expose an index confirmation."}
									</p>
									{(indexing === "pending" ||
										indexing === "error" ||
										indexing === "unavailable") &&
										stackFeatures.data?.capabilities.has("ordfs") &&
										services && (
											<Button
												className="mt-3"
												size="sm"
												variant="outline"
												onClick={() => checkIndexing(result.outpoint)}
											>
												<RefreshCcw className="size-3.5" />
												Check again
											</Button>
										)}
								</div>
								<div className="flex flex-wrap gap-2">
									<Button asChild size="sm" variant="outline">
										<Link href={`/tx/${result.txid}`}>
											Transaction <ExternalLink className="size-3.5" />
										</Link>
									</Button>
									<Button asChild size="sm" variant="outline">
										<Link href={`/outpoint/${result.outpoint}`}>
											Output <ExternalLink className="size-3.5" />
										</Link>
									</Button>
									{contentUrl && indexing === "confirmed" && (
										<Button asChild size="sm" variant="outline">
											<a href={contentUrl} target="_blank" rel="noreferrer">
												Content <ExternalLink className="size-3.5" />
											</a>
										</Button>
									)}
								</div>
							</CardContent>
							<CardFooter>
								<Button
									variant="outline"
									className="w-full"
									onClick={() => {
										setStage("edit");
										setResult(null);
										setIndexing("idle");
									}}
								>
									Start another
								</Button>
							</CardFooter>
						</>
					)}
				</Card>
			</div>

			<Card className="h-fit border-dashed lg:sticky lg:top-6">
				<CardHeader>
					<CardTitle>Preview</CardTitle>
					<CardDescription>
						Local preview only; nothing is uploaded before wallet approval.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex min-h-72 items-center justify-center overflow-hidden">
					<ContentPreview
						file={file}
						previewUrl={previewUrl}
						mode={mode}
						text={text}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
