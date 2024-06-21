import {
	P2PKHAddress,
	PrivateKey,
	Script,
	SigHash,
	Transaction,
	TxIn,
	TxOut,
} from "bsv-wasm";
// import { Buffer } from "buffer";
import { Sigma, type AuthToken } from "sigma-protocol";
import type { StringOrBufferArray } from "../inscribe";
import { toHex } from "../strings";

interface Signer extends Object {}

export interface LocalSigner extends Signer {
	idKey: PrivateKey;
}

export interface RemoteSigner extends Signer {
	keyHost: string;
	authToken?: AuthToken;
}

export type Utxo = {
	satoshis: number;
	txid: string;
	vout: number;
	script: string;
};

export type Inscription = {
	dataB64: string;
	contentType: string;
};

export type MAP = {
	app: string;
	type: string;
	[prop: string]: string | string[];
};

const MAP_PREFIX = "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5";

const buildInscription = (
	destinationAddress: P2PKHAddress | string,
	b64File?: string | undefined,
	mediaType?: string | undefined,
	metaData?: MAP | undefined
): Script => {
	let ordAsm = "";
	// This can be omitted for reinscriptions that just update metadata
	if (b64File !== undefined && mediaType !== undefined) {
		const ordHex = toHex("ord");
		const fsBuffer = Buffer.from(b64File, "base64");
		const fireShardHex = fsBuffer.toString("hex");
		const fireShardMediaType = toHex(mediaType);
		ordAsm = `OP_0 OP_IF ${ordHex} OP_1 ${fireShardMediaType} OP_0 ${fireShardHex} OP_ENDIF`;
	}

	let address: P2PKHAddress;
	// normalize destinationAddress
	if (typeof destinationAddress === "string") {
		address = P2PKHAddress.from_string(destinationAddress);
	} else {
		address = destinationAddress;
	}
	// Create ordinal output and inscription in a single output
	let inscriptionAsm = `${address.get_locking_script().to_asm_string()}${
		ordAsm ? ` ${ordAsm}` : ""
	}`;

	// MAP.app and MAP.type keys are required
	if (metaData?.app && metaData?.type) {
		const mapPrefixHex = toHex(MAP_PREFIX);
		const mapCmdValue = toHex("SET");
		inscriptionAsm = `${inscriptionAsm} OP_RETURN ${mapPrefixHex} ${mapCmdValue}`;

		for (const [key, value] of Object.entries(metaData)) {
			if (key !== "cmd") {
				inscriptionAsm = `${inscriptionAsm} ${toHex(key)} ${toHex(
					value as string
				)}`;
			}
		}
	}

	return Script.from_asm_string(inscriptionAsm);
};

export const buildReinscriptionTemplate = async (
	ordinal: Utxo,
	destinationAddress: string,
	reinscription?: Inscription,
	metaData?: MAP
): Promise<Transaction> => {
	const tx = new Transaction(1, 0);

	// Inputs
	const utxoIn = new TxIn(
		Buffer.from(ordinal.txid, "hex"),
		ordinal.vout,
		Script.from_asm_string(ordinal.script)
	);

	tx.add_input(utxoIn);

	// Outputs
	const inscriptionScript = buildInscription(
		P2PKHAddress.from_string(destinationAddress),
		reinscription?.dataB64,
		reinscription?.contentType,
		metaData
	);

	const satOut = new TxOut(BigInt(1), inscriptionScript);
	tx.add_output(satOut);

	return tx;
};

export type Payment = {
	to: string;
	amount: bigint;
};

