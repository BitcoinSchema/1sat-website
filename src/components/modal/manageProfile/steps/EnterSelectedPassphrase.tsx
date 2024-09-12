import { useState, useCallback } from "react";
import { useSignals } from "@preact/signals-react/runtime";

import CancelButton from "../common/CancelButton";
import {
	ImportProfileFromBackupJsonStep,
	importProfileFromBackupJsonStep,
	bapIdentities,
	selectedBapIdentity,
	bapIdentityRaw,
	bapIdEncryptionKey,
	hasIdentityBackup,
	activeBapIdentity,
} from "@/signals/bapIdentity";
import { setIdentitySessionStorage } from "@/signals/bapIdentity/client";
import { passphrase, payPk } from "@/signals/wallet";
import {
	encryptData,
	generateEncryptionKeyFromPassphrase,
} from "@/utils/encryption";
import { loadKeysFromEncryptedStorage } from "@/signals/wallet/client";
import toast from "react-hot-toast";
import type { EncryptedIdentityJson } from "@/types/identity";
import { encryptionPrefix, toastErrorProps, toastProps } from "@/constants";
import { PrivateKey } from "@bsv/sdk";
import randomBytes from "randombytes";

interface Props {
	onClose: () => void;
}
export default function EnterSelectedPassphrase({ onClose }: Props) {
	useSignals();
	const [password, setPassword] = useState<string | undefined>();
	const [error, setError] = useState(false);

	const handleCancel = () => {
		cleanup();
		onClose();
	};

	const cleanup = () => {
		setError(false);
		setPassword(undefined);
		passphrase.value = "";
		bapIdentityRaw.value = null;
		selectedBapIdentity.value = null;
		bapIdentities.value = null;

		importProfileFromBackupJsonStep.value =
			ImportProfileFromBackupJsonStep.SelectFile;
	};

	const onSubmit = () => {
		passphrase.value = "";
		importProfileFromBackupJsonStep.value =
			ImportProfileFromBackupJsonStep.Done;
	};

	const passwordCanDecrypt = useCallback(async () => {
		if (!password) {
			console.log("Missing decryption password");
			return;
		}
		try {
			const succeeded = await loadKeysFromEncryptedStorage(password);
			if (succeeded === "SUCCESS") {
				return true;
			}
			return false;
		} catch (e) {
			console.error(e);
		}
	}, [password]);

	const handleEncryptProfile = useCallback(async () => {
		if (!passphrase.value || !payPk.value) {
			console.error("Missing passphrase or payPk");
			return;
		}
		console.log("passphrase", passphrase.value);
		try {
			const pubKey = PrivateKey.fromWif(payPk.value).toPublicKey().toString();
			bapIdEncryptionKey.value =
				(await generateEncryptionKeyFromPassphrase(passphrase.value, pubKey)) ??
				null;

			if (!bapIdEncryptionKey.value) {
				console.error("No encryption key found. Unable to encrypt.");
				return;
			}
			const encrypted = await encryptData(
				Buffer.from(
					JSON.stringify({
						activeBapIdentity: selectedBapIdentity.value,
					}),
					"utf-8",
				),
				bapIdEncryptionKey.value,
			);
      const encryptedIdentity = `${encryptionPrefix}${encrypted}`;

			const encryptedIdentitiesBackup = await encryptData(
				Buffer.from(
					JSON.stringify({
						allBapIdentities: bapIdentities.value,
					}),
					"utf-8",
				),
				bapIdEncryptionKey.value,
			);
      
			const encryptedAllIdentities =
				`${encryptionPrefix}${encryptedIdentitiesBackup}`;

			const activeIdentityBackup: EncryptedIdentityJson = {
				encryptedIdentity,
				pubKey,
			};

			const allIdentitiesBackup = {
				encryptedAllIdentities,
				pubKey,
			};

			const encryptedIdentityString = JSON.stringify(activeIdentityBackup);
			const encryptedAllIdentitiesString = JSON.stringify(allIdentitiesBackup);

			localStorage.setItem(
				"encryptedAllIdentities",
				encryptedAllIdentitiesString,
			);

			localStorage.setItem("encryptedIdentity", encryptedIdentityString);

			activeBapIdentity.value = selectedBapIdentity.value;
			hasIdentityBackup.value = true;
			if (!bapIdentities.value) {
				console.error("No identities found");
				return false;
			}
			if (!selectedBapIdentity.value) {
				console.error("No selected identity found");
				return false;
			}
			setIdentitySessionStorage(selectedBapIdentity.value);
			setIdentitySessionStorage(bapIdentities.value);
			return true;
		} catch (e) {
			console.log(e);
			toast.error("Failed to encrypt identity", toastErrorProps);
		}
	}, [
		bapIdEncryptionKey.value,
		bapIdentities.value,
		passphrase.value,
		payPk.value,
		selectedBapIdentity.value,
	]);

	const handleDecryptEncrypt = useCallback(async () => {
		const passwordCorrect = await passwordCanDecrypt();

		if (passwordCorrect && password) {
			passphrase.value = password;
			const identityEncrypted = await handleEncryptProfile();
			if (identityEncrypted) {
				onSubmit();
			}
		} else {
			setError(true);
		}
		setPassword(undefined);
	}, [password, passwordCanDecrypt, handleEncryptProfile]);

	return (
		<>
			<div className="mt-2 mb-4">
				Enter your encryption password:
				<label className="input input-bordered flex items-center gap-2 mt-5">
					{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 16 16"
						fill="currentColor"
						className="h-4 w-4 opacity-70"
					>
						<path
							fillRule="evenodd"
							d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
							clipRule="evenodd"
						/>
					</svg>
					<input
						type="password"
						className="grow"
						value={password}
						placeholder="Password"
						onChange={(e) => {
							setPassword(e.target.value);
							if (error) {
								setError(false);
							}
						}}
					/>
				</label>
				{error && (
					<p className="text-sm text-red-400 mt-2">
						The password is incorrect.
					</p>
				)}
			</div>
			<div className="flex w-full mt-5 justify-end">
				<CancelButton handleCancel={handleCancel} />
				<button
					type="button"
					className="btn btn-accent cursor-pointer ml-5"
					disabled={(password?.length || 0) < 6}
					onClick={() => handleDecryptEncrypt()}
				>
					Next
				</button>
			</div>
		</>
	);
}
