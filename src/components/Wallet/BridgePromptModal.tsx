"use client";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { bridgePrompt, bridgeResolver } from "@/signals/wallet/bridge";
import { useSignals } from "@preact/signals-react/runtime";

const BridgePromptModal = () => {
	useSignals();
	const prompt = bridgePrompt.value;

	const resolve = (ok: boolean) => {
		bridgeResolver.value?.(ok);
		bridgePrompt.value = null;
		bridgeResolver.value = null;
	};

	return (
		<Dialog open={!!prompt} onOpenChange={(open) => !open && resolve(false)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Wallet Request</DialogTitle>
					<div className="text-xs text-muted-foreground">
						{prompt?.origin || "unknown origin"} requests {prompt?.method}
					</div>
				</DialogHeader>
				<div className="text-sm space-y-2">
					{prompt?.intent && (
						<div className="text-muted-foreground">Intent: {prompt.intent}</div>
					)}
					<div className="text-muted-foreground">
						Confirm to proceed. Reject if you did not initiate this request.
					</div>
				</div>
				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={() => resolve(false)}>
						Reject
					</Button>
					<Button onClick={() => resolve(true)}>Approve</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default BridgePromptModal;

