import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
	createSyncCoordinator,
	type SyncTaskName,
	type SyncTasksState,
	shouldRunOwnedSync,
} from "@/providers/hooks/use-sync-engine";

const resolvedJobs = (run: (name: SyncTaskName) => Promise<void>) => ({
	addresses: async () => {
		await run("addresses");
		return { processed: 1, failed: 0 };
	},
	payments: async () => {
		await run("payments");
		return { processed: 2, failed: 0 };
	},
	cosignDeliveries: async () => {
		await run("cosignDeliveries");
		return { processed: 3, failed: 0 };
	},
});

function installedSyncSource(filename: string) {
	return readFileSync(
		join(process.cwd(), "node_modules/@1sat/actions/dist/sync", filename),
		"utf8",
	);
}

describe("wallet sync coordinator", () => {
	it("keeps automatic and manual runs single-flight", async () => {
		let release = () => {};
		const blocked = new Promise<void>((resolve) => {
			release = resolve;
		});
		let calls = 0;
		const coordinator = createSyncCoordinator(() => {});
		const jobs = resolvedJobs(async () => {
			calls += 1;
			await blocked;
		});

		const first = coordinator.run(jobs);
		const duplicate = coordinator.run(jobs);
		assert.equal(first.started, true);
		assert.equal(duplicate.started, false);
		assert.equal(first.promise, duplicate.promise);
		release();
		await first.promise;
		assert.equal(calls, 3);
	});

	it("records exact results and keeps failed work retryable", async () => {
		let state: SyncTasksState | undefined;
		const coordinator = createSyncCoordinator(
			(next) => {
				state = next;
			},
			() => 42,
		);

		await coordinator.run({
			...resolvedJobs(async () => {}),
			payments: async () => ({ processed: 4, failed: 1 }),
		}).promise;
		assert.deepEqual(state?.payments, {
			status: "failed",
			lastRunAt: 42,
			processed: 4,
			failed: 1,
			error: "1 item failed",
		});

		await Promise.resolve();
		await coordinator.run(resolvedJobs(async () => {})).promise;
		assert.equal(state?.payments.status, "succeeded");
		assert.equal(state?.payments.processed, 2);
		assert.equal(state?.payments.failed, 0);
	});

	it("does not publish stale results after an identity reset", async () => {
		let release = () => {};
		const blocked = new Promise<void>((resolve) => {
			release = resolve;
		});
		let state: SyncTasksState | undefined;
		let calls = 0;
		const coordinator = createSyncCoordinator((next) => {
			state = next;
		});
		const run = coordinator.run(
			resolvedJobs(async () => {
				calls += 1;
				await blocked;
			}),
		);

		coordinator.reset();
		release();
		assert.equal(await run.promise, false);
		assert.equal(state?.addresses.status, "idle");
		assert.equal(state?.payments.lastRunAt, null);
		assert.equal(calls, 1);
	});

	it("waits for in-flight work before teardown completes", async () => {
		let release = () => {};
		const blocked = new Promise<void>((resolve) => {
			release = resolve;
		});
		const coordinator = createSyncCoordinator(() => {});
		coordinator.run(resolvedJobs(() => blocked));
		let stopped = false;
		const stop = coordinator.stop().then(() => {
			stopped = true;
		});
		await Promise.resolve();
		assert.equal(stopped, false);
		release();
		await stop;
		assert.equal(stopped, true);
	});

	it("runs only for a visible website-owned built-in wallet", () => {
		const ready = {
			isInitialized: true,
			ownedByWebsite: true,
			isVisible: true,
			hasWallet: true,
			hasServices: true,
			hasIdentity: true,
			hasAddressManager: true,
		};
		assert.equal(shouldRunOwnedSync(ready), true);
		assert.equal(shouldRunOwnedSync({ ...ready, isVisible: false }), false);
		assert.equal(
			shouldRunOwnedSync({ ...ready, ownedByWebsite: false }),
			false,
		);
	});

	it("pins MessageBox acknowledgement after successful internalization", () => {
		for (const filename of ["syncMessages.js", "syncCosignDeliveries.js"]) {
			const source = installedSyncSource(filename);
			const internalized = source.indexOf("await ctx.wallet.internalizeAction");
			const queued = source.indexOf("acknowledgedIds.push", internalized);
			const acknowledged = source.indexOf(
				"await client.acknowledgeMessage",
				queued,
			);
			assert.ok(internalized >= 0, `${filename} internalizes a message`);
			assert.ok(queued > internalized, `${filename} queues only after success`);
			assert.ok(
				acknowledged > queued,
				`${filename} acknowledges queued successes`,
			);
		}
	});
});