const createOrdinal = async (
	utxos: Utxo[] | Utxo,
	destinationAddress: string,
	paymentPk: PrivateKey,
	changeAddress: string,
	satPerByteFee: number,
	inscriptions: Inscription[] | Inscription,
	metaData?: MAP,
	signer?: LocalSigner | RemoteSigner,
	additionalPayments: Payment[] = []
): Promise<Transaction> => {
	console.log(
		"Creating tx",
		utxos,
		destinationAddress,
		paymentPk,
		changeAddress,
		satPerByteFee,
		inscriptions,
		metaData,
		signer,
		additionalPayments
	);
	console.log("Ready", Transaction);
	let tx = new Transaction(1, 0);
	const utxosArray = Array.isArray(utxos) ? utxos : [utxos];
	const inscriptionsArray = Array.isArray(inscriptions)
		? inscriptions
		: [inscriptions];

	for (const inscription of inscriptionsArray) {
		// Outputs
		const inscriptionScript = buildInscription(
			P2PKHAddress.from_string(destinationAddress),
			inscription.dataB64,
			inscription.contentType,
			metaData
		);

		const satOut = new TxOut(BigInt(1), inscriptionScript);
		tx.add_output(satOut);
	}

	// add additional payments if any
	for (const p of additionalPayments) {
		const satOut = new TxOut(
			p.amount,
			P2PKHAddress.from_string(p.to).get_locking_script()
		);
		tx.add_output(satOut);
	}

	// total the outputs
	let totalOut = 0n;
	const numOuts = tx.get_noutputs();
	for (const i of Array(numOuts).keys()) {
		totalOut += tx.get_output(i)?.get_satoshis() || 0n;
	}

	let totalSatsIn = 0n;
	let satisfied = false;
	for (const utxo of utxosArray) {
		// Inputs
		const utxoIn = new TxIn(
			Buffer.from(utxo.txid, "hex"),
			utxo.vout,
			Script.from_asm_string("")
		);
		totalSatsIn += BigInt(utxo.satoshis);
		tx.add_input(utxoIn);
		if (totalSatsIn > totalOut) {
			satisfied = true;
			break;
		}
	}

	console.log("on to the change", totalSatsIn, totalOut, satisfied);

	// add change
	const changeaddr = P2PKHAddress.from_string(changeAddress);
	const changeScript = changeaddr.get_locking_script();
	const fee = Math.ceil(
		satPerByteFee *
			(tx.get_size() + P2PKH_OUTPUT_SIZE + P2PKH_INPUT_SCRIPT_SIZE)
	);
	const change = totalSatsIn - totalOut - BigInt(fee);
	if (change < 0) throw new Error("Inadequate satoshis for fee");
	if (change > 0) {
		const changeOut = new TxOut(BigInt(change), changeScript);
		tx.add_output(changeOut);
	}

	console.log(
		"On to sigma signing",
		tx,
		utxosArray,
		paymentPk,
		signer,
		changeAddress,
		fee
	);
	// sign tx if idKey or remote signer like starfish/tokenpass
	const idKey = (signer as LocalSigner)?.idKey;
	const keyHost = (signer as RemoteSigner)?.keyHost;
	if (idKey) {
		// input txids are available so sigma signature
		// can be final before signing the tx
		const sigma = new Sigma(tx);
		const { signedTx } = sigma.sign(idKey);
		tx = signedTx;
	} else if (keyHost) {
		const authToken = (signer as RemoteSigner)?.authToken;
		const sigma = new Sigma(tx);
		try {
			const { signedTx } = await sigma.remoteSign(keyHost, authToken);
			tx = signedTx;
		} catch (e) {
			console.log(e);
			throw new Error(`Remote signing to ${keyHost} failed`);
		}
	}

	console.log("Sign the payments", {
		tx,
		utxosArray,
		paymentKey: paymentPk.to_wif(),
		changeAddress,
		fee,
	});
	const key = PrivateKey.from_wif(paymentPk.to_wif());
	// sign all the inputs
	let nInputs = tx.get_ninputs();
	while (nInputs--) {
		const utxoIn = tx.get_input(nInputs) as TxIn;
		const utxo = utxosArray[nInputs];
		const sig = tx.sign(
			key,
			SigHash.ALL | SigHash.FORKID,
			0,
			Script.from_asm_string(utxo.script),
			BigInt(utxo.satoshis)
		);

		utxoIn.set_unlocking_script(
			Script.from_asm_string(
				`${sig.to_hex()} ${key.to_public_key().to_hex()}`
			)
		);

		tx.set_input(0, utxoIn);
	}

	console.log("Created tx", { tx: tx.to_hex() });
	return tx;
};

