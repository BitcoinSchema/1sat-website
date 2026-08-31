"use client";

import {
	attest,
	getProfile,
	publishIdentity,
	resolveBapId,
	rotateIdentity,
	updateProfile,
} from "@1sat/actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BadgeCheck,
	Fingerprint,
	Loader2,
	RefreshCw,
	Search,
	ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useStackFeatures } from "@/lib/hooks/use-stack-features";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import {
	BAP_DISCOVERY_PAGE_SIZE,
	type BapAttestationReview,
	type BapProfileDraft,
	buildBapAttestationReview,
	hasProfileErrors,
	identityActionMessage,
	normalizeBapDiscovery,
	profileDraftFromRecord,
	validateBapProfile,
} from "@/lib/wallet/bap-identity";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

const PROFILE_FIELDS: Array<{
	field: keyof BapProfileDraft;
	label: string;
	placeholder: string;
}> = [
	{ field: "name", label: "Name", placeholder: "Satoshi Nakamoto" },
	{ field: "alternateName", label: "Handle", placeholder: "satoshi" },
	{ field: "email", label: "Email", placeholder: "satoshi@example.com" },
	{ field: "paymail", label: "Paymail", placeholder: "satoshi@1sat.app" },
	{
		field: "image",
		label: "Image URL",
		placeholder: "https://example.com/avatar.png",
	},
];

type ActionStatus =
	| { kind: "success"; message: string }
	| { kind: "error"; message: string }
	| null;

function StatusMessage({ status }: { status: ActionStatus }) {
	if (!status) return null;
	return (
		<p
			aria-live="polite"
			className={
				status.kind === "error" ? "text-destructive text-sm" : "text-sm"
			}
			role="status"
		>
			{status.message}
		</p>
	);
}

