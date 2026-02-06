"use client";

import {
	Code,
	File as FileIcon,
	Image as ImageIcon,
	Loader2,
	Music,
	Plus,
	RefreshCcw,
	Settings2,
	Trash2,
	Upload,
	Video,
	X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropZoneArea,
	Dropzone,
	DropzoneDescription,
	DropzoneFileList,
	DropzoneFileListItem,
	DropzoneFileMessage,
	DropzoneMessage,
	DropzoneRemoveFile,
	DropzoneRetryFile,
	DropzoneTrigger,
	useDropzone,
} from "@/components/ui/dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSound } from "@/hooks/use-sound";

type MetaMap = {
	key: string;
	value: string;
	idx: number;
};

export default function InscribePage() {
	const { play } = useSound();
	const [activeTab, setActiveTab] = useState("file");
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [fileType, setFileType] = useState<string>("");
	const [isMinting, setIsMinting] = useState(false);
	const [metadata, setMetadata] = useState<MetaMap[]>([]);

	// BSV20 State
	const [bsv20Mode, setBsv20Mode] = useState<"mint" | "deploy">("mint");
	const [bsv20Ticker, setBsv20Ticker] = useState("");
	const [bsv20Amount, setBsv20Amount] = useState("");
	const [bsv20Max, setBsv20Max] = useState("");
	const [bsv20Decimals, setBsv20Decimals] = useState("0");
	const [bsv20Limit, setBsv20Limit] = useState("");

	// BSV21 State (deploy only - no mint mode in BSV21)
	const [bsv21Symbol, setBsv21Symbol] = useState("");
	const [bsv21Max, setBsv21Max] = useState("21000000");
	const [bsv21Decimals, setBsv21Decimals] = useState("");
	const [bsv21Icon, setBsv21Icon] = useState<File | null>(null);
	const [bsv21IconPreview, setBsv21IconPreview] = useState<string | null>(null);
	const [showBsv21Options, setShowBsv21Options] = useState(false);

	const dropzone = useDropzone({
		onDropFile: async (droppedFile) => {
			play("dialog");
			setFile(droppedFile);
			setFileType(droppedFile.type);
			if (droppedFile.type.startsWith("image/")) {
				setPreviewUrl(URL.createObjectURL(droppedFile));
			} else {
				setPreviewUrl(null);
			}
			return { status: "success", result: undefined };
		},
		onRemoveFile: () => {
			setFile(null);
			setFileType("");
			setPreviewUrl(null);
			setMetadata([]);
		},
		validation: {
			maxFiles: 1,
		},
		shiftOnMaxFiles: true,
	});

	const handleAddMetadata = () => {
		let key = "";
		let value = "";
		const initialKeys = [];

		// Suggest "name" if not present and file is selected
		if (!metadata.some((m) => m.key === "name")) {
			key = "name";
			value = file?.name || "";
			initialKeys.push({ key, value, idx: metadata.length });
		}

		const currentData = metadata.concat(initialKeys);
		// Always add a new empty row if we didn't just add the name, or if user clicked plus explicitly
		if (initialKeys.length === 0 || metadata.length > 0) {
			currentData.push({
				key: "",
				value: "",
				idx: currentData.length,
			});
		}

		setMetadata(currentData);
	};

	const updateMetadata = (
		idx: number,
		field: "key" | "value",
		newValue: string,
	) => {
		setMetadata((prev) =>
			prev.map((m) => {
				if (m.idx === idx) {
					return {
						...m,
						[field]:
							field === "key"
								? newValue.replaceAll(/[^a-zA-Z0-9]/g, "")
								: newValue,
					};
				}
				return m;
			}),
		);
	};

	const removeMetadata = (idx: number) => {
		setMetadata((prev) => prev.filter((m) => m.idx !== idx));
	};

	const handleBsv21IconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) return;

		// Validate it's an image
		if (!selectedFile.type.startsWith("image/")) {
			return;
		}

		play("dialog");
		setBsv21Icon(selectedFile);
		setBsv21IconPreview(URL.createObjectURL(selectedFile));
	};

	const removeBsv21Icon = () => {
		setBsv21Icon(null);
		if (bsv21IconPreview) {
			URL.revokeObjectURL(bsv21IconPreview);
		}
		setBsv21IconPreview(null);
	};

	const handleInscribe = async () => {
		setIsMinting(true);
		try {
			// TODO: Implement actual minting logic using js-1sat-ord or WalletService
			// const tx = await walletService.createInscription(...)
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Mock delay
			alert("Inscription created! (Mock)");
		} catch (e) {
			console.error(e);
			alert("Error creating inscription");
		} finally {
			setIsMinting(false);
		}
	};

	const renderFilePreview = () => {
		if (!file) return null;

		if (fileType.startsWith("image/")) {
			if (!previewUrl) return null;
			return (
				<div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-lg border bg-muted">
					<Image
						src={previewUrl}
						alt="Preview"
						fill
						unoptimized
						sizes="300px"
						className="object-contain"
					/>
				</div>
			);
		}

		return (
			<div className="flex aspect-square w-full max-w-[300px] flex-col items-center justify-center rounded-lg border bg-muted p-4 text-center">
				{fileType.startsWith("video/") && (
					<Video className="h-12 w-12 text-muted-foreground mb-2" />
				)}
				{fileType.startsWith("audio/") && (
					<Music className="h-12 w-12 text-muted-foreground mb-2" />
				)}
				{fileType.startsWith("text/") && (
					<Code className="h-12 w-12 text-muted-foreground mb-2" />
				)}
				{!fileType.startsWith("video/") &&
					!fileType.startsWith("audio/") &&
					!fileType.startsWith("text/") && (
						<FileIcon className="h-12 w-12 text-muted-foreground mb-2" />
					)}
				<p className="text-sm font-medium">{file.name}</p>
				<p className="text-xs text-muted-foreground">
					{(file.size / 1024).toFixed(2)} KB
				</p>
			</div>
		);
	};

	return (
		<Page>
			<PageHeader>
				<PageTitle>Inscribe</PageTitle>
			</PageHeader>
			<PageContent>
				<div className="grid gap-6 lg:grid-cols-2">
					<Tabs
						defaultValue="file"
						value={activeTab}
						onValueChange={(value) => {
							play("click");
							setActiveTab(value);
						}}
						className="w-full lg:col-span-1"
					>
						<TabsList className="grid w-full grid-cols-3 mb-4">
							<TabsTrigger value="file">File</TabsTrigger>
							<TabsTrigger value="bsv20">BSV20</TabsTrigger>
							<TabsTrigger value="bsv21">BSV21</TabsTrigger>
						</TabsList>

						{/* File Tab */}
						<TabsContent value="file">
							<Card>
								<CardHeader>
									<CardTitle>Inscribe File</CardTitle>
									<CardDescription>
										Upload an image, HTML, or other file.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid w-full gap-1.5">
										<Label htmlFor="file" className="mb-2">
											File
										</Label>
										<Dropzone {...dropzone}>
											<DropzoneMessage />
											<DropZoneArea>
												<DropzoneTrigger className="w-full flex items-center justify-center py-8 rounded-lg hover:bg-muted/50 transition-colors bg-transparent">
													<div className="flex flex-col items-center gap-2 text-center">
														<div className="p-2 bg-muted rounded-full">
															<FileIcon className="h-6 w-6 text-muted-foreground" />
														</div>
														<div className="space-y-1">
															<p className="text-sm font-medium">
																Click to select or drag file here
															</p>
															<p className="text-xs text-muted-foreground">
																Any file type up to 10MB
															</p>
														</div>
													</div>
												</DropzoneTrigger>
												<DropzoneFileList className="mt-4">
													{dropzone.fileStatuses.map((fileStatus) => (
														<DropzoneFileListItem
															key={fileStatus.id}
															file={fileStatus}
														>
															<div className="flex items-center gap-3 flex-1 overflow-hidden">
																<div className="flex items-center justify-center h-8 w-8 rounded-sm bg-background border flex-shrink-0">
																	{fileStatus.file.type.startsWith("image/") ? (
																		<ImageIcon className="h-4 w-4 text-muted-foreground" />
																	) : (
																		<FileIcon className="h-4 w-4 text-muted-foreground" />
																	)}
																</div>
																<div className="flex flex-col min-w-0">
																	<span className="text-sm font-medium truncate">
																		{fileStatus.fileName}
																	</span>
																	<span className="text-xs text-muted-foreground">
																		{(fileStatus.file.size / 1024).toFixed(2)}{" "}
																		KB
																	</span>
																</div>
															</div>
															<DropzoneRetryFile>
																<RefreshCcw className="h-4 w-4" />
															</DropzoneRetryFile>
															<DropzoneRemoveFile>
																<Trash2 className="h-4 w-4 text-destructive" />
															</DropzoneRemoveFile>
															<DropzoneFileMessage />
														</DropzoneFileListItem>
													))}
												</DropzoneFileList>
											</DropZoneArea>
											<DropzoneDescription className="mt-2 text-center">
												Files are processed locally before inscription.
											</DropzoneDescription>
										</Dropzone>
									</div>

									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label>Metadata (Optional)</Label>
											<Button
												size="sm"
												variant="outline"
												onClick={handleAddMetadata}
												className="h-8 gap-1"
											>
												<Plus className="h-3.5 w-3.5" /> Add
											</Button>
										</div>
										<div className="space-y-2">
											{metadata.map((meta) => (
												<div key={meta.idx} className="flex gap-2">
													<Input
														placeholder="Key"
														value={meta.key}
														onChange={(e) =>
															updateMetadata(meta.idx, "key", e.target.value)
														}
														className="flex-1"
													/>
													<Input
														placeholder="Value"
														value={meta.value}
														onChange={(e) =>
															updateMetadata(meta.idx, "value", e.target.value)
														}
														className="flex-1"
													/>
													<Button
														size="icon"
														variant="ghost"
														onClick={() => removeMetadata(meta.idx)}
														className="h-10 w-10 text-muted-foreground hover:text-destructive"
													>
														<X className="h-4 w-4" />
													</Button>
												</div>
											))}
											{metadata.length === 0 && (
												<div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
													No metadata added
												</div>
											)}
										</div>
									</div>
								</CardContent>
								<CardFooter>
									<Button
										className="w-full"
										onClick={handleInscribe}
										disabled={!file || isMinting}
									>
										{isMinting && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Inscribe
									</Button>
								</CardFooter>
							</Card>
						</TabsContent>

						{/* BSV20 Tab */}
						<TabsContent value="bsv20">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle>BSV20</CardTitle>
										<div className="flex bg-muted rounded-lg p-1">
											<Button
												variant={bsv20Mode === "mint" ? "secondary" : "ghost"}
												size="sm"
												onClick={() => setBsv20Mode("mint")}
												className="h-7 text-xs"
											>
												Mint
											</Button>
											<Button
												variant={bsv20Mode === "deploy" ? "secondary" : "ghost"}
												size="sm"
												onClick={() => setBsv20Mode("deploy")}
												className="h-7 text-xs"
											>
												Deploy
											</Button>
										</div>
									</div>
									<CardDescription>
										{bsv20Mode === "mint"
											? "Mint existing BSV20 tokens."
											: "Deploy a new BSV20 token ticker."}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-2">
										<Label htmlFor="bsv20-ticker">Ticker</Label>
										<Input
											id="bsv20-ticker"
											placeholder="e.g. PEPE"
											value={bsv20Ticker}
											onChange={(e) =>
												setBsv20Ticker(e.target.value.toUpperCase())
											}
											maxLength={4}
										/>
									</div>

									{bsv20Mode === "mint" ? (
										<div className="grid gap-2">
											<Label htmlFor="bsv20-amount">Amount</Label>
											<Input
												id="bsv20-amount"
												type="number"
												placeholder="1000"
												value={bsv20Amount}
												onChange={(e) => setBsv20Amount(e.target.value)}
											/>
										</div>
									) : (
										<>
											<div className="grid gap-2">
												<Label htmlFor="bsv20-max">Max Supply</Label>
												<Input
													id="bsv20-max"
													type="number"
													placeholder="21000000"
													value={bsv20Max}
													onChange={(e) => setBsv20Max(e.target.value)}
												/>
											</div>
											<div className="grid gap-2">
												<Label htmlFor="bsv20-limit">Mint Limit</Label>
												<Input
													id="bsv20-limit"
													type="number"
													placeholder="1000"
													value={bsv20Limit}
													onChange={(e) => setBsv20Limit(e.target.value)}
												/>
											</div>
											<div className="grid gap-2">
												<Label htmlFor="bsv20-dec">Decimals</Label>
												<Input
													id="bsv20-dec"
													type="number"
													placeholder="0"
													value={bsv20Decimals}
													onChange={(e) => setBsv20Decimals(e.target.value)}
												/>
											</div>
										</>
									)}
								</CardContent>
								<CardFooter>
									<Button
										className="w-full"
										onClick={handleInscribe}
										disabled={!bsv20Ticker || isMinting}
									>
										{isMinting && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										{bsv20Mode === "mint" ? "Mint Tokens" : "Deploy Ticker"}
									</Button>
								</CardFooter>
							</Card>
						</TabsContent>

						{/* BSV21 Tab */}
						<TabsContent value="bsv21">
							<Card>
								<CardHeader>
									<CardTitle>Deploy New Token</CardTitle>
									<CardDescription>
										Deploy a new BSV21 token with an icon. All tokens are minted
										to your wallet on deployment.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-2">
										<div className="flex items-center justify-between">
											<Label htmlFor="bsv21-sym">Symbol</Label>
											<span className="text-xs text-muted-foreground">
												Not required to be unique
											</span>
										</div>
										<Input
											id="bsv21-sym"
											placeholder="e.g. MYTOKEN"
											value={bsv21Symbol}
											maxLength={255}
											onKeyDown={(e) => {
												if (e.key === " " || e.key === "Enter") {
													e.preventDefault();
												}
											}}
											onChange={(e) => setBsv21Symbol(e.target.value)}
										/>
									</div>

									<div className="grid gap-2">
										<div className="flex items-center justify-between">
											<Label>Upload Icon</Label>
											<span className="text-xs text-muted-foreground">
												Square image recommended
											</span>
										</div>
										<div className="flex items-center gap-4">
											{bsv21IconPreview ? (
												<div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted">
													<Image
														src={bsv21IconPreview}
														alt="Token icon preview"
														fill
														unoptimized
														sizes="80px"
														className="object-cover"
													/>
													<Button
														type="button"
														variant="destructive"
														size="icon"
														className="absolute top-1 right-1 h-6 w-6"
														onClick={removeBsv21Icon}
													>
														<X className="h-3 w-3" />
													</Button>
												</div>
											) : (
												<div className="w-20 h-20 rounded-lg border border-dashed bg-muted/50 flex items-center justify-center">
													<ImageIcon className="h-8 w-8 text-muted-foreground/50" />
												</div>
											)}
											<div className="flex-1">
												<Label
													htmlFor="bsv21-icon"
													className="flex items-center justify-center gap-2 w-full h-10 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
												>
													<Upload className="h-4 w-4" />
													{bsv21Icon ? "Change Icon" : "Select Image"}
												</Label>
												<input
													type="file"
													id="bsv21-icon"
													accept="image/*"
													className="sr-only"
													onChange={handleBsv21IconSelect}
												/>
											</div>
										</div>
									</div>

									<div className="grid gap-2">
										<div className="flex items-center justify-between">
											<Label htmlFor="bsv21-max">Max Supply</Label>
											<span className="text-xs text-muted-foreground">
												Whole tokens
											</span>
										</div>
										<Input
											id="bsv21-max"
											type="text"
											inputMode="numeric"
											pattern="\d+"
											placeholder="21000000"
											value={bsv21Max}
											onChange={(e) =>
												setBsv21Max(e.target.value.replace(/[^0-9]/g, ""))
											}
										/>
									</div>

									<Collapsible
										open={showBsv21Options}
										onOpenChange={setShowBsv21Options}
									>
										<CollapsibleTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="w-full justify-end gap-2 text-primary hover:text-primary"
												onClick={() => play("click")}
											>
												<Settings2 className="h-4 w-4" />
												More Options
											</Button>
										</CollapsibleTrigger>
										<CollapsibleContent className="space-y-4 pt-4">
											<div className="grid gap-2">
												<div className="flex items-center justify-between">
													<Label htmlFor="bsv21-dec">Decimal Precision</Label>
													<span className="text-xs text-muted-foreground">
														Default: 8
													</span>
												</div>
												<Input
													id="bsv21-dec"
													type="number"
													min={0}
													max={18}
													placeholder="8"
													value={bsv21Decimals}
													onChange={(e) => setBsv21Decimals(e.target.value)}
												/>
											</div>
										</CollapsibleContent>
									</Collapsible>

									<div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3 text-sm text-blue-200">
										BSV21 deployments are indexed immediately. A listing fee may
										be required before it shows up in some areas on the website.
									</div>
								</CardContent>
								<CardFooter>
									<Button
										className="w-full"
										onClick={handleInscribe}
										disabled={
											!bsv21Symbol || !bsv21Icon || !bsv21Max || isMinting
										}
									>
										{isMinting && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Preview
									</Button>
								</CardFooter>
							</Card>
						</TabsContent>
					</Tabs>

					{/* Preview Section - Always visible on large screens */}
					<div className="space-y-6">
						<Card className="h-full border-dashed">
							<CardHeader>
								<CardTitle>Preview</CardTitle>
								<CardDescription>
									See how your inscription will look.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col items-center justify-center min-h-[300px]">
								{activeTab === "file" && file ? (
									renderFilePreview()
								) : activeTab === "bsv20" && bsv20Ticker ? (
									<div className="text-center space-y-2">
										<div className="text-4xl font-bold">{bsv20Ticker}</div>
										<div className="text-sm text-muted-foreground">
											BSV20 {bsv20Mode === "mint" ? "Mint" : "Deploy"}
										</div>
										{bsv20Mode === "mint" && (
											<div className="text-xl">{bsv20Amount}</div>
										)}
									</div>
								) : activeTab === "bsv21" && bsv21Symbol ? (
									<div className="text-center space-y-4">
										{bsv21IconPreview ? (
											<div className="mx-auto w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50">
												<Image
													src={bsv21IconPreview}
													alt={`${bsv21Symbol} icon`}
													fill
													unoptimized
													sizes="96px"
													className="object-cover"
												/>
											</div>
										) : (
											<div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold">
												{bsv21Symbol[0] || "?"}
											</div>
										)}
										<div className="space-y-1">
											<div className="text-2xl font-bold">{bsv21Symbol}</div>
											<div className="text-sm text-muted-foreground">
												BSV21 Deploy
											</div>
											{bsv21Max && (
												<div className="text-sm text-muted-foreground">
													Supply: {Number(bsv21Max).toLocaleString()}
												</div>
											)}
										</div>
									</div>
								) : (
									<div className="text-muted-foreground text-center">
										<div className="mb-2 flex justify-center">
											<ImageIcon className="h-10 w-10 opacity-20" />
										</div>
										Configure an inscription to see preview
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</PageContent>
		</Page>
	);
}