const createOrdinalWithData = async (
	utxos: Utxo[] | Utxo,
	destinationAddress: string,
	paymentPk: PrivateKey,
	changeAddress: string,
	satPerByteFee: number,
	inscriptions: Inscription[] | Inscription,
	metaData: MAP | undefined,
	signer: LocalSigner | RemoteSigner | undefined,
	additionalPayments: Payment[],
	data: StringOrBufferArray
): Promise<Transaction> => {
	console.log(
		"Creating tx",
		utxos,
		destinationAddress,
		paymentPk,
		changeAddress,
		satPerByteFee,
		inscriptions,
		metaData,
		signer,
		additionalPayments,
		data
	);
	console.log("Ready", Transaction);
	let tx = new Transaction(1, 0);
	const utxosArray = Array.isArray(utxos) ? utxos : [utxos];
	const inscriptionsArray = Array.isArray(inscriptions)
		? inscriptions
		: [inscriptions];

	for (const inscription of inscriptionsArray) {
		// Outputs
		const inscriptionScript = buildInscription(
			P2PKHAddress.from_string(destinationAddress),
			inscription.dataB64,
			inscription.contentType,
			metaData
		);

		const satOut = new TxOut(BigInt(1), inscriptionScript);
		tx.add_output(satOut);
	}

	// add data outputs
	const asmString = data
		.map((d) => (d instanceof Buffer ? d : Buffer.from(d)).toString("hex"))
		.join(" ");
	tx.add_output(
		new TxOut(
			BigInt(0),
			Script.from_asm_string(`OP_0 OP_RETURN ${asmString}`)
		)
	);

	// add additional payments if any
	for (const p of additionalPayments || []) {
		const satOut = new TxOut(
			p.amount,
			P2PKHAddress.from_string(p.to).get_locking_script()
		);
		tx.add_output(satOut);
	}

	// total the outputs
	let totalOut = 0n;
	const numOuts = tx.get_noutputs();
	for (const i of Array(numOuts).keys()) {
		totalOut += tx.get_output(i)?.get_satoshis() || 0n;
	}

	let totalSatsIn = 0n;
	let satisfied = false;
	for (const utxo of utxosArray) {
		// Inputs
		const utxoIn = new TxIn(
			Buffer.from(utxo.txid, "hex"),
			utxo.vout,
			Script.from_asm_string("")
		);
		totalSatsIn += BigInt(utxo.satoshis);
		tx.add_input(utxoIn);
		if (totalSatsIn > totalOut) {
			satisfied = true;
			break;
		}
	}

	console.log("on to the change", totalSatsIn, totalOut, satisfied);

	// add change
	const changeaddr = P2PKHAddress.from_string(changeAddress);
	const changeScript = changeaddr.get_locking_script();
	const fee = Math.ceil(
		satPerByteFee *
			(tx.get_size() + P2PKH_OUTPUT_SIZE + P2PKH_INPUT_SCRIPT_SIZE)
	);
	const change = totalSatsIn - totalOut - BigInt(fee);
	if (change < 0) throw new Error("Inadequate satoshis for fee");
	if (change > 0) {
		const changeOut = new TxOut(BigInt(change), changeScript);
		tx.add_output(changeOut);
	}

	console.log(
		"On to sigma signing",
		tx,
		utxosArray,
		paymentPk,
		signer,
		changeAddress,
		fee
	);
	// sign tx if idKey or remote signer like starfish/tokenpass
	const idKey = (signer as LocalSigner)?.idKey;
	const keyHost = (signer as RemoteSigner)?.keyHost;
	if (idKey) {
		// input txids are available so sigma signature
		// can be final before signing the tx
		const sigma = new Sigma(tx);
		const { signedTx } = sigma.sign(idKey);
		tx = signedTx;
	} else if (keyHost) {
		const authToken = (signer as RemoteSigner)?.authToken;
		const sigma = new Sigma(tx);
		try {
			const { signedTx } = await sigma.remoteSign(keyHost, authToken);
			tx = signedTx;
		} catch (e) {
			console.log(e);
			throw new Error(`Remote signing to ${keyHost} failed`);
		}
	}

	console.log("Sign the payments", {
		tx,
		utxosArray,
		paymentKey: paymentPk.to_wif(),
		changeAddress,
		fee,
	});
	const key = PrivateKey.from_wif(paymentPk.to_wif());
	// sign all the inputs
	let nInputs = tx.get_ninputs();
	while (nInputs--) {
		const utxoIn = tx.get_input(nInputs) as TxIn;
		const utxo = utxosArray[nInputs];
		const sig = tx.sign(
			key,
			SigHash.ALL | SigHash.FORKID,
			0,
			Script.from_asm_string(utxo.script),
			BigInt(utxo.satoshis)
		);

		utxoIn.set_unlocking_script(
			Script.from_asm_string(
				`${sig.to_hex()} ${key.to_public_key().to_hex()}`
			)
		);

		tx.set_input(0, utxoIn);
	}

	console.log("Created tx", { tx: tx.to_hex() });
	return tx;
};

