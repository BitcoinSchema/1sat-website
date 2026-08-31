"use client";

import type { CertificateResult, WalletInterface } from "@bsv/sdk";
import {
	BadgeCheck,
	Copy,
	FileKey2,
	Loader2,
	Plus,
	RefreshCw,
	ShieldAlert,
	Trash2,
} from "lucide-react";
import { type FormEvent, useState } from "react";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	buildSelectiveCertificateProof,
	CERTIFICATE_PAGE_SIZE,
	parseCertificateAcquisitionRequest,
	useCertificates,
} from "@/hooks/use-certificates";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

function acquisitionFailure() {
	reportDiagnostic({
		category: "action",
		code: "action.failed",
		operation: "wallet.certificate.acquire",
		recoverable: true,
		context: { retryable: true },
	});
}

function AcquireCertificateDialog({
	wallet,
	onAcquired,
}: {
	wallet: WalletInterface;
	onAcquired: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [request, setRequest] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const acquire = async (event: FormEvent) => {
		event.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const args = parseCertificateAcquisitionRequest(request);
			await wallet.acquireCertificate(args);
			setRequest("");
			setOpen(false);
			onAcquired();
		} catch (reason) {
			acquisitionFailure();
			setError(
				reason instanceof SyntaxError
					? "The acquisition request is not valid JSON."
					: reason instanceof Error &&
							(reason.message.startsWith("The acquisition request") ||
								reason.message.startsWith("The acquisitionProtocol"))
						? reason.message
						: "The wallet rejected the request. Check the issuer, certificate type, and protocol support.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus /> Acquire certificate
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<form className="space-y-4" onSubmit={acquire}>
					<DialogHeader>
						<DialogTitle>Acquire a BRC-100 certificate</DialogTitle>
						<DialogDescription>
							Paste canonical `AcquireCertificateArgs` supplied by a trusted
							issuer. The connected wallet validates and processes the request.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="certificate-acquisition-request">
							Acquisition request JSON
						</Label>
						<Textarea
							id="certificate-acquisition-request"
							className="min-h-56 font-mono text-xs"
							onChange={(event) => setRequest(event.target.value)}
							placeholder={
								'{"type":"…","certifier":"…","acquisitionProtocol":"issuance","fields":{"name":"Ada"},"certifierUrl":"https://issuer.example"}'
							}
							spellCheck={false}
							value={request}
						/>
					</div>
					<p className="text-muted-foreground text-xs">
						Issuer availability and supported types are controlled by the issuer
						and selected wallet. This website does not certify providers.
					</p>
					{error && (
						<p className="text-destructive text-sm" role="alert">
							{error}
						</p>
					)}
					<DialogFooter>
						<Button disabled={!request.trim() || submitting} type="submit">
							{submitting && <Loader2 className="animate-spin" />}
							{submitting ? "Requesting…" : "Send to wallet"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function CertificateProofDialog({
	certificate,
	wallet,
}: {
	certificate: CertificateResult;
	wallet: WalletInterface;
}) {
	const fields = Object.keys(certificate.fields).sort();
	const [open, setOpen] = useState(false);
	const [verifier, setVerifier] = useState("");
	const [selected, setSelected] = useState<string[]>([]);
	const [proof, setProof] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [copied, setCopied] = useState(false);

	const toggleField = (field: string) => {
		setProof(null);
		setSelected((current) =>
			current.includes(field)
				? current.filter((name) => name !== field)
				: [...current, field],
		);
	};

	const createProof = async (event: FormEvent) => {
		event.preventDefault();
		setSubmitting(true);
		setProof(null);
		setError(null);
		try {
			const result = await wallet.proveCertificate({
				certificate: {
					type: certificate.type,
					subject: certificate.subject,
					serialNumber: certificate.serialNumber,
					certifier: certificate.certifier,
					revocationOutpoint: certificate.revocationOutpoint,
					signature: certificate.signature,
					fields: certificate.fields,
				},
				fieldsToReveal: selected,
				verifier,
			});
			setProof(
				JSON.stringify(
					buildSelectiveCertificateProof(certificate, selected, result),
					null,
					2,
				),
			);
		} catch {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "wallet.certificate.prove",
				recoverable: true,
				context: { retryable: true },
			});
			setError(
				"The wallet could not create this proof. Check the verifier key and selected fields.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) {
			setVerifier("");
			setSelected([]);
			setProof(null);
			setError(null);
			setCopied(false);
		}
	};

	const copyProof = async () => {
		if (!proof) return;
		try {
			await navigator.clipboard.writeText(proof);
			setCopied(true);
		} catch {
			setError(
				"The browser could not copy the proof. Select the JSON manually.",
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button disabled={fields.length === 0} size="sm" variant="outline">
					<FileKey2 /> Create proof
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
				<form className="space-y-5" onSubmit={createProof}>
					<DialogHeader>
						<DialogTitle>Create a selective certificate proof</DialogTitle>
						<DialogDescription>
							Choose exactly which certified fields the verifier may decrypt.
							Unselected values remain concealed.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor={`verifier-${certificate.serialNumber}`}>
							Verifier public identity key
						</Label>
						<Input
							id={`verifier-${certificate.serialNumber}`}
							className="font-mono"
							onChange={(event) => {
								setVerifier(event.target.value.trim());
								setProof(null);
							}}
							placeholder="02… or 03…"
							spellCheck={false}
							value={verifier}
						/>
					</div>
					<fieldset className="space-y-2">
						<legend className="font-medium text-sm">Fields to reveal</legend>
						<div className="grid gap-2 sm:grid-cols-2">
							{fields.map((field) => (
								<label
									className="flex items-center gap-2 rounded-md border p-3 text-sm"
									key={field}
								>
									<input
										checked={selected.includes(field)}
										onChange={() => toggleField(field)}
										type="checkbox"
									/>
									<span className="break-all font-mono">{field}</span>
								</label>
							))}
						</div>
					</fieldset>
					<div className="rounded-md border bg-muted/40 p-3 text-sm">
						<p className="font-medium">Disclosure preview</p>
						<p className="mt-1 break-all text-muted-foreground">
							Verifier: {verifier || "not entered"}
						</p>
						<p className="mt-1 text-muted-foreground">
							Fields:{" "}
							{selected.length ? [...selected].sort().join(", ") : "none"}
						</p>
					</div>
					{error && (
						<p className="text-destructive text-sm" role="alert">
							{error}
						</p>
					)}
					{proof && (
						<div className="space-y-2">
							<div className="flex items-center justify-between gap-2">
								<Label htmlFor={`proof-${certificate.serialNumber}`}>
									Verifiable certificate JSON
								</Label>
								<Button
									onClick={() => void copyProof()}
									size="sm"
									type="button"
								>
									<Copy /> {copied ? "Copied" : "Copy proof"}
								</Button>
							</div>
							<Textarea
								id={`proof-${certificate.serialNumber}`}
								className="min-h-48 font-mono text-xs"
								readOnly
								value={proof}
							/>
						</div>
					)}
					<DialogFooter>
						<Button
							disabled={!verifier || selected.length === 0 || submitting}
							type="submit"
						>
							{submitting && <Loader2 className="animate-spin" />}
							{submitting ? "Creating…" : "Confirm disclosure"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function RelinquishCertificateDialog({
	certificate,
	wallet,
	onRelinquished,
}: {
	certificate: CertificateResult;
	wallet: WalletInterface;
	onRelinquished: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const relinquish = async () => {
		setSubmitting(true);
		setError(null);
		try {
			await wallet.relinquishCertificate({
				type: certificate.type,
				serialNumber: certificate.serialNumber,
				certifier: certificate.certifier,
			});
			setOpen(false);
			onRelinquished();
		} catch {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "wallet.certificate.relinquish",
				recoverable: true,
				context: { retryable: true },
			});
			setError("The wallet could not relinquish this certificate. Try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button size="sm" variant="destructive">
					<Trash2 /> Relinquish
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Relinquish this certificate?</AlertDialogTitle>
					<AlertDialogDescription>
						This permanently removes the certificate from the selected wallet.
						It does not revoke the issuer&apos;s certificate on-chain.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="rounded-md border p-3 text-xs">
					<p className="break-all font-mono">Type: {certificate.type}</p>
					<p className="mt-1 break-all font-mono">
						Serial: {certificate.serialNumber}
					</p>
				</div>
				{error && (
					<p className="text-destructive text-sm" role="alert">
						{error}
					</p>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						disabled={submitting}
						onClick={(event) => {
							event.preventDefault();
							void relinquish();
						}}
					>
						{submitting && <Loader2 className="animate-spin" />}
						{submitting ? "Relinquishing…" : "Relinquish certificate"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function CertificateCard({
	certificate,
	wallet,
	onChanged,
}: {
	certificate: CertificateResult;
	wallet: WalletInterface;
	onChanged: () => void;
}) {
	const fields = Object.keys(certificate.fields).sort();
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<BadgeCheck className="size-5" /> Identity certificate
				</CardTitle>
				<CardDescription className="break-all font-mono text-xs">
					{certificate.serialNumber}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<dl className="grid gap-3 text-sm sm:grid-cols-[7rem_1fr]">
					<dt className="text-muted-foreground">Type</dt>
					<dd className="break-all font-mono text-xs">{certificate.type}</dd>
					<dt className="text-muted-foreground">Issuer</dt>
					<dd className="break-all font-mono text-xs">
						{certificate.certifier}
					</dd>
					<dt className="text-muted-foreground">Verifier</dt>
					<dd className="break-all font-mono text-xs">
						{certificate.verifier ?? "Not attached"}
					</dd>
					<dt className="text-muted-foreground">Fields</dt>
					<dd className="flex flex-wrap gap-1.5">
						{fields.length ? (
							fields.map((field) => (
								<Badge key={field} variant="outline">
									{field}
								</Badge>
							))
						) : (
							<span className="text-muted-foreground">No fields</span>
						)}
					</dd>
				</dl>
				<p className="text-muted-foreground text-xs">
					Field names are visible; encrypted values and keyrings are never shown
					in the inventory.
				</p>
				<div className="flex flex-wrap gap-2">
					<CertificateProofDialog certificate={certificate} wallet={wallet} />
					<RelinquishCertificateDialog
						certificate={certificate}
						onRelinquished={onChanged}
						wallet={wallet}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

export function CertificateCenter() {
	const { identityKey, isInitialized, wallet } = useWalletToolbox();
	const { certificates, error, page, refresh, setPage, totalCertificates } =
		useCertificates(wallet, isInitialized, identityKey);
	const [status, setStatus] = useState<string | null>(null);

	if (!wallet) {
		return (
			<Card>
				<CardHeader className="text-center">
					<ShieldAlert className="mx-auto size-10 text-muted-foreground" />
					<CardTitle className="text-lg">Unlock or connect a wallet</CardTitle>
					<CardDescription>
						Certificates are read through the active BRC-100 wallet.
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const changed = (message: string) => {
		setStatus(message);
		refresh();
	};
	const first = page * CERTIFICATE_PAGE_SIZE + 1;
	const last = Math.min(
		page * CERTIFICATE_PAGE_SIZE + (certificates?.length ?? 0),
		totalCertificates,
	);

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="font-semibold text-lg">Certificate inventory</h2>
					<p className="text-muted-foreground text-sm">
						BRC-52 certificates held by the active wallet.
					</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={refresh} size="sm" variant="outline">
						<RefreshCw /> Refresh
					</Button>
					<AcquireCertificateDialog
						onAcquired={() => changed("Certificate acquired.")}
						wallet={wallet}
					/>
				</div>
			</div>
			{status && (
				<p aria-live="polite" className="text-sm" role="status">
					{status}
				</p>
			)}
			{error ? (
				<Card>
					<CardContent className="flex flex-wrap items-center gap-3 text-destructive text-sm">
						<span role="alert">{error}</span>
						<Button onClick={refresh} size="sm" variant="outline">
							Try again
						</Button>
					</CardContent>
				</Card>
			) : !isInitialized || certificates === null ? (
				<div
					aria-live="polite"
					className="flex items-center gap-2 py-10 text-muted-foreground text-sm"
					role="status"
				>
					<Loader2 className="size-4 animate-spin" /> Loading certificates…
				</div>
			) : certificates.length === 0 ? (
				<Card>
					<CardHeader className="text-center">
						<BadgeCheck className="mx-auto size-10 text-muted-foreground" />
						<CardTitle className="text-lg">
							{page === 0 ? "No certificates" : "No certificates on this page"}
						</CardTitle>
						<CardDescription>
							{page === 0
								? "Acquire a certificate from a trusted issuer to see it here."
								: "Return to the previous page or refresh the inventory."}
						</CardDescription>
					</CardHeader>
				</Card>
			) : (
				<div className="grid gap-4">
					{certificates.map((certificate) => (
						<CertificateCard
							certificate={certificate}
							key={`${certificate.certifier}:${certificate.type}:${certificate.serialNumber}`}
							onChanged={() => changed("Certificate relinquished.")}
							wallet={wallet}
						/>
					))}
				</div>
			)}
			{certificates && totalCertificates > 0 && (
				<div className="flex flex-wrap items-center justify-between gap-3 text-muted-foreground text-sm">
					<span>
						{certificates.length
							? `Showing ${first}–${last} of ${totalCertificates}`
							: `No certificates on page ${page + 1}`}
					</span>
					<div className="flex gap-2">
						<Button
							disabled={page === 0}
							onClick={() => setPage(page - 1)}
							size="sm"
							variant="outline"
						>
							Previous
						</Button>
						<Button
							disabled={last >= totalCertificates}
							onClick={() => setPage(page + 1)}
							size="sm"
							variant="outline"
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
