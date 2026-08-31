import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	counterpartyConsentEntries,
	descriptionConflictsWithAmount,
	groupedConsentEntries,
	isPermissionRequest,
	parseCounterpartyPermissions,
	parseGroupedPermissions,
	permissionExpiry,
	selectCounterpartyPermissions,
	selectGroupedPermissions,
} from "../lib/cwi/consent";

const key = `02${"11".repeat(32)}`;

describe("BRC-73/116 consent", () => {
	test("parses canonical grouped shapes and preserves exact selected subsets", () => {
		const parsed = parseGroupedPermissions({
			description: "Publish a BitPlan",
			spendingAuthorization: { amount: 1200, description: "Publish fee" },
			protocolPermissions: [
				{
					protocolID: [2, "bitplan"],
					counterparty: key,
					description: "Encrypt the plan",
				},
			],
			basketAccess: [{ basket: "1sat", description: "Store the plan" }],
			certificateAccess: [
				{
					type: "dGVzdA==",
					fields: ["name"],
					verifierPublicKey: key,
					description: "Prove a name",
				},
			],
		});
		assert.ok(parsed);
		const entries = groupedConsentEntries(parsed);
		assert.deepEqual(
			entries.map((entry) => entry.id),
			["protocol:0", "basket:0", "certificate:0", "spending"],
		);
		assert.deepEqual(
			selectGroupedPermissions(parsed, new Set(["basket:0", "certificate:0"])),
			{
				description: "Publish a BitPlan",
				basketAccess: [{ basket: "1sat", description: "Store the plan" }],
				certificateAccess: [
					{
						type: "dGVzdA==",
						fields: ["name"],
						verifierPublicKey: key,
						description: "Prove a name",
					},
				],
			},
		);
	});

	test("rejects privileged, overflow, reserved basket, and malformed certificate declarations", () => {
		assert.equal(
			parseGroupedPermissions({
				protocolPermissions: [
					{
						protocolID: [1, "test"],
						description: "test",
						privileged: true,
					},
				],
			}),
			null,
		);
		assert.equal(
			parseGroupedPermissions({
				spendingAuthorization: {
					amount: Number.MAX_SAFE_INTEGER + 1,
					description: "too much",
				},
			}),
			null,
		);
		assert.equal(
			parseGroupedPermissions({
				basketAccess: [{ basket: "default", description: "reserved" }],
			}),
			null,
		);
		assert.equal(
			parseGroupedPermissions({
				certificateAccess: [
					{
						type: "dGVzdA==",
						fields: ["name", "name"],
						verifierPublicKey: key,
						description: "duplicate fields",
					},
				],
			}),
			null,
		);
	});

	test("accepts only Level-2 PACT protocols and selects them independently", () => {
		const parsed = parseCounterpartyPermissions({
			description: "Collaborate",
			protocols: [
				{ protocolName: "chat", description: "Messages" },
				{ protocolID: [2, "files"], description: "Files" },
			],
		});
		assert.ok(parsed);
		assert.deepEqual(
			counterpartyConsentEntries(parsed).map((entry) => entry.detail),
			["chat", "files"],
		);
		assert.deepEqual(
			selectCounterpartyPermissions(parsed, new Set(["protocol:1"])),
			{
				description: "Collaborate",
				protocols: [
					{
						protocolName: "files",
						protocolID: [2, "files"],
						description: "Files",
					},
				],
			},
		);
		assert.equal(
			parseCounterpartyPermissions({
				protocols: [{ protocolID: [1, "not-pact"] }],
			}),
			null,
		);
	});

	test("computes explicit duration without floating point drift", () => {
		assert.equal(permissionExpiry("until-revoked", 100), 0);
		assert.equal(permissionExpiry("thirty-days", 100), 2_592_100);
	});

	test("flags descriptions that contradict structured satoshi amounts", () => {
		assert.equal(
			descriptionConflictsWithAmount("Spend 1,200 sats", 1200),
			false,
		);
		assert.equal(
			descriptionConflictsWithAmount("Spend 1,201 sats", 1200),
			true,
		);
		assert.equal(
			descriptionConflictsWithAmount("Publish this item", 1200),
			false,
		);
	});

	test("rejects malformed individual permission payloads before rendering", () => {
		assert.equal(
			isPermissionRequest({
				requestID: "spend",
				type: "spending",
				spending: {
					satoshis: 500,
					lineItems: [{ type: "fee", description: "Network fee", satoshis: 1 }],
				},
			}),
			true,
		);
		assert.equal(
			isPermissionRequest({
				requestID: "cert",
				type: "certificate",
				certificate: {
					verifier: "not-a-key",
					certType: "dGVzdA==",
					fields: ["name"],
				},
			}),
			false,
		);
	});
});