function ProfileEditor({
	bapId,
	profile,
	onRefresh,
}: {
	bapId: string | null;
	profile?: Record<string, unknown>;
	onRefresh: () => Promise<void>;
}) {
	const { oneSatContext, refreshBalance } = useWalletToolbox();
	const queryClient = useQueryClient();
	const stackFeatures = useStackFeatures();
	const [draft, setDraft] = useState(() => profileDraftFromRecord(profile));
	const [reviewOpen, setReviewOpen] = useState(false);
	const [status, setStatus] = useState<ActionStatus>(null);
	const [operation, setOperation] = useState<
		"profile" | "publish" | "rotate" | null
	>(null);
	const validation = useMemo(() => validateBapProfile(draft), [draft]);
	const profileEntries = Object.entries(validation.profile).filter(
		([field]) => field !== "@type",
	);

	const invalidateIdentity = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["bap-wallet-profile"] }),
			queryClient.invalidateQueries({ queryKey: ["bap-discovery"] }),
		]);
		await refreshBalance();
		await onRefresh();
	};

	const saveProfile = async () => {
		if (!oneSatContext || hasProfileErrors(validation.errors)) return;
		setReviewOpen(false);
		setOperation("profile");
		setStatus(null);
		try {
			const result = await updateProfile.execute(oneSatContext, {
				profile: validation.profile,
			});
			if (result.error) throw new Error(result.error);
			let indexMessage = " The 1Sat BAP index has not been confirmed.";
			if (stackFeatures.data?.features.identity && result.bapId) {
				try {
					await oneSatContext.services?.bap.getProfile(result.bapId);
					indexMessage = " The profile is visible through the 1Sat BAP index.";
				} catch {
					indexMessage =
						" Index confirmation is pending; refresh discovery later.";
				}
			}
			setStatus({
				kind: "success",
				message: `Profile transaction ${result.txid ?? "submitted"}.${indexMessage}`,
			});
			await invalidateIdentity();
		} catch (error) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "bap-profile-update",
				recoverable: true,
			});
			setStatus({
				kind: "error",
				message: identityActionMessage("profile", error),
			});
		} finally {
			setOperation(null);
		}
	};

	const publish = async () => {
		if (!oneSatContext) return;
		setOperation("publish");
		setStatus(null);
		try {
			const result = await publishIdentity.execute(oneSatContext, {});
			if (result.error) throw new Error(result.error);
			setStatus({
				kind: "success",
				message: `Identity ${result.bapId ?? "created"} was submitted in ${result.txid ?? "a wallet transaction"}.`,
			});
			await invalidateIdentity();
		} catch (error) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "bap-identity-publish",
				recoverable: true,
			});
			setStatus({
				kind: "error",
				message: identityActionMessage("publish", error),
			});
		} finally {
			setOperation(null);
		}
	};

	const rotate = async () => {
		if (!oneSatContext) return;
		setOperation("rotate");
		setStatus(null);
		try {
			const result = await rotateIdentity.execute(oneSatContext, {});
			if (result.error) throw new Error(result.error);
			setStatus({
				kind: "success",
				message: `Signing key rotation ${result.txid ?? "submitted"}.`,
			});
			await invalidateIdentity();
		} catch (error) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "bap-identity-rotate",
				recoverable: true,
			});
			setStatus({
				kind: "error",
				message: identityActionMessage("rotate", error),
			});
		} finally {
			setOperation(null);
		}
	};

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3">
				<Badge variant={bapId ? "default" : "secondary"}>
					{bapId ? "Published in wallet" : "Not published"}
				</Badge>
				{bapId && <code className="break-all text-xs">{bapId}</code>}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				{PROFILE_FIELDS.map(({ field, label, placeholder }) => (
					<div className="space-y-2" key={field}>
						<Label htmlFor={`bap-${field}`}>{label}</Label>
						<Input
							aria-describedby={
								validation.errors[field] ? `bap-${field}-error` : undefined
							}
							aria-invalid={Boolean(validation.errors[field])}
							id={`bap-${field}`}
							onChange={(event) =>
								setDraft((current) => ({
									...current,
									[field]: event.target.value,
								}))
							}
							placeholder={placeholder}
							value={draft[field]}
						/>
						{validation.errors[field] && (
							<p className="text-destructive text-xs" id={`bap-${field}-error`}>
								{validation.errors[field]}
							</p>
						)}
					</div>
				))}
			</div>
			<div className="space-y-2">
				<Label htmlFor="bap-description">Public bio</Label>
				<Textarea
					aria-describedby={
						validation.errors.description ? "bap-description-error" : undefined
					}
					aria-invalid={Boolean(validation.errors.description)}
					id="bap-description"
					onChange={(event) =>
						setDraft((current) => ({
							...current,
							description: event.target.value,
						}))
					}
					placeholder="A short public description"
					value={draft.description}
				/>
				{validation.errors.description && (
					<p className="text-destructive text-xs" id="bap-description-error">
						{validation.errors.description}
					</p>
				)}
			</div>
			<p className="text-muted-foreground text-xs">
				Every non-empty field is published publicly on-chain. Email and Paymail
				are not hidden.
			</p>
			<StatusMessage status={status} />
			<div className="flex flex-wrap gap-2">
				<Button
					disabled={
						operation !== null ||
						hasProfileErrors(validation.errors) ||
						profileEntries.length === 0
					}
					onClick={() => setReviewOpen(true)}
				>
					{operation === "profile" && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					Review profile transaction
				</Button>
				{!bapId && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button disabled={operation !== null} variant="outline">
								<Fingerprint className="mr-2 h-4 w-4" /> Publish identity only
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Authorize identity publication?
								</AlertDialogTitle>
								<AlertDialogDescription>
									The active wallet will derive its BAP identity keys, sign an
									ID record, fund it, and broadcast it. No profile fields are
									included.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={() => void publish()}>
									Request wallet authorization
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
				{bapId && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button disabled={operation !== null} variant="outline">
								{operation === "rotate" ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<RefreshCw className="mr-2 h-4 w-4" />
								)}
								Rotate signing key
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>
									Rotate the current BAP signing key?
								</AlertDialogTitle>
								<AlertDialogDescription>
									The outgoing key signs a new ID record that declares the next
									key. The prior address stops being current after indexing.
									Existing records stay linked through the identity chain. This
									broadcast cannot be undone locally.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Keep current key</AlertDialogCancel>
								<AlertDialogAction onClick={() => void rotate()}>
									Authorize rotation
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</div>

			<Dialog onOpenChange={setReviewOpen} open={reviewOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Review public profile transaction</DialogTitle>
						<DialogDescription>
							The active wallet will sign, fund, and broadcast these exact
							public fields.
						</DialogDescription>
					</DialogHeader>
					<dl className="max-h-72 space-y-3 overflow-auto rounded-md border p-3 text-sm">
						{profileEntries.map(([field, value]) => (
							<div key={field}>
								<dt className="font-medium">{field}</dt>
								<dd className="break-words text-muted-foreground">{value}</dd>
							</div>
						))}
					</dl>
					<DialogFooter>
						<Button onClick={() => setReviewOpen(false)} variant="outline">
							Cancel
						</Button>
						<Button onClick={() => void saveProfile()}>
							Request wallet authorization
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function AttestationPanel({ bapId }: { bapId: string | null }) {
	const { oneSatContext, refreshBalance } = useWalletToolbox();
	const queryClient = useQueryClient();
	const [subject, setSubject] = useState("");
	const [attributeUrn, setAttributeUrn] = useState("");
	const [counter, setCounter] = useState("0");
	const [review, setReview] = useState<BapAttestationReview | null>(null);
	const [reviewError, setReviewError] = useState<string | null>(null);
	const [status, setStatus] = useState<ActionStatus>(null);
	const [submitting, setSubmitting] = useState(false);

	const prepareReview = () => {
		try {
			setReview(buildBapAttestationReview({ subject, attributeUrn, counter }));
			setReviewError(null);
		} catch (error) {
			setReview(null);
			setReviewError(
				error instanceof Error ? error.message : "The claim is invalid.",
			);
		}
	};

	const submit = async () => {
		if (!oneSatContext || !review) return;
		const submitted = review;
		setReview(null);
		setSubmitting(true);
		setStatus(null);
		try {
			const result = await attest.execute(oneSatContext, {
				attestationHash: submitted.attestationHash,
				counter: submitted.counter,
			});
			if (result.error) throw new Error(result.error);
			setStatus({
				kind: "success",
				message: `Attestation ${submitted.attestationHash} was submitted in ${result.txid ?? "a wallet transaction"}.`,
			});
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["bap-wallet-profile"] }),
				queryClient.invalidateQueries({ queryKey: ["bap-discovery"] }),
				refreshBalance(),
			]);
		} catch (error) {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "bap-attestation",
				recoverable: true,
			});
			setStatus({
				kind: "error",
				message: identityActionMessage("attest", error),
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ShieldCheck className="h-5 w-5" /> Attest a BAP attribute
				</CardTitle>
				<CardDescription>
					Review the full private claim locally. Only its protocol-derived hash
					and sequence are broadcast and signed by this wallet’s current BAP
					key.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{!bapId && (
					<p className="text-muted-foreground text-sm">
						Publish this wallet’s BAP identity first.
					</p>
				)}
				<div className="space-y-2">
					<Label htmlFor="bap-subject">Subject BAP identity key</Label>
					<Input
						id="bap-subject"
						onChange={(event) => setSubject(event.target.value)}
						value={subject}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="bap-attribute">Exact attribute claim URN</Label>
					<Textarea
						id="bap-attribute"
						onChange={(event) => setAttributeUrn(event.target.value)}
						placeholder="urn:bap:id:name:Alice:unique-secret-nonce"
						value={attributeUrn}
					/>
				</div>
				<div className="max-w-40 space-y-2">
					<Label htmlFor="bap-counter">Sequence</Label>
					<Input
						id="bap-counter"
						inputMode="numeric"
						onChange={(event) => setCounter(event.target.value)}
						value={counter}
					/>
				</div>
				{reviewError && (
					<p className="text-destructive text-sm">{reviewError}</p>
				)}
				<StatusMessage status={status} />
				<Button disabled={!bapId || submitting} onClick={prepareReview}>
					{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Review exact signed claim
				</Button>
			</CardContent>

			<Dialog
				onOpenChange={(open) => !open && setReview(null)}
				open={Boolean(review)}
			>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Authorize BAP attestation?</DialogTitle>
						<DialogDescription>
							Verify the subject, private attribute claim, and exact hash before
							asking the wallet to sign and broadcast.
						</DialogDescription>
					</DialogHeader>
					{review && (
						<dl className="max-h-96 space-y-3 overflow-auto rounded-md border p-3 text-sm">
							{[
								["Subject", review.subject],
								["Attribute", review.attributeName],
								["Attribute value", review.attributeValue],
								["Exact attribute URN", review.attributeUrn],
								["Attribute SHA-256", review.attributeHash],
								["Attestation hash preimage", review.attestationUrn],
								["Exact ATTEST hash", review.attestationHash],
								["Sequence", review.counter],
							].map(([label, value]) => (
								<div key={label}>
									<dt className="font-medium">{label}</dt>
									<dd className="break-all font-mono text-muted-foreground text-xs">
										{value}
									</dd>
								</div>
							))}
						</dl>
					)}
					<DialogFooter>
						<Button onClick={() => setReview(null)} variant="outline">
							Cancel
						</Button>
						<Button onClick={() => void submit()}>
							Request wallet authorization
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Card>
	);
}

function DiscoveryPanel() {
	const { oneSatContext } = useWalletToolbox();
	const stackFeatures = useStackFeatures();
	const [query, setQuery] = useState("");
	const [submittedQuery, setSubmittedQuery] = useState("");
	const [offset, setOffset] = useState(0);
	const indexAvailable = stackFeatures.data?.features.identity === true;
	const searchQuery = useQuery({
		queryKey: ["bap-discovery", submittedQuery, offset],
		queryFn: async () => {
			const client = oneSatContext?.services?.bap;
			if (!client) throw new Error("BAP index client is unavailable");
			const result = await client.searchIdentities(
				submittedQuery,
				BAP_DISCOVERY_PAGE_SIZE,
				offset,
			);
			return normalizeBapDiscovery(result);
		},
		enabled:
			indexAvailable &&
			Boolean(oneSatContext?.services?.bap) &&
			submittedQuery.length > 0,
		staleTime: 30_000,
	});
	const results = searchQuery.data ?? [];

	const search = () => {
		const trimmed = query.trim().slice(0, 100);
		setOffset(0);
		setSubmittedQuery(trimmed);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Search className="h-5 w-5" /> BAP index discovery
				</CardTitle>
				<CardDescription>
					Results come from the public 1Sat BAP index, not from wallet
					certificates. Indexed profile contact fields are hidden here.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-2 sm:flex-row">
					<Input
						aria-label="Search public BAP identities"
						disabled={!indexAvailable}
						onChange={(event) => setQuery(event.target.value)}
						onKeyDown={(event) => event.key === "Enter" && search()}
						placeholder="Search public identities"
						value={query}
					/>
					<Button disabled={!indexAvailable || !query.trim()} onClick={search}>
						Search index
					</Button>
				</div>
				{stackFeatures.isLoading && (
					<p className="text-muted-foreground text-sm">
						Checking stack capabilities…
					</p>
				)}
				{stackFeatures.isError && (
					<p className="text-muted-foreground text-sm">
						The stack capability manifest is unavailable. Discovery stays
						disabled until it can be verified.
					</p>
				)}
				{!stackFeatures.isLoading &&
					!stackFeatures.isError &&
					!indexAvailable && (
						<p className="text-muted-foreground text-sm">
							This stack does not advertise the BAP capability.
						</p>
					)}
				{searchQuery.isLoading && (
					<p className="flex items-center gap-2 text-muted-foreground text-sm">
						<Loader2 className="h-4 w-4 animate-spin" /> Searching the public
						index…
					</p>
				)}
				{searchQuery.isError && (
					<div className="space-y-2">
						<p className="text-destructive text-sm">
							The BAP index search failed. Try again.
						</p>
						<Button
							onClick={() => void searchQuery.refetch()}
							size="sm"
							variant="outline"
						>
							Retry
						</Button>
					</div>
				)}
				{submittedQuery && searchQuery.isSuccess && results.length === 0 && (
					<p className="text-muted-foreground text-sm">
						No indexed identities matched this page.
					</p>
				)}
				<div className="space-y-3">
					{results.map((identity) => (
						<div className="rounded-md border p-3" key={identity.idKey}>
							<div className="flex flex-wrap items-center gap-2">
								<BadgeCheck className="h-4 w-4" />
								<strong>
									{identity.name ??
										identity.alternateName ??
										"Indexed BAP identity"}
								</strong>
							</div>
							<p className="mt-1 break-all font-mono text-muted-foreground text-xs">
								{identity.idKey}
							</p>
							{identity.description && (
								<p className="mt-2 text-sm">{identity.description}</p>
							)}
						</div>
					))}
				</div>
				{submittedQuery && searchQuery.isSuccess && (
					<div className="flex items-center justify-between gap-2">
						<Button
							disabled={offset === 0}
							onClick={() =>
								setOffset(Math.max(0, offset - BAP_DISCOVERY_PAGE_SIZE))
							}
							variant="outline"
						>
							Previous
						</Button>
						<span className="text-muted-foreground text-xs">
							Results {offset + 1}–{offset + results.length}
						</span>
						<Button
							disabled={results.length < BAP_DISCOVERY_PAGE_SIZE}
							onClick={() => setOffset(offset + BAP_DISCOVERY_PAGE_SIZE)}
							variant="outline"
						>
							Next
						</Button>
					</div>
				)}
				<p className="border-t pt-4 text-muted-foreground text-sm">
					WalletInterface certificate discovery is a separate privacy-preserving
					protocol.{" "}
					<Link className="underline" href="/wallet/certificates">
						Open certificate center
					</Link>
					.
				</p>
			</CardContent>
		</Card>
	);
}

export function BapIdentityCenter() {
	const { oneSatContext, identityKey, isInitialized, isInitializing } =
		useWalletToolbox();
	const profileQuery = useQuery({
		queryKey: ["bap-wallet-profile", identityKey],
		queryFn: async () => {
			if (!oneSatContext) throw new Error("Wallet not connected");
			const bapId = await resolveBapId(oneSatContext);
			if (!bapId) return { bapId: null, profile: undefined };
			const result = await getProfile.execute(oneSatContext, {});
			if (result.error?.startsWith("no-profile:")) {
				return { bapId, profile: undefined };
			}
			if (result.error) throw new Error("profile-read-failed");
			return { bapId, profile: result.profile };
		},
		enabled: isInitialized && Boolean(oneSatContext) && Boolean(identityKey),
		staleTime: 30_000,
	});

	if (isInitializing) {
		return (
			<p className="flex items-center gap-2 text-muted-foreground text-sm">
				<Loader2 className="h-4 w-4 animate-spin" /> Loading wallet identity…
			</p>
		);
	}
	if (!isInitialized || !oneSatContext || !identityKey) {
		return (
			<p className="text-muted-foreground text-sm">
				Connect or unlock a wallet to manage its identity.
			</p>
		);
	}
	if (profileQuery.isLoading) {
		return (
			<p className="flex items-center gap-2 text-muted-foreground text-sm">
				<Loader2 className="h-4 w-4 animate-spin" /> Reading wallet identity…
			</p>
		);
	}
	if (profileQuery.isError) {
		return (
			<div className="space-y-2">
				<p className="text-destructive text-sm">
					The wallet identity could not be read safely.
				</p>
				<Button onClick={() => void profileQuery.refetch()} variant="outline">
					Retry
				</Button>
			</div>
		);
	}

	return (
		<Tabs defaultValue="profile">
			<TabsList className="grid h-auto w-full grid-cols-3">
				<TabsTrigger value="profile">Profile</TabsTrigger>
				<TabsTrigger value="attest">Attest</TabsTrigger>
				<TabsTrigger value="discover">Discover</TabsTrigger>
			</TabsList>
			<TabsContent value="profile">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Fingerprint className="h-5 w-5" /> BAP identity
						</CardTitle>
						<CardDescription>
							Wallet-local state from the active BRC-100 provider. The website
							never reads identity keys.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ProfileEditor
							bapId={profileQuery.data?.bapId ?? null}
							onRefresh={async () => {
								await profileQuery.refetch();
							}}
							profile={profileQuery.data?.profile}
						/>
					</CardContent>
				</Card>
			</TabsContent>
			<TabsContent value="attest">
				<AttestationPanel bapId={profileQuery.data?.bapId ?? null} />
			</TabsContent>
			<TabsContent value="discover">
				<DiscoveryPanel />
			</TabsContent>
		</Tabs>
	);
}
