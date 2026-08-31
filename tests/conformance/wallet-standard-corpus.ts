import {
	type AcquireCertificateArgs,
	type DiscoverByAttributesArgs,
	type DiscoverByIdentityKeyArgs,
	type GetHeaderArgs,
	type ListCertificatesArgs,
	PrivateKey,
	type ProveCertificateArgs,
	type RelinquishCertificateArgs,
	Validation,
	type WalletInterface,
} from "@bsv/sdk";

export const STANDARD_METHODS = [
	"getPublicKey",
	"revealCounterpartyKeyLinkage",
	"revealSpecificKeyLinkage",
	"encrypt",
	"decrypt",
	"createHmac",
	"verifyHmac",
	"createSignature",
	"verifySignature",
	"acquireCertificate",
	"listCertificates",
	"proveCertificate",
	"relinquishCertificate",
	"discoverByIdentityKey",
	"discoverByAttributes",
	"isAuthenticated",
	"waitForAuthentication",
	"getHeight",
	"getHeaderForHeight",
	"getNetwork",
	"getVersion",
] as const;

export type StandardMethod = (typeof STANDARD_METHODS)[number];

type MethodArgs<M extends StandardMethod> = Parameters<WalletInterface[M]>[0];
type MethodResult<M extends StandardMethod> = Awaited<
	ReturnType<WalletInterface[M]>
>;

export interface StandardVector {
	id: string;
	method: StandardMethod;
	args: object;
	result: object;
	standards: string[];
}

const vector = <M extends StandardMethod>(
	id: string,
	method: M,
	args: MethodArgs<M>,
	result: MethodResult<M>,
	standards: string[],
): StandardVector => ({ id, method, args, result, standards });

export const STANDARD_PUBLIC_KEY_FIXTURES = Object.freeze({
	prover: PrivateKey.fromHex("01".repeat(32)).toPublicKey().toString(),
	verifier: PrivateKey.fromHex("02".repeat(32)).toPublicKey().toString(),
	counterparty: PrivateKey.fromHex("03".repeat(32)).toPublicKey().toString(),
	certifier: PrivateKey.fromHex("04".repeat(32)).toPublicKey().toString(),
});
const {
	prover: PROVER,
	verifier: VERIFIER,
	counterparty: COUNTERPARTY,
	certifier: CERTIFIER,
} = STANDARD_PUBLIC_KEY_FIXTURES;
const TYPE = "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=";
const SERIAL = "AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI=";
const REVOCATION_OUTPOINT = `${"55".repeat(32)}.1`;
const SIGNATURE = `30440220${"66".repeat(32)}0220${"77".repeat(32)}`;

const certificate = {
	type: TYPE,
	subject: PROVER,
	serialNumber: SERIAL,
	certifier: CERTIFIER,
	revocationOutpoint: REVOCATION_OUTPOINT,
	signature: SIGNATURE,
	fields: {
		name: "QmFzZTY0IGVuY3J5cHRlZCBmaWVsZA==",
		email: "QW5vdGhlciBlbmNyeXB0ZWQgZmllbGQ=",
	},
};

const linkageResult = {
	encryptedLinkage: [0, 1, 254, 255],
	encryptedLinkageProof: [255, 128, 0],
	prover: PROVER,
	verifier: VERIFIER,
	counterparty: COUNTERPARTY,
};

