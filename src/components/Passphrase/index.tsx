"use client";

import { PrivateKey } from "@bsv/sdk";
import { effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { AlertTriangle, Copy, Dices, KeyRound } from "lucide-react";
import randomBytes from "randombytes";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import toast from "react-hot-toast";
import { useCopyToClipboard } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encryptionPrefix, toastErrorProps, toastProps } from "@/constants";
import {
	changeAddressPath,
	encryptionKey,
	ImportWalletFromBackupJsonStep,
	identityAddressPath,
	identityPk,
	importWalletFromBackupJsonStep,
	migrating,
	mnemonic,
	ordAddressPath,
	ordPk,
	passphrase,
	payPk,
} from "@/signals/wallet";
import { loadKeysFromEncryptedStorage } from "@/signals/wallet/client";
import { EncryptDecrypt, type EncryptedBackupJson } from "@/types/wallet";
import {
	encryptData,
	generateEncryptionKeyFromPassphrase,
} from "@/utils/encryption";
import { generatePassphrase } from "@/utils/passphrase";
import { backupKeys } from "@/utils/wallet";

type Props = {
	mode: EncryptDecrypt;
	download?: boolean;
	onSubmit: () => void;
	migrating?: boolean;
};

const EnterPassphrase: React.FC<Props> = ({
	mode,
	onSubmit,
	download = true,
}) => {
	useSignals();
	const [_value, copy] = useCopyToClipboard();

	const showEnterPassphrase = useSignal<EncryptDecrypt | null>(mode);
	const hasDownloadedKeys = useSignal<boolean>(false);
	const passwordInputRef = useRef<HTMLInputElement>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// autofocus without using the autoFocus property
	effect(() => {
		if (
			mounted &&
			showEnterPassphrase.value !== null &&
			passwordInputRef.current
		) {
			if (
				passwordInputRef.current.getBoundingClientRect().top <
				window.innerHeight
			) {
				passwordInputRef.current.focus();
			}
		}
	});

	const handlePassphraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();
		e.stopPropagation();
		passphrase.value = e.target.value;
	};

	const handleClickGenerate = () => {
		const phrase = generatePassphrase(1);
		passphrase.value = phrase;
	};

	const handleClickEncrypt = useCallback(async () => {
		if (passphrase.value) {
			try {
				if (!payPk.value) {
					return;
				}

				const pubKey = PrivateKey.fromWif(payPk.value).toPublicKey().toString();
				encryptionKey.value =
					(await generateEncryptionKeyFromPassphrase(
						passphrase.value,
						pubKey,
					)) ?? null;

				if (!encryptionKey.value) {
					console.error("No encryption key found. Unable to encrypt.");
					return;
				}

				const iv = new Uint8Array(randomBytes(16).buffer);
				const encrypted = await encryptData(
					Buffer.from(
						JSON.stringify({
							mnemonic: mnemonic.value,
							payPk: payPk.value,
							ordPk: ordPk.value,
							payDerivationPath: changeAddressPath.value,
							ordDerivationPath: ordAddressPath.value,
							...(!!identityPk.value && { identityPk: identityPk.value }),
							...(!!identityAddressPath.value && {
								identityDerivationPath: identityAddressPath.value,
							}),
						}),
						"utf-8",
					),
					encryptionKey.value,
					iv,
				);

				const encryptedBackup =
					encryptionPrefix + Buffer.concat([iv, encrypted]).toString("base64");

				const keys: EncryptedBackupJson = {
					encryptedBackup,
					pubKey,
				};

				if (download) {
					backupKeys();
				}

				if (migrating.value) {
					window.opener?.postMessage(
						{ type: "MIGRATION_SUCCESS" },
						"https://1satordinals.com",
					);
				}
				hasDownloadedKeys.value = true;

				localStorage.setItem("encryptedBackup", JSON.stringify(keys));
				passphrase.value = "";

				importWalletFromBackupJsonStep.value =
					ImportWalletFromBackupJsonStep.Done;
			} catch (e) {
				console.error(e);
				toast.error("Failed to encrypt keys", toastErrorProps);
			}
		}
	}, [download, hasDownloadedKeys]);

	const handleClickDecrypt = async () => {
		if (passphrase.value) {
			try {
				await loadKeysFromEncryptedStorage(passphrase.value);
				onSubmit();
			} catch (e) {
				console.error(e);
				toast.error("Failed to decrypt keys", toastErrorProps);
			}
			passphrase.value = "";
		}
	};

	const handleSubmit = async (e?: FormEvent) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}

		if (showEnterPassphrase.value === EncryptDecrypt.Decrypt) {
			await handleClickDecrypt();
		} else {
			await handleClickEncrypt();
		}

		onSubmit();
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{!hasDownloadedKeys.value && (
				<p className="font-mono text-sm text-zinc-400">
					Enter a password to{" "}
					{showEnterPassphrase.value === EncryptDecrypt.Decrypt
						? "decrypt"
						: "encrypt"}{" "}
					your saved keys.
				</p>
			)}

			{!hasDownloadedKeys.value && (
				<div className="relative">
					{mode === EncryptDecrypt.Encrypt && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={!passphrase.value}
							className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-zinc-500 hover:text-green-400 disabled:opacity-30"
							onClick={() => {
								copy(passphrase.value || "");
								toast.success("Copied phrase. Careful now!", toastProps);
							}}
						>
							<Copy className="w-4 h-4" />
						</Button>
					)}

					<Input
						className="bg-zinc-900 border-zinc-800 rounded-none font-mono text-sm placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-green-500 pr-10"
						type="password"
						onChange={handlePassphraseChange}
						value={passphrase.value || ""}
						placeholder="your-password-here"
						ref={passwordInputRef}
					/>
				</div>
			)}

			{showEnterPassphrase.value === EncryptDecrypt.Encrypt && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={handleClickGenerate}
					className="text-blue-400 hover:text-blue-300 font-mono text-xs uppercase tracking-wider"
				>
					<Dices className="w-4 h-4 mr-2" />
					Generate Strong Passphrase
				</Button>
			)}

			<div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
				<AlertTriangle className="w-4 h-4 flex-shrink-0" />
				<span>
					{showEnterPassphrase.value === EncryptDecrypt.Encrypt
						? "You still need to keep your 12 word seed phrase."
						: "Your password unlocks your wallet each time you visit."}
				</span>
			</div>

			<div className="flex gap-2 justify-end pt-2">
				{!migrating.value && !download && (
					<Button
						type="button"
						variant="outline"
						onClick={() => onSubmit()}
						className="rounded-none border-red-900/50 text-red-400 hover:bg-red-900/20 font-mono text-xs uppercase"
					>
						Skip
					</Button>
				)}

				<Button
					disabled={(passphrase.value?.length || 0) < 6}
					type="button"
					onClick={handleSubmit}
					className="rounded-none bg-green-600 hover:bg-green-500 text-black font-mono text-xs uppercase tracking-wider disabled:opacity-30"
				>
					<KeyRound className="w-4 h-4 mr-2" />
					{showEnterPassphrase.value === EncryptDecrypt.Decrypt
						? "Unlock Wallet"
						: `Encrypt ${download ? "& Download" : ""} Keys`}
				</Button>

				{hasDownloadedKeys.value && (
					<Button
						type="button"
						onClick={() => onSubmit()}
						className="rounded-none bg-green-600 hover:bg-green-500 text-black font-mono text-xs uppercase tracking-wider"
					>
						Continue
					</Button>
				)}
			</div>
		</form>
	);
};

export default EnterPassphrase;
