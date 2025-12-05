"use client";

import SAFU from "@/components/Wallet/safu";
import {
	encryptedBackup,
	ordPk,
	payPk,
	showUnlockWalletButton,
	showUnlockWalletModal,
} from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import { PrivateKey, Utils } from "@bsv/sdk";
import { getAuthToken, parseAuthToken, type AuthConfig } from "bitcoin-auth";
import { computed, effect } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { FaChevronDown, FaCircle } from "react-icons/fa6";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "usehooks-ts";

const SignMessagePage = ({
	message,
	callback,
	state,
}: {
	message: string;
	callback?: string;
	state?: string;
}) => {
	useSignals();
	const [_value, copy] = useCopyToClipboard();
	const activeKey = useSignal<string | undefined>(undefined);
	const proof = useSignal<string | undefined>(undefined);
	const showActiveKeySwitcher = useSignal(false);

	const locked = computed(() => {
		// Wallet is locked if we have encrypted backup but no keys loaded
		if (!ordAddress.value && !!encryptedBackup.value) {
			return true;
		}
		// Also check if menu component detected lock state via localStorage
		if (showUnlockWalletButton.value && !ordPk.value) {
			return true;
		}
		return false;
	});
	const activeAddress = computed(() => {
		const key = activeKey.value || ordPk.value;
		if (!key) {
			return;
		}

		const pk = PrivateKey.fromWif(key);
		// address from ptivate key
		return pk.toPublicKey().toAddress();
	});

	effect(() => {
		if (!activeKey.value) {
			if (ordPk.value) {
				activeKey.value = ordPk.value;
			}
		}
	});

	const signChallenge = useCallback(async () => {
		if (!ordPk.value || !activeKey.value) {
			return;
		}

		if (locked.value) {
			showUnlockWalletModal.value = true;
			return;
		}

		try {
			// Decode base64 message to UTF-8 using Utils
			const decodedMessage = Utils.toUTF8(Utils.toArray(message, "base64"));
			const [requestPath, timestamp] = decodedMessage.split("|");

			// Generate authToken using bitcoin-auth
			const authConfig: AuthConfig = {
				privateKeyWif: activeKey.value,
				requestPath,
				timestamp,
				scheme: "bsm",
			};
			const authToken = getAuthToken(authConfig);

			// Parse token to extract signature for display
			const parsed = parseAuthToken(authToken);
			if (parsed) {
				proof.value = parsed.signature;
			}

			// If callback URL is present, redirect with authToken in query params
			if (callback) {
				const keyType = activeKey.value === ordPk.value ? "ordinals" : "payment";

				// Build callback URL with query params
				const callbackUrl = new URL(callback);
				callbackUrl.searchParams.set("authToken", authToken);
				if (state) {
					callbackUrl.searchParams.set("state", state);
				}
				callbackUrl.searchParams.set("provider", "1sat");
				callbackUrl.searchParams.set("keyType", keyType);

				// Notify opener window (if in tab/popup) before redirecting
				if (window.opener && state) {
					window.opener.postMessage(
						{
							type: "wallet-connected",
							state,
							provider: "1sat",
						},
						"*",
					);
				}

				// Redirect to callback URL
				window.location.href = callbackUrl.toString();
			}
		} catch (error) {
			toast.error(
				`Signing error: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}, [ordPk.value, locked.value, activeKey.value, message, callback, state, proof]);

	const toggleActiveKey = () => {
		showActiveKeySwitcher.value = !showActiveKeySwitcher.value;
	};

	const changeActiveKey = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			const target = event.target as HTMLDivElement;
			const key = target.id;
			if (!ordPk.value || !payPk.value) {
				return;
			}
			switch (key) {
				case "ord":
					activeKey.value = ordPk.value;
					break;
				case "pay":
					activeKey.value = payPk.value;
					break;
				// case "identity":
				//   ordPk.value = ordPk.value;
				//   break;
			}
			proof.value = undefined;
		},
		[activeKey, ordPk.value, payPk.value, proof],
	);

	return locked.value ? (
		<SAFU />
	) : (
		<Dialog
			open={!showUnlockWalletModal.value}
			onOpenChange={(open) => {
				showUnlockWalletModal.value = !open;
			}}
		>
			<DialogContent>
				<DialogHeader className="flex flex-row items-start justify-between">
					<div className="space-y-1 text-left">
						{callback ? (
							<>
								<DialogTitle>Wallet Connection Request</DialogTitle>
								<div className="text-xs text-muted-foreground">
									{new URL(callback).hostname} is requesting access
								</div>
							</>
						) : (
							<DialogTitle>Sign Message</DialogTitle>
						)}
					</div>
					<div
						onClick={toggleActiveKey}
						className="flex relative cursor-pointer items-center text-xs"
					>
						<span className="text-muted-foreground transition hover:text-foreground">
							{activeAddress.value?.slice(0, 8)}...
							{activeAddress.value?.slice(-8)}{" "}
						</span>
						<FaChevronDown className="text-muted-foreground ml-2" />
						{showActiveKeySwitcher.value && (
							<div className="absolute top-0 right-0 rounded border border-border bg-card mt-8 w-48 text-right shadow-lg">
								<div
									className="cursor-pointer hover:bg-muted mb-1 p-2 w-full flex items-center justify-end"
									id="key-switcher-ord"
									onClick={changeActiveKey}
								>
									{activeKey.value === ordPk.value && <FaCircle className="w-3 text-yellow-200/60 mr-2" />} Ordinals
								</div>
								<div
									className="cursor-pointer hover:bg-muted mb-1 p-2 w-full flex items-center justify-end"
									id="key-switcher-pay"
									onClick={changeActiveKey}
								>
									{activeKey.value === payPk.value && <FaCircle className="w-3 text-yellow-200/60 mr-2" />} Payment
								</div>
								<div
									className="cursor-pointer hover:bg-muted mb-1 p-2 w-full flex items-center justify-end"
									id="key-switcher-identity"
									onClick={changeActiveKey}
								>
									{activeKey.value === "replaceMes" && <FaCircle className="w-3 text-yellow-200/60 mr-2" />} Identity
								</div>
							</div>
						)}
					</div>
				</DialogHeader>

				<p className="text-xs border border-border rounded p-2 bg-card">
					<span className="text-muted-foreground mr-2">Message</span> {message}
				</p>

				{!callback && (
					<p className={`${proof.value ? 'opacity-100' : 'opacity-0'} transition text-xs border border-border rounded p-2 h-16 break-all leading-loose bg-card`}>
						<span className="text-muted-foreground mr-2">{proof.value ? "Signature": ""}</span> {proof.value}
					</p>
				)}

				<DialogFooter className="justify-end">
					{callback ? (
						<Button
							type="button"
							onClick={signChallenge}
							disabled={locked.value || !!proof.value}
						>
							{locked.value
								? "Unlock Wallet"
								: proof.value
									? "Redirecting..."
									: "Sign and Connect"}
						</Button>
					) : (
						<Button
							type="button"
							variant={proof.value ? "default" : "outline"}
							onClick={() => {
								if (proof.value) {
									copy(proof.value);
									toast.success("Signature copied!");
								}
								signChallenge();
							}}
						>
							{locked.value
								? "Unlock Wallet"
								: proof.value
									? "Copy Signature"
									: "Sign Challenge"}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SignMessagePage;
