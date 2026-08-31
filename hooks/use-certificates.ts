"use client";

import type {
	AcquireCertificateArgs,
	CertificateResult,
	ProveCertificateResult,
	WalletCertificate,
	WalletInterface,
} from "@bsv/sdk";
import { useEffect, useRef, useState } from "react";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";

export const CERTIFICATE_PAGE_SIZE = 25;

export interface CertificateCenterState {
	identityKey: string | null;
	certificates: CertificateResult[] | null;
	totalCertificates: number;
	error: string | null;
}

export function certificatesForIdentity(
	state: CertificateCenterState,
	identityKey: string | null,
): CertificateCenterState {
	return state.identityKey === identityKey
		? state
		: {
				identityKey,
				certificates: null,
				totalCertificates: 0,
				error: null,
			};
}

export function listCertificatePage(
	wallet: Pick<WalletInterface, "listCertificates">,
	offset: number,
) {
	return wallet.listCertificates({
		certifiers: [],
		types: [],
		limit: CERTIFICATE_PAGE_SIZE,
		offset,
	});
}

export function parseCertificateAcquisitionRequest(
	value: string,
): AcquireCertificateArgs {
	const parsed: unknown = JSON.parse(value);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("The acquisition request must be a JSON object.");
	}

	const protocol = (parsed as { acquisitionProtocol?: unknown })
		.acquisitionProtocol;
	if (protocol !== "direct" && protocol !== "issuance") {
		throw new Error(
			'The acquisitionProtocol must be either "direct" or "issuance".',
		);
	}

	// The installed WalletInterface performs the normative BRC-100 validation.
	return parsed as AcquireCertificateArgs;
}

function coreCertificate(certificate: CertificateResult): WalletCertificate {
	return {
		type: certificate.type,
		subject: certificate.subject,
		serialNumber: certificate.serialNumber,
		certifier: certificate.certifier,
		revocationOutpoint: certificate.revocationOutpoint,
		signature: certificate.signature,
		fields: certificate.fields,
	};
}

export function buildSelectiveCertificateProof(
	certificate: CertificateResult,
	fieldsToReveal: string[],
	result: ProveCertificateResult,
): WalletCertificate & { keyring: Record<string, string> } {
	const core = coreCertificate(certificate);
	const selected = [...new Set(fieldsToReveal)].sort();
	const returned = Object.keys(result.keyringForVerifier).sort();

	if (
		selected.some((field) => !(field in core.fields)) ||
		selected.length !== returned.length ||
		selected.some((field, index) => field !== returned[index])
	) {
		throw new Error("The wallet returned a proof for different fields.");
	}

	return { ...core, keyring: result.keyringForVerifier };
}

export function useCertificates(
	wallet: WalletInterface | null,
	isInitialized: boolean,
	identityKey: string | null,
) {
	const [state, setState] = useState<CertificateCenterState>({
		identityKey: null,
		certificates: null,
		totalCertificates: 0,
		error: null,
	});
	const [pagination, setPagination] = useState({ identityKey, page: 0 });
	const [revision, setRevision] = useState(0);
	const requestSequence = useRef(0);
	const requestId = useRef("");
	const page = pagination.identityKey === identityKey ? pagination.page : 0;

	useEffect(() => {
		const request = `${identityKey}:${page}:${revision}:${++requestSequence.current}`;
		requestId.current = request;
		if (!wallet || !isInitialized) {
			setState({
				identityKey,
				certificates: null,
				totalCertificates: 0,
				error: null,
			});
			return;
		}

		setState({
			identityKey,
			certificates: null,
			totalCertificates: 0,
			error: null,
		});
		void listCertificatePage(wallet, page * CERTIFICATE_PAGE_SIZE).then(
			(result) => {
				if (requestId.current !== request) return;
				setState({
					identityKey,
					certificates: result.certificates,
					totalCertificates: result.totalCertificates,
					error: null,
				});
			},
			() => {
				if (requestId.current !== request) return;
				reportDiagnostic({
					category: "action",
					code: "action.failed",
					operation: "wallet.certificate.list",
					recoverable: true,
					context: { retryable: true },
				});
				setState({
					identityKey,
					certificates: [],
					totalCertificates: 0,
					error:
						"Could not list certificates. This wallet may not support certificate storage.",
				});
			},
		);

		return () => {
			requestId.current = "cancelled";
		};
	}, [identityKey, isInitialized, page, revision, wallet]);

	return {
		...certificatesForIdentity(state, identityKey),
		page,
		setPage: (nextPage: number) =>
			setPagination({ identityKey, page: Math.max(0, nextPage) }),
		refresh: () => setRevision((value) => value + 1),
	};
}
