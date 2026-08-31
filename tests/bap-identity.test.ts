import assert from "node:assert/strict";
import test from "node:test";
import {
	buildBapAttestationReview,
	identityActionMessage,
	normalizeBapDiscovery,
	profileDraftFromRecord,
	validateBapProfile,
} from "../lib/wallet/bap-identity";

test("validates and trims the fixed public BAP profile schema", () => {
	const result = validateBapProfile({
		name: " Alice ",
		alternateName: "alice",
		description: "Public builder",
		image: "https://example.com/alice.png",
		email: "alice@example.com",
		paymail: "alice@1sat.app",
	});
	assert.deepEqual(result.errors, {});
	assert.deepEqual(result.profile, {
		"@type": "Person",
		name: "Alice",
		alternateName: "alice",
		description: "Public builder",
		image: "https://example.com/alice.png",
		email: "alice@example.com",
		paymail: "alice@1sat.app",
	});
});

test("rejects unsafe profile URLs and malformed contact fields", () => {
	const result = validateBapProfile({
		name: "Alice",
		alternateName: "",
		description: "",
		image: "javascript:alert(1)",
		email: "not-an-email",
		paymail: "not-paymail",
	});
	assert.equal(result.errors.image, "Use an https:// or ord:// image URL.");
	assert.equal(result.errors.email, "Enter a valid email address.");
	assert.equal(result.errors.paymail, "Enter a valid Paymail address.");
});

test("only reads known string fields from stored profile data", () => {
	assert.deepEqual(
		profileDraftFromRecord({
			name: "Alice",
			email: { secret: true },
			admin: true,
		}),
		{
			name: "Alice",
			alternateName: "",
			description: "",
			image: "",
			email: "",
			paymail: "",
		},
	);
});

test("derives the protocol attestation claim deterministically", () => {
	const review = buildBapAttestationReview({
		subject: "3SyWUZXvhidNcEHbAC3HkBnKoD2Q",
		attributeUrn:
			"urn:bap:id:name:John Doe:e2c6fb4063cc04af58935737eaffc938011dff546d47b7fbb18ed346f8c4d4fa",
		counter: "0",
	});
	assert.equal(
		review.attributeHash,
		"b17c8e606afcf0d8dca65bdf8f33d275239438116557980203c82b0fae259838",
	);
	assert.equal(
		review.attestationUrn,
		"bap:attest:b17c8e606afcf0d8dca65bdf8f33d275239438116557980203c82b0fae259838:3SyWUZXvhidNcEHbAC3HkBnKoD2Q",
	);
	assert.equal(
		review.attestationHash,
		"b5b3f0e9deb8cadd91910e6570c252a71f599559798ae3295f72d3ffa30b7469",
	);
});

test("rejects partial claims and invalid sequences", () => {
	assert.throws(
		() =>
			buildBapAttestationReview({
				subject: "identity123",
				attributeUrn: "name:Alice",
			}),
		/full urn:bap:id/,
	);
	assert.throws(
		() =>
			buildBapAttestationReview({
				subject: "identity123",
				attributeUrn: "urn:bap:id:name:Alice:nonce",
				counter: "-1",
			}),
		/non-negative decimal/,
	);
});

test("discovery normalization exposes only approved public fields", () => {
	const result = normalizeBapDiscovery([
		{
			idKey: "identity123",
			currentAddress: "1PublicAddress",
			identity: {
				name: "Alice",
				description: "Public profile",
				email: "private@example.com",
				secret: "do-not-render",
				image: "javascript:alert(1)",
			},
		},
		{ idKey: "bad id" },
	]);
	assert.deepEqual(result, [
		{
			idKey: "identity123",
			currentAddress: "1PublicAddress",
			firstSeen: undefined,
			name: "Alice",
			alternateName: undefined,
			description: "Public profile",
			image: undefined,
		},
	]);
});

test("wallet rejection messages never echo provider payloads", () => {
	const message = identityActionMessage(
		"profile",
		new Error("User rejected seed=super-secret"),
	);
	assert.equal(
		message,
		"The wallet did not authorize this request. Nothing was changed.",
	);
	assert.doesNotMatch(message, /super-secret/);
});