const sendOrdinal = async (
	paymentUtxo: Utxo,
	ordinal: Utxo,
	paymentPk: PrivateKey,
	changeAddress: string,
	satPerByteFee: number,
	ordPk: PrivateKey,
	ordDestinationAddress: string,
	reinscription?: Inscription,
	metaData?: MAP,
	additionalPayments: Payment[] = []
): Promise<Transaction> => {
	const tx = new Transaction(1, 0);

	// Inputs
	const ordIn = new TxIn(
		Buffer.from(ordinal.txid, "hex"),
		ordinal.vout,
		Script.from_asm_string("")
	);
	tx.add_input(ordIn);

	const utxoIn = new TxIn(
		Buffer.from(paymentUtxo.txid, "hex"),
		paymentUtxo.vout,
		Script.from_asm_string("")
	);

	tx.add_input(utxoIn);

	let s: Script;
	const destinationAddress = P2PKHAddress.from_string(ordDestinationAddress);
	if (reinscription?.dataB64 && reinscription?.contentType) {
		s = buildInscription(
			destinationAddress,
			reinscription.dataB64,
			reinscription.contentType,
			metaData
		);
	} else if (metaData) {
		s = buildInscription(destinationAddress, undefined, undefined, metaData);
	} else {
		s = destinationAddress.get_locking_script();
	}
	const satOut = new TxOut(BigInt(1), s);
	tx.add_output(satOut);

	// add additional payments if any
	for (const p of additionalPayments) {
		const satOut = new TxOut(
			p.amount,
			P2PKHAddress.from_string(p.to).get_locking_script()
		);
		tx.add_output(satOut);
	}

	// total the outputs
	let totalOut = 0n;
	const numOuts = tx.get_noutputs();
	for (const i of Array(numOuts).keys()) {
		totalOut += tx.get_output(i)?.get_satoshis() || 0n;
	}

	// add change
	const changeaddr = P2PKHAddress.from_string(changeAddress);
	const changeScript = changeaddr.get_locking_script();

	const fee = Math.ceil(
		satPerByteFee *
			(tx.get_size() + P2PKH_OUTPUT_SIZE + 2 * P2PKH_INPUT_SCRIPT_SIZE)
	);
	const change = BigInt(paymentUtxo.satoshis) - totalOut - BigInt(fee);
	const changeOut = new TxOut(change, changeScript);

	tx.add_output(changeOut);

	// sign ordinal
	const sig = tx.sign(
		ordPk,
		SigHash.InputOutput,
		0,
		Script.from_asm_string(ordinal.script),
		BigInt(ordinal.satoshis)
	);

	ordIn.set_unlocking_script(
		Script.from_asm_string(
			`${sig.to_hex()} ${ordPk.to_public_key().to_hex()}`
		)
	);

	tx.set_input(0, ordIn);

	// sign fee payment
	const sig2 = tx.sign(
		paymentPk,
		SigHash.InputOutput,
		1,
		Script.from_asm_string(paymentUtxo.script),
		BigInt(paymentUtxo.satoshis)
	);

	utxoIn.set_unlocking_script(
		Script.from_asm_string(
			`${sig2.to_hex()} ${paymentPk.to_public_key().to_hex()}`
		)
	);

	tx.set_input(1, utxoIn);

	return tx;
};

// sendUtxos sends p2pkh utxos to the given destinationAddress
const sendUtxos = async (
	utxos: Utxo[],
	paymentPk: PrivateKey,
	address: P2PKHAddress,
	feeSats: number
): Promise<Transaction> => {
	const tx = new Transaction(1, 0);

	// Outputs
	let inputValue = 0;
	for (const u of utxos || []) {
		inputValue += u.satoshis;
	}
	const satsIn = inputValue;
	const satsOut = satsIn - feeSats;
	// console.log({ feeSats, satsIn, satsOut });
	tx.add_output(new TxOut(BigInt(satsOut), address.get_locking_script()));

	// build txins from our UTXOs
	let idx = 0;
	for (const u of utxos || []) {
		// console.log({ u });
		const inx = new TxIn(
			Buffer.from(u.txid, "hex"),
			u.vout,
			Script.from_asm_string("")
		);
		// console.log({ inx });
		inx.set_satoshis(BigInt(u.satoshis));
		tx.add_input(inx);

		const sig = tx.sign(
			paymentPk,
			SigHash.InputOutputs,
			idx,
			Script.from_asm_string(u.script),
			BigInt(u.satoshis)
		);

		inx.set_unlocking_script(
			Script.from_asm_string(
				`${sig.to_hex()} ${paymentPk.to_public_key().to_hex()}`
			)
		);

		tx.set_input(idx, inx);
		idx++;
	}
	return tx;
};

export const P2PKH_INPUT_SCRIPT_SIZE = 107;
export const P2PKH_FULL_INPUT_SIZE = 148;
export const P2PKH_OUTPUT_SIZE = 34;

export {
	buildInscription,
	createOrdinal,
	createOrdinalWithData,
	sendOrdinal,
	sendUtxos,
};
