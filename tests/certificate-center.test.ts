import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type {
	CertificateResult,
	ListCertificatesArgs,
	ListCertificatesResult,
	ProveCertificateResult,
} from "@bsv/sdk";
import {
	buildSelectiveCertificateProof,
	CERTIFICATE_PAGE_SIZE,
	certificatesForIdentity,
	listCertificatePage,
	parseCertificateAcquisitionRequest,
} from "@/hooks/use-certificates";

const certificate: CertificateResult = {
	type: "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
	serialNumber: "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=",
	subject: "024d4b6cd1361032f49d6c5cb7198fdd0458d4fd5f2d0f418da24ff2b63243a6f7",
	certifier:
		"03531fe6068134503d846f476d6b2e3c000d70bb7c3937c8d537ef7d24c7d9e6c8",
	revocationOutpoint: `${"ab".repeat(32)}.1`,
	signature: "30440220abcd0220ef01",
	fields: { email: "encrypted-email", name: "encrypted-name" },
	keyring: { email: "master-email", name: "master-name" },
};

test("certificate center lists through the canonical WalletInterface request", async () => {
	let received: ListCertificatesArgs | undefined;
	const wallet = {
		listCertificates: async (
			args: ListCertificatesArgs,
		): Promise<ListCertificatesResult> => {
			received = args;
			return { totalCertificates: 0, certificates: [] };
		},
	};

	await listCertificatePage(wallet, 50);
	assert.deepEqual(received, {
		certifiers: [],
		types: [],
		limit: CERTIFICATE_PAGE_SIZE,
		offset: 50,
	});
});

test("certificate state never crosses wallet identities", () => {
	const state = {
		identityKey: "identity-a",
		certificates: [certificate],
		totalCertificates: 1,
		error: null,
	};
	assert.equal(certificatesForIdentity(state, "identity-a"), state);
	assert.deepEqual(certificatesForIdentity(state, "identity-b"), {
		identityKey: "identity-b",
		certificates: null,
		totalCertificates: 0,
		error: null,
	});
});

test("acquisition parsing delegates normative validation to WalletInterface", () => {
	const request = parseCertificateAcquisitionRequest(
		JSON.stringify({
			type: certificate.type,
			certifier: certificate.certifier,
			acquisitionProtocol: "issuance",
			fields: { name: "Ada" },
			certifierUrl: "https://issuer.example",
		}),
	);
	assert.equal(request.acquisitionProtocol, "issuance");
	assert.throws(() => parseCertificateAcquisitionRequest("[]"), /JSON object/);
	assert.throws(
		() =>
			parseCertificateAcquisitionRequest(
				JSON.stringify({ acquisitionProtocol: "legacy" }),
			),
		/either "direct" or "issuance"/,
	);
});

test("selective proof export rejects missing or over-broad keyrings", () => {
	const valid: ProveCertificateResult = {
		keyringForVerifier: { name: "verifier-name" },
		certificate: { ...certificate, fields: { name: "provider-substitution" } },
	};
	const proof = buildSelectiveCertificateProof(certificate, ["name"], valid);
	assert.deepEqual(proof.keyring, { name: "verifier-name" });
	assert.deepEqual(proof.fields, certificate.fields);
	assert.equal("verifier" in proof, false);
	assert.equal(JSON.stringify(proof).includes("master-name"), false);

	assert.throws(
		() =>
			buildSelectiveCertificateProof(certificate, ["name"], {
				keyringForVerifier: {
					email: "unexpected-email",
					name: "verifier-name",
				},
			}),
		/different fields/,
	);
	assert.throws(
		() => buildSelectiveCertificateProof(certificate, ["name", "email"], valid),
		/different fields/,
	);
});

test("certificate UI uses the active wallet instead of constructing a provider", () => {
	const source = [
		"../components/wallet/certificate-center.tsx",
		"../hooks/use-certificates.ts",
	]
		.map((path) => readFileSync(new URL(path, import.meta.url), "utf8"))
		.join("\n");
	for (const method of [
		"acquireCertificate",
		"listCertificates",
		"proveCertificate",
		"relinquishCertificate",
	]) {
		assert.match(source, new RegExp(`wallet\\.${method}`));
	}
	assert.doesNotMatch(source, /WalletClient|new Wallet/);
	assert.doesNotMatch(source, /certificate\.fields\[[^\]]+\]/);
});
