"use client";

import {
	API_HOST,
	toastErrorProps,
} from "@/constants";
import {
	bsv20Balances,
	ordPk,
	payPk,
	utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { BSV20TXO } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import { getUtxos } from "@/utils/address";
import * as http from "@/utils/httpClient";
import type { Utxo } from "js-1sat-ord";
import { computed, effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { MarketData } from "./list";
import { showAddListingModal } from "./tokenMarketTabs";
import { setPendingTxs } from "@/signals/wallet/client";
import { PrivateKey } from "@bsv/sdk";
import { type TokenListing, TokenType, type CreateOrdTokenListingsConfig, type NewListing, type TokenUtxo, createOrdTokenListings } from "js-1sat-ord";

const ListingForm = ({
	initialPrice,
	ticker,
	listedCallback,
}: {
	ticker: Partial<MarketData>;
	initialPrice: string;
	listedCallback: () => void;
}) => {
	useSignals();
	const router = useRouter();
	const listingPrice = useSignal<string | null>(null);
	const listingAmount = useSignal<string | null>(null);

	const priceInputRef = useRef<HTMLInputElement>(null);
	const amountInputRef = useRef<HTMLInputElement>(null);
	const [mounted, setMounted] = useState(false);

	// set initial price
	useEffect(() => {
		if (initialPrice && !listingPrice.value) {
			listingPrice.value = initialPrice;
		}
	}, [initialPrice, listingPrice.value]);

	const confirmedBalance = computed(() => {
		return (
			bsv20Balances.value?.find(
				(b) =>
					(b.tick && b.tick === ticker.tick) || (b.id && b.id === ticker.id),
			)?.all.confirmed || 0
		);
	});

	const pendingBalance = computed(() => {
		return (
			bsv20Balances.value?.find(
				(b) =>
					(b.tick && b.tick === ticker.tick) || (b.id && b.id === ticker.id),
			)?.all.pending || 0
		);
	});

	const listedBalance = computed(() => {
		return (
			bsv20Balances.value?.find(
				(b) =>
					(b.tick && b.tick === ticker.tick) || (b.id && b.id === ticker.id),
			)?.listed.confirmed || 0
		);
	});

	const pendingListedBalance = computed(() => {
		return (
			bsv20Balances.value?.find(
				(b) =>
					(b.tick && b.tick === ticker.tick) || (b.id && b.id === ticker.id),
			)?.listed.pending || 0
		);
	});

	const dec = computed(() => {
		return (
			bsv20Balances.value?.find(
				(b) =>
					(b.tick && b.tick === ticker.tick) || (b.id && b.id === ticker.id),
			)?.dec || 0
		);
	});

	// useEffect(() => {
	//   console.log({ amt: listingAmount.value });
	// }, [listingAmount]);

	const listBsv20 = useCallback(
		async (
			amt: string,
			utxos: Utxo[],
			inputTokens: BSV20TXO[], //
			paymentPk: PrivateKey,
			changeAddress: string,
			ordPk: PrivateKey,
			ordAddress: string,
			payAddress: string,
			satoshisPayout: number,
			indexerAddress: string,
		): Promise<PendingTransaction> => {
			
      const listing: TokenListing = {
        payAddress,
        price: satoshisPayout,
        ordAddress,
        amt: BigInt(amt),
      }

      const additionalPayments = []
      if (indexerAddress) {
        additionalPayments.push({
          to: indexerAddress,
          amount: 2000, // 1000 * 2 inscriptions
        })
      }

      console.log({inputTokens})
      const config: CreateOrdTokenListingsConfig = {
        utxos,
        listings: [listing],
        paymentPk,
        ordPk,
        protocol: ticker.tick ? TokenType.BSV20 : TokenType.BSV21,
        tokenID: (ticker.tick || ticker.id) as string,
        changeAddress,
        inputTokens: inputTokens.map((i) => ({
          amt: i.amt,
          id: i.tick ? i.tick : i.id,
          satoshis: i.satoshis,
          script: i.script,
          vout: i.vout,
          txid: i.txid,
        }) as TokenUtxo),
        tokenChangeAddress: ordAddress,
        additionalPayments
      }

      
      const { tx, spentOutpoints, tokenChange, payChange } = await createOrdTokenListings(config);
      
			// const tx = new Transaction(1, 0);

      // const spentOutpoints = []
      // const tokenChange = []

			// // add token inputs
			// let amounts = 0;
			// let i = 0;
			// for (const utxo of inputTokens) {
			// 	const txBuf = Buffer.from(utxo.txid, "hex");
			// 	const utxoIn = new TxIn(txBuf, utxo.vout, Script.from_asm_string(""));
			// 	amounts += Number.parseInt(utxo.amt);
			// 	tx.add_input(utxoIn);  
      //   spentOutpoints.push(`${utxo.txid}_${utxo.vout}`)

			// 	// sign ordinal
			// 	const sig = tx.sign(
			// 		ordPk,
			// 		SigHash.NONE | SigHash.ANYONECANPAY | SigHash.FORKID,
			// 		i,
			// 		Script.from_bytes(Buffer.from(utxo.script, "base64")),
			// 		BigInt(1),
			// 	);

			// 	utxoIn.set_unlocking_script(
			// 		Script.from_asm_string(
			// 			`${sig.to_hex()} ${ordPk.to_public_key().to_hex()}`,
			// 		),
			// 	);

			// 	tx.set_input(i, utxoIn);
			// 	i++;
			// 	if (sendAmount <= amounts) {
			// 		break;
			// 	}
			// }
			// // make sure we have enough to cover the send amount
			// if (amounts < sendAmount) {
			// 	// console.log({amounts, sendAmount})
			// 	toast.error(`Not enough ${ticker.tick || ticker.sym}`, toastErrorProps);
			// 	throw new Error("insufficient funds");
			// }

			// if (amounts > sendAmount) {
			// 	// build change inscription
			// 	const changeInscription = {
			// 		p: "bsv-20",
			// 		op: "transfer",
			// 		amt: (amounts - sendAmount).toString(),
			// 	} as {
			// 		p: string;
			// 		op: string;
			// 		amt: string;
			// 		tick?: string;
			// 		id?: string;
			// 	};
			// 	if (ticker.tick) {
			// 		changeInscription.tick = ticker.tick;
			// 	} else if (ticker.id) {
			// 		changeInscription.id = ticker.id;
			// 	} else {
			// 		throw new Error("unexpected error");
			// 	}
			// 	const changeFileB64 = Buffer.from(
			// 		JSON.stringify(changeInscription),
			// 	).toString("base64");
			// 	const changeInsc = buildInscriptionSafe(
			// 		P2PKHAddress.from_string(ordAddress),
			// 		changeFileB64,
			// 		"application/bsv-20",
			// 	);
			// 	const changeInscOut = new TxOut(BigInt(1), changeInsc);
			// 	tx.add_output(changeInscOut);
			// }

			// let totalSatsIn = 0;
			// // payment Inputs
			// for (const utxo of paymentUtxos.sort((a, b) => {
			// 	return a.satoshis > b.satoshis ? -1 : 1;
			// })) {
			// 	let utxoIn = new TxIn(
			// 		Buffer.from(utxo.txid, "hex"),
			// 		utxo.vout,
			// 		Script.from_asm_string(""),
			// 	);

			// 	tx.add_input(utxoIn);
      //   spentOutpoints.push(`${utxo.txid}_${utxo.vout}`)

			// 	utxoIn = signPayment(tx, paymentPk, i, utxo, utxoIn);
			// 	tx.set_input(i, utxoIn);
			// 	totalSatsIn += utxo.satoshis;
			// 	i++;
			// 	break;
			// }

			// const payoutDestinationAddress = P2PKHAddress.from_string(payoutAddress);
			// const payOutput = new TxOut(
			// 	BigInt(satoshisPayout),
			// 	payoutDestinationAddress.get_locking_script(),
			// );

			// const destinationAddress = P2PKHAddress.from_string(ordAddress);
			// const addressHex = destinationAddress
			// 	.get_locking_script()
			// 	.to_asm_string()
			// 	.split(" ")[2];

			// const inscription = {
			// 	p: "bsv-20",
			// 	op: "transfer",
			// 	amt: sendAmount.toString(),
			// } as {
			// 	p: string;
			// 	op: string;
			// 	amt: string;
			// 	tick?: string;
			// 	id?: string;
			// };
			// if (ticker.tick) {
			// 	inscription.tick = ticker.tick;
			// } else if (ticker.id) {
			// 	inscription.id = ticker.id;
			// }

			// const fileB64 = Buffer.from(JSON.stringify(inscription)).toString(
			// 	"base64",
			// );
			// const insc = buildInscriptionSafe(
			// 	destinationAddress.to_string(),
			// 	fileB64,
			// 	"application/bsv-20",
			// );
			// const transferInscription = insc
			// 	.to_asm_string()
			// 	.split(" ")
			// 	.slice(5) // remove the p2pkh added by buildInscription
			// 	.join(" ");

			// const ordLockScript = `${transferInscription} ${Script.from_hex(
			// 	oLockPrefix,
			// ).to_asm_string()} ${addressHex} ${payOutput.to_hex()} ${Script.from_hex(
			// 	oLockSuffix,
			// ).to_asm_string()}`;

			// const satOut = new TxOut(
			// 	BigInt(1),
			// 	Script.from_asm_string(ordLockScript),
			// );
			// tx.add_output(satOut);

			// // output 4 indexer fee
			// if (indexerAddress) {
			// 	const indexerFeeOutput = new TxOut(
			// 		BigInt(2000), // 1000 * 2 inscriptions
			// 		P2PKHAddress.from_string(indexerAddress).get_locking_script(),
			// 	);
			// 	tx.add_output(indexerFeeOutput);
			// }

			// const changeOut = createChangeOutput(tx, changeAddress, totalSatsIn);
			// tx.add_output(changeOut);

			return {
				rawTx: tx.toHex(),
				size: tx.toBinary().length,
				fee: tx.getFee(),
				numInputs: tx.inputs.length,
				numOutputs: tx.outputs.length,
				txid: tx.id('hex'),
				spentOutpoints,
				marketFee: 0,
        tokenChange,
        payChange
			};
		},
		[ticker],
	);

	const submit = useCallback(
		async (e: React.FormEvent) => {
			
			e.preventDefault();
			console.log(
				"create listing",
				ticker,
				{ price: listingPrice.value },
				{ amount: listingAmount.value },
			);
			if (
				!ticker.fundAddress ||
				!utxos.value ||
				!payPk.value ||
				!ordPk.value ||
				!fundingAddress.value ||
				!ordAddress.value
			) {
				toast.error("Missing wallet requirement", toastErrorProps);
				return;
			}
			if (!listingPrice.value || !listingAmount.value) {
				toast.error("Missing listing price or amount", toastErrorProps);
				return;
			}
			const paymentPk = PrivateKey.fromWif(payPk.value);
			const ordinalPk = PrivateKey.fromWif(ordPk.value);

			// [{"txid":"69a5956ee1cad8056f0c4d6ca4f87766080b36a75f2192d2cf75f1f668f446d6","vout":2,"outpoint":"69a5956ee1cad8056f0c4d6ca4f87766080b36a75f2192d2cf75f1f668f446d6_2","height":828275,"idx":1162,"op":"transfer","amt":"10000","status":1,"reason":null,"listing":false,"owner":"139xRf73Vw3W8cMNoXW9amqZfXMrEuM9XQ","spend":"","spendHeight":null,"spendIdx":null,"tick":"PEPE","id":null,"price":"0","pricePer":"0","payout":null,"script":"dqkUF6HYh83S8XxpORgFL3VFy4fwqDSIrABjA29yZFESYXBwbGljYXRpb24vYnN2LTIwADp7InAiOiJic3YtMjAiLCJvcCI6InRyYW5zZmVyIiwidGljayI6IlBFUEUiLCJhbXQiOiIxMDAwMCJ9aA==","sale":false}]

			// setPendingTransaction(pendingTx);

			try {
				let url = `${API_HOST}/api/bsv20/${ordAddress.value}/tick/${ticker.tick}?listing=false`;
				if (ticker.id) {
					url = `${API_HOST}/api/bsv20/${ordAddress.value}/id/${ticker.id}?listing=false`;
				}
				// console.log({ url });
				const { promise } = http.customFetch<BSV20TXO[]>(url);

				const u = await promise;
				const satoshisPayout = Math.ceil(
					Number.parseFloat(listingPrice.value) *
						Number.parseFloat(listingAmount.value),
				);
				const indexerAddress = ticker.fundAddress;
				// refresh utxos
				utxos.value = await getUtxos(fundingAddress.value);

				const pendingTx = await listBsv20(
					// Math.ceil(Number.parseFloat(listingAmount.value) * 10 ** dec.value),
          listingAmount.value,
					utxos.value,
					u,
					paymentPk,
					fundingAddress.value,
					ordinalPk,
					ordAddress.value,
					fundingAddress.value,
					satoshisPayout,
					indexerAddress,
				);

				setPendingTxs([pendingTx]);

				router.push("/preview");
			} catch (e) {
				console.log({ e });
			}
			// const ordUtxo = await getUtxoByOutpoint(selectedItem.origin.outpoint);
			// if (!ordUtxo) {
			//   // TODO: show error
			//   return;
			// }
		},
		[ticker, listingPrice.value, listingAmount.value, utxos.value, payPk.value, ordPk.value, fundingAddress.value, ordAddress.value, listBsv20, router],
	);

	const listDisabled = useMemo(
		() =>
			!listingAmount.value ||
			!listingPrice.value ||
			Number.parseFloat(listingAmount.value || "0") === 0 ||
			listingPrice.value === "0" ||
			Number.parseFloat(amountInputRef.current?.value || "0") >
				confirmedBalance.value / 10 ** dec.value -
					listedBalance.value / 10 ** dec.value,
		[
			listingAmount.value,
			listingPrice.value,
			confirmedBalance.value,
			dec.value,
			listedBalance.value,
		],
	);

	useEffect(() => {
		console.log("set mounted");
		setMounted(true);
	}, []);

	// autofocus without using the autoFocus property
	effect(() => {
		if (
			mounted &&
			showAddListingModal.value !== null &&
			amountInputRef.current
		) {
			// check which element is currently focused
			const activeElement = document.activeElement as HTMLElement;
			// console.log({ activeElement });
			// check if the element if visible
			if (
				amountInputRef.current.getBoundingClientRect().top <
					window.innerHeight &&
				activeElement !== amountInputRef.current &&
				activeElement !== priceInputRef.current
			) {
				amountInputRef.current.focus();
			}
		}
	});

	return (
		<div className="h-60 w-full">
			<form action="dialog">
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
				<div
					className="text-center text-xl font-semibold cursor-pointer"
					onClick={(e) => {
						e.preventDefault();
						const convertedValue = confirmedBalance.value / 10 ** dec.value;
						listingAmount.value = convertedValue.toString() || null;
					}}
				>
					Balance:{" "}
					{(confirmedBalance.value - listedBalance.value) / 10 ** dec.value}{" "}
					{pendingBalance.value > 0
						? `(${pendingBalance.value / 10 ** dec.value} pending)`
						: ""}
					{pendingListedBalance.value > 0
						? `(-${pendingListedBalance.value / 10 ** dec.value} pending)`
						: ""}
				</div>
				<div className="form-control w-full">
					<label className="label">
						<span className="label-text">Amount</span>
					</label>
					<input
						ref={amountInputRef}
						type="number"
						placeholder="0"
						className="input input-sm input-bordered"
						onChange={(e) => {
							// make sure amount respects decimals
							const dec = ticker.dec || 0;
							if (e.target.value.includes(".")) {
								const parts = e.target.value.split(".");
								if (parts.length > 2) {
									return;
								}
								if (parts[1].length > dec) {
									return;
								}
							}
							listingAmount.value = e.target.value;
						}}
						value={listingAmount.value || undefined}
						max={confirmedBalance.value}
					/>
				</div>
				<div className="form-control w-full">
					<label className="label flex items-center justify-between">
						<span className="label-text">Price per token</span>
						<span className="text-[#555]">Sats</span>
					</label>
					<input
						ref={priceInputRef}
						type="text"
						placeholder="1000"
						className="input input-sm input-bordered"
						onChange={(e) => {
							e.preventDefault();
							listingPrice.value = e.target.value;
						}}
					/>
				</div>

				<div className="modal-action">
					<button
						type="button"
						className={"btn btn-sm btn-primary"}
						// make sure the balance available is enough
						disabled={listDisabled}
						onClick={submit}
					>
						{`List ${listingAmount.value || 0} ${ticker.tick || ticker.sym}`}
					</button>
				</div>
			</form>
		</div>
	);
};

export default ListingForm;
