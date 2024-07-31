"use client";

import { toastErrorProps } from "@/constants";
import { payPk, pendingTxs, utxos } from "@/signals/wallet";
import { setPendingTxs } from "@/signals/wallet/client";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import {
	P2PKHAddress,
	PrivateKey,
	Script,
	SigHash,
	Transaction,
	TxIn,
	TxOut,
} from "bsv-wasm-web";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";
import { toBitcoin, toSatoshi } from "satoshi-bitcoin-ts";

interface DespotModalProps {
	onClose: () => void;
	amount?: number;
	address?: string;
}

const WithdrawalModal: React.FC<DespotModalProps> = ({
	amount: amt,
	address: addr,
	onClose,
}) => {
	useSignals();
	const router = useRouter();

	const amount = useSignal(amt?.toString());
	const address = useSignal(addr || "");

	const balance = computed(() => {
		if (!utxos.value) {
			return 0;
		}
		const amt = utxos.value.reduce(
			(acc, utxo) => acc + (utxo.satoshis || 0),
			0,
		);
		return Number.isNaN(amt) ? 0 : amt;
	});

	const setAmountToBalance = useCallback(() => {
		amount.value = `${balance.value > 0 ? toBitcoin(balance.value) : 0}`;
		console.log(amount.value);
	}, [amount, balance.value]);

	const send = useCallback(
		async (address: string, satoshis: number) => {
			if (!payPk.value) {
				return;
			}

			if (!address?.startsWith("1")) {
				console.error("inivalid receive address");
				return;
			}
			toast(`Sending to ${address}`, {
				style: {
					background: "#333",
					color: "#fff",
					fontSize: "0.8rem",
				},
			});

			const feeSats = 20;
			const satsNeeded = satoshis + feeSats;
			const paymentPk = PrivateKey.from_wif(payPk.value);
			const tx = new Transaction(1, 0);

			// Outputs
			let inputValue = 0;
			for (const u of utxos.value || []) {
				inputValue += u.satoshis;
				if (inputValue >= satsNeeded) {
					break;
				}
			}
			const satsIn = inputValue;

			const change = satsIn - satoshis - feeSats;
			tx.add_output(
				new TxOut(
					BigInt(satoshis),
					P2PKHAddress.from_string(address).get_locking_script(),
				),
			);

			// add change output
			if (change > 0) {
				tx.add_output(
					new TxOut(
						BigInt(change),
						P2PKHAddress.from_pubkey(
							PrivateKey.from_wif(payPk.value).to_public_key(),
						).get_locking_script(),
					),
				);
			}

      const spentOutpoints = []
			// build txins from our UTXOs
			let idx = 0;
			let totalSats = 0;
			for (const u of utxos.value || []) {
				// console.log({ u });
				const inx = new TxIn(
					Buffer.from(u.txid, "hex"),
					u.vout,
					Script.from_asm_string(""),
				);
				// console.log({ inx });
				inx.set_satoshis(BigInt(u.satoshis));
				tx.add_input(inx);
          
        spentOutpoints.push(`${u.txid}_${u.vout}`);

				const sig = tx.sign(
					paymentPk,
					SigHash.InputOutputs,
					idx,
					Script.from_asm_string(u.script),
					BigInt(u.satoshis),
				);

				inx.set_unlocking_script(
					Script.from_asm_string(
						`${sig.to_hex()} ${paymentPk.to_public_key().to_hex()}`,
					),
				);

				tx.set_input(idx, inx);
				idx++;

				totalSats += u.satoshis;
				if (satsNeeded <= totalSats) {
					break;
				}
			}

			const rawTx = tx.to_hex();
			// const { rawTx, fee, size, numInputs, numOutputs } = resp;

			const firstIn = tx.get_input(0);
			if (!firstIn) {
				toast.error("Error creating transaction", toastErrorProps);
				return;
			}
			setPendingTxs([
				{
					rawTx,
					size: Math.ceil(rawTx.length / 2),
					fee: 20,
					numInputs: tx.get_ninputs(),
					numOutputs: tx.get_noutputs(),
					txid: tx.get_id_hex(),
					spentOutpoints
				},
			])

			router.push("/preview");
			if (onClose) {
				onClose();
			}
		},
		[payPk.value, router, onClose, utxos.value],
	);

	const submit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			console.log({ e });
			e.preventDefault();
			if (!amount.value || !address.value) {
				return;
			}
			if (toSatoshi(amount.value) > balance.value) {
				toast.error("Not enough Bitcoin!", toastErrorProps);
				return;
			}

			// // check if address is valid @1sat.app paymail address
			// if (address.value.includes("@1sat.app")) {
			// 	// try to resolve paymail address to bitcoin address
			// 	// POST https://opns-paymail-production.up.railway.app/v1/bsvalias/p2p-payment-destination/shruggr@1sat.app

			// 	//const url = `https://opns-paymail-production.up.railway.app/v1/bsvalias/p2p-payment-destination/${address.value}`;
      //   const handle = address.value.split('@')[0];
      //   const url = `https://ordinals.gorillapool.io/api/opns/${handle}`
			// 	// const headers = {
			// 	// 	Accept: "application/json",
			// 	// 	"Content-Type": "application/json",
			// 	// };
			// 	const resp = await fetch(url, {
			// 		// headers,
			// 		// method: "POST",
			// 		// body: JSON.stringify({
			// 		// 	satoshis: toSatoshi(amount.value),
			// 		// }),
			// 	});
			// 	type PaymailResponse = {
			// 		outputs: {
			// 			satoshis: number;
			// 			script: string;
			// 		}[];
			// 		reference: string;
			// 	};
      //   // {
      //   //   "outpoint": "d10057af8e5365d259a3401b542ca94f9a210f8ff8dd04346b0d3661bf46b84b_2",
      //   //   "origin": "d10057af8e5365d259a3401b542ca94f9a210f8ff8dd04346b0d3661bf46b84b_2",
      //   //   "domain": "shruggr",
      //   //   "owner": "1MUqT79bq5xbNWHbb96qvv12U56WN8oiyr",
      //   //   "map": null
      //   // }
      //   type OpNSResponse = {
      //     outpoint: string;
      //     origin: string;
      //     domain: string;
      //     owner: string;
      //     map: null;
      //   }
			// 	const json = (await resp.json()) as OpNSResponse;
			// 	console.log(json);

      //   address.value = json.owner;

			// 	// get address from script
			// 	// const s = json.outputs[0].script;
			// 	// const script = Script.from_hex(s).to_asm_string();
			// 	// const pubKeyHash = script.split(" ")[2];
			// 	// address.value = P2PKHAddress.from_pubkey_hash(
			// 	// 	Buffer.from(pubKeyHash, "hex"),
			// 	// ).to_string();

			// 	// later this will return
			// 	//   {
			// 	//     "outputs": [
			// 	//         {
			// 	//             "satoshis": 1,
			// 	//             "script": "76a914e0a630d5395b510c5ce3647b12cafe2c9dc8b1a988ac"
			// 	//         }
			// 	//     ],
			// 	//     "reference": "1234567890"
			// 	// }
			// 	// which is OP_DUP OP_HASH160 e0a630d5395b510c5ce3647b12cafe2c9dc8b1a9 OP_EQUALVERIFY OP_CHECKSIG
			// 	return;
			// }

			console.log(amount.value, address.value);
			await send(address.value, toSatoshi(amount.value));
		},
		[amount.value, address.value, balance.value, send],
	);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen backdrop-blur bg-black bg-opacity-50 overflow-hidden"
			onClick={() => onClose()}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				className="w-full max-w-lg m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col border border-yellow-200/5"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="relative w-full h-64 md:h-full overflow-hidden mb-4">
					<form onSubmit={submit}>
						<div className="flex justify-between">
							<div className="text-lg font-semibold">Withdraw</div>
							{balance.value !== undefined && (
								// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
								<div
									className="text-xs cursor-pointer text-[#aaa]"
									onClick={setAmountToBalance}
								>
									Balance: {balance.value > 0 ? toBitcoin(balance.value) : 0}{" "}
									BSV
								</div>
							)}
							{balance.value === undefined && (
								<div className="text-xs cursor-pointer text-[#aaa]">
									<CgSpinner className="animate-spin" />
								</div>
							)}
						</div>

						<div className="flex flex-col w-full">
							<label className="text-sm font-semibold text-[#aaa] mb-2">
								Amount
							</label>
							<input
								type="text"
								placeholder="0.00000000"
								className="input input-bordered w-full"
								value={amount.value || ""}
								onChange={(e) => {
									if (
										e.target.value === "" ||
										Number.parseFloat(e.target.value) <= balance.value
									) {
										amount.value = e.target.value;
									}
								}}
							/>
						</div>
						<div className="flex flex-col mt-4">
							<label className="text-sm font-semibold text-[#aaa] mb-2">
								Address
							</label>
							<input
								type="text"
								placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
								className="input input-bordered w-full"
								value={address.value}
								onChange={(e) => {
									address.value = e.target.value;
								}}
							/>
						</div>
						<div className="modal-action">
							<button
								type="submit"
								disabled={
									Number.parseFloat(amount.value || "0") <= 0 || !address.value
								}
								className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white disabled:btn-disabled diabled:hover:btn-disabled"
							>
								Send
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default WithdrawalModal;
