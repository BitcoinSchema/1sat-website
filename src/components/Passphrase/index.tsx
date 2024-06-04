"use client";

import { encryptionPrefix, toastErrorProps, toastProps } from "@/constants";
import {
	ImportWalletFromBackupJsonStep,
	encryptionKey,
	importWalletFromBackupJsonStep,
	mnemonic,
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
import { effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { PrivateKey } from "bsv-wasm-web";
import randomBytes from "randombytes";
import { useEffect, useRef, useState, type FormEvent } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { RiErrorWarningFill } from "react-icons/ri";
import { TbDice } from "react-icons/tb";

type Props = {
	mode: EncryptDecrypt;
	download?: boolean;
	onSubmit: () => void;
};

const EnterPassphrase: React.FC<Props> = ({
	mode,
	onSubmit,
	download = true,
}) => {
	useSignals();
	const showEnterPassphrase = useSignal<EncryptDecrypt | null>(mode);
	const hasDownloadedKeys = useSignal<boolean>(false);
	const passwordInputRef = useRef<HTMLInputElement>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		console.log("set mounted");
		setMounted(true);
	}, []);

	// autofocus without using the autoFocus property
	effect(() => {
		if (
			mounted &&
			showEnterPassphrase.value !== null &&
			passwordInputRef.current
		) {
			// check if the element if visible
			if (
				passwordInputRef.current.getBoundingClientRect().top <
				window.innerHeight
			) {
				passwordInputRef.current.focus();
			}
		}
	});

	const backupKeys = (keys: EncryptedBackupJson) => {
		const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
			JSON.stringify({
				payPk: payPk.value,
				ordPk: ordPk.value,
				mnemonic: mnemonic.value,
			})
		)}`;

		const clicker = document.createElement("a");
		clicker.setAttribute("href", dataStr);
		clicker.setAttribute("download", "1sat.json");
		clicker.click();
	};

	const handlePassphraseChange = (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		passphrase.value = e.target.value;
	};

	const handleClickGenerate = () => {
		const phrase = generatePassphrase(1);
		passphrase.value = phrase;
	};

	const handleClickEncrypt = async () => {
		if (passphrase.value) {
			console.log("encrypt keys with passphrase");
			try {
				if (!payPk.value) {
					return;
				}

				const pubKey = PrivateKey.from_wif(payPk.value)
					.to_public_key()
					.to_hex();
				encryptionKey.value =
					(await generateEncryptionKeyFromPassphrase(
						passphrase.value,
						pubKey
					)) ?? null;

				if (!encryptionKey.value) {
					console.error(
						"No encryption key found. Unable to encrypt."
					);
					return;
				}

				const iv = new Uint8Array(randomBytes(16).buffer);
				const encrypted = encryptData(
					Buffer.from(
						JSON.stringify({
							payPk: payPk.value,
							ordPk: ordPk.value,
						}),
						"utf-8"
					),
					encryptionKey.value,
					iv
				);

				const encryptedBackup =
					encryptionPrefix +
					Buffer.concat([iv, encrypted]).toString("base64");

				const keys: EncryptedBackupJson = {
					encryptedBackup,
					pubKey,
				};

				if (download) {
					backupKeys(keys);
				}

				hasDownloadedKeys.value = true;

				localStorage.setItem("encryptedBackup", JSON.stringify(keys));
				passphrase.value = "";

				// go to done step
				importWalletFromBackupJsonStep.value =
					ImportWalletFromBackupJsonStep.Done;
			} catch (e) {
				console.error(e);
				toast.error("Failed to encrypt keys", toastErrorProps);
			}
		}
	};

	const handleClickDecrypt = async () => {
		if (passphrase.value) {
			console.log("decrypt keys w passphrase");

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
	};

	return (
		<form onSubmit={handleSubmit}>
			<div className="my-4">
				Enter a password to{" "}
				{showEnterPassphrase.value === EncryptDecrypt.Decrypt
					? "decrypt"
					: "encrypt"}{" "}
				your saved keys.
			</div>
			<div className="font-semibold md:text-xl my-2 relative">
				{mode === EncryptDecrypt.Encrypt && (
					<div className="absolute right-0 h-full flex items-center justify-center mr-2 cursor-pointer">
						<CopyToClipboard
							text={passphrase.value || ""}
							onCopy={() => {
								toast.success(
									"Copied phrase. Careful now!",
									toastProps
								);
							}}
						>
							<button
								disabled={!passphrase.value}
								className="disabled:text-[#555] transition text-yellow-500 font-semibold font-mono"
							>
								<FiCopy />
							</button>
						</CopyToClipboard>
					</div>
				)}

				{!hasDownloadedKeys.value && <input
					className="input input-bordered w-full placeholder-[#555]"
					type="password"
					onChange={handlePassphraseChange}
					value={passphrase.value!}
					placeholder={"your-password-here"}
					ref={passwordInputRef}
				/>}
			</div>

			{showEnterPassphrase.value === EncryptDecrypt.Encrypt && (
				<div>
					<div className="flex items-center">
						<div
							onClick={handleClickGenerate}
							className="flex items-center cursor-pointer p-2 group text-blue-400 hover:text-blue-500"
						>
							<TbDice className="mr-2 group-hover:animate-spin" />{" "}
							Generate a strong passphrase
						</div>
					</div>
				</div>
			)}
			<div className="text-gray-500 text-xs sm:test-sm md:text-base flex items-center my-4 ">
				<RiErrorWarningFill className="mr-2" />
				{showEnterPassphrase.value === EncryptDecrypt.Encrypt
					? "You still need to keep your 12 word seed phrase."
					: "Your password unlocks your wallet each time you visit."}
			</div>

			<div className="flex gap-2 justify-end">
				{!download && (
					<button
						className="btn btn-error"
						onClick={() => onSubmit()}
					>
						Skip
					</button>
				)}

				<button
					disabled={(passphrase.value?.length || 0) < 6}
					className="btn btn-primary"
					type="button"
					onClick={handleSubmit}
				>
					{showEnterPassphrase.value === EncryptDecrypt.Decrypt
						? "Unlock Wallet"
						: `Encrypt ${download ? "& Download" : ""} Keys`}
				</button>

				{hasDownloadedKeys.value && (
					<button
						className="btn btn-primary"
						onClick={() => onSubmit()}
					>
						Continue
					</button>
				)}
			</div>
		</form>
	);
};
export default EnterPassphrase;