export const STANDARD_VECTORS: readonly StandardVector[] = [
	vector(
		"key/identity",
		"getPublicKey",
		{ identityKey: true },
		{ publicKey: PROVER },
		["BRC-100"],
	),
	vector(
		"linkage/counterparty-privileged",
		"revealCounterpartyKeyLinkage",
		{
			counterparty: COUNTERPARTY,
			verifier: VERIFIER,
			privileged: true,
			privilegedReason: "Audit counterparty linkage",
		},
		{ ...linkageResult, revelationTime: "2026-08-30T12:00:00.000Z" },
		["BRC-69", "BRC-72", "BRC-94", "BRC-100"],
	),
	vector(
		"linkage/specific-proof-type",
		"revealSpecificKeyLinkage",
		{
			counterparty: COUNTERPARTY,
			verifier: VERIFIER,
			protocolID: [2, "conformance linkage"],
			keyID: "specific-key-1",
		},
		{
			...linkageResult,
			protocolID: [2, "conformance linkage"],
			keyID: "specific-key-1",
			proofType: 0,
		},
		["BRC-43", "BRC-69", "BRC-72", "BRC-97", "BRC-100"],
	),
	vector(
		"crypto/encrypt-level-zero",
		"encrypt",
		{
			protocolID: [0, "conformance encryption"],
			keyID: "message-1",
			counterparty: COUNTERPARTY,
			plaintext: [0, 1, 127, 255],
		},
		{ ciphertext: [255, 0, 128, 1, 254] },
		["BRC-2", "BRC-42", "BRC-43", "BRC-100"],
	),
	vector(
		"crypto/decrypt-level-one-privileged",
		"decrypt",
		{
			protocolID: [1, "conformance encryption"],
			keyID: "message-2",
			counterparty: COUNTERPARTY,
			ciphertext: [255, 0, 128, 1, 254],
			privileged: true,
			privilegedReason: "Recover encrypted fixture",
		},
		{ plaintext: [0, 1, 127, 255] },
		["BRC-2", "BRC-42", "BRC-43", "BRC-100"],
	),
	vector(
		"hmac/create-level-two",
		"createHmac",
		{
			protocolID: [2, "conformance hmac"],
			keyID: "hmac-1",
			counterparty: COUNTERPARTY,
			data: [0, 255, 1],
		},
		{ hmac: [255, 128, 64, 0] },
		["BRC-42", "BRC-43", "BRC-56", "BRC-100"],
	),
	vector(
		"hmac/verify-level-zero",
		"verifyHmac",
		{
			protocolID: [0, "conformance hmac"],
			keyID: "hmac-2",
			data: [0, 255, 1],
			hmac: [255, 128, 64, 0],
		},
		{ valid: true },
		["BRC-42", "BRC-43", "BRC-56", "BRC-100"],
	),
	vector(
		"signature/create-level-one-privileged",
		"createSignature",
		{
			protocolID: [1, "conformance signature"],
			keyID: "signature-1",
			counterparty: COUNTERPARTY,
			data: [0, 255, 1, 128],
			privileged: true,
			privilegedReason: "Sign conformance fixture",
		},
		{ signature: [48, 68, 0, 255] },
		["BRC-3", "BRC-42", "BRC-43", "BRC-100"],
	),
	vector(
		"signature/verify-level-two-hash",
		"verifySignature",
		{
			protocolID: [2, "conformance signature"],
			keyID: "signature-2",
			counterparty: COUNTERPARTY,
			hashToDirectlyVerify: Array.from({ length: 32 }, (_, index) => index),
			signature: [48, 68, 0, 255],
			forSelf: true,
		},
		{ valid: true },
		["BRC-3", "BRC-42", "BRC-43", "BRC-100"],
	),
	vector(
		"certificate/acquire-direct",
		"acquireCertificate",
		{
			type: TYPE,
			certifier: CERTIFIER,
			acquisitionProtocol: "direct",
			fields: certificate.fields,
			serialNumber: SERIAL,
			revocationOutpoint: REVOCATION_OUTPOINT,
			signature: SIGNATURE,
			keyringRevealer: CERTIFIER,
			keyringForSubject: { name: "a2V5cmluZw==", email: "a2V5cmluZw==" },
			privileged: true,
			privilegedReason: "Store identity certificate",
		},
		certificate,
		["BRC-52", "BRC-100"],
	),
	vector(
		"certificate/list",
		"listCertificates",
		{
			certifiers: [CERTIFIER],
			types: [TYPE],
			limit: 10,
			offset: 1,
			privileged: true,
			privilegedReason: "List identity certificates",
		},
		{
			totalCertificates: 1,
			certificates: [{ ...certificate, keyring: { name: "a2V5cmluZw==" } }],
		},
		["BRC-52", "BRC-100"],
	),
	vector(
		"certificate/prove-selective-fields",
		"proveCertificate",
		{
			certificate,
			fieldsToReveal: ["name"],
			verifier: VERIFIER,
			privileged: true,
			privilegedReason: "Reveal certified name field",
		},
		{
			keyringForVerifier: { name: "dmVyaWZpZXIta2V5cmluZw==" },
			certificate,
			verifier: VERIFIER,
		},
		["BRC-52", "BRC-53", "BRC-100"],
	),
	vector(
		"certificate/relinquish",
		"relinquishCertificate",
		{ type: TYPE, serialNumber: SERIAL, certifier: CERTIFIER },
		{ relinquished: true },
		["BRC-52", "BRC-100"],
	),
	vector(
		"discovery/by-identity-key",
		"discoverByIdentityKey",
		{ identityKey: PROVER, limit: 25, offset: 2, seekPermission: false },
		{
			totalCertificates: 1,
			certificates: [
				{
					...certificate,
					certifierInfo: {
						name: "Conformance Certifier",
						iconUrl: "https://certifier.example/icon.png",
						description: "Conformance identity certifier",
						trust: 7,
					},
					publiclyRevealedKeyring: { name: "cHVibGljLWtleXJpbmc=" },
					decryptedFields: { name: "Ada" },
				},
			],
		},
		["BRC-52", "BRC-100"],
	),
	vector(
		"discovery/by-attributes",
		"discoverByAttributes",
		{
			attributes: { name: "Ada", organization: "1Sat" },
			limit: 5,
			offset: 0,
			seekPermission: true,
		},
		{ totalCertificates: 0, certificates: [] },
		["BRC-52", "BRC-100"],
	),
	vector("auth/status", "isAuthenticated", {}, { authenticated: true }, [
		"BRC-100",
	]),
	vector("auth/wait", "waitForAuthentication", {}, { authenticated: true }, [
		"BRC-100",
	]),
	vector("chain/height", "getHeight", {}, { height: 900_001 }, ["BRC-100"]),
	vector(
		"chain/header",
		"getHeaderForHeight",
		{ height: 900_000 },
		{ header: "ff".repeat(80) },
		["BRC-100"],
	),
	vector("wallet/network", "getNetwork", {}, { network: "mainnet" }, [
		"BRC-100",
	]),
	vector("wallet/version", "getVersion", {}, { version: "1sat-2.0.0" }, [
		"BRC-100",
	]),
];

export const validateStandardArgs = (
	method: StandardMethod,
	args: object,
): object => {
	switch (method) {
		case "acquireCertificate":
			return Validation.validateAcquireDirectCertificateArgs(
				args as AcquireCertificateArgs,
			);
		case "listCertificates":
			return Validation.validateListCertificatesArgs(
				args as ListCertificatesArgs,
			);
		case "proveCertificate":
			return Validation.validateProveCertificateArgs(
				args as ProveCertificateArgs,
			);
		case "relinquishCertificate":
			return Validation.validateRelinquishCertificateArgs(
				args as RelinquishCertificateArgs,
			);
		case "discoverByIdentityKey":
			return Validation.validateDiscoverByIdentityKeyArgs(
				args as DiscoverByIdentityKeyArgs,
			);
		case "discoverByAttributes":
			return Validation.validateDiscoverByAttributesArgs(
				args as DiscoverByAttributesArgs,
			);
		case "getHeaderForHeight":
			Validation.validateInteger(
				(args as GetHeaderArgs).height,
				"height",
				undefined,
				1,
			);
			return args;
		default:
			return args;
	}
};

export type StandardWallet = Pick<WalletInterface, StandardMethod>;
