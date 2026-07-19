// A 64-char hex txid, optionally followed by a vout separated by `_` (legacy
// web convention) or `.` (1sat-stack convention)
const outpointRegex = /^[0-9a-fA-F]{64}(?:[_.]\d{1,6})?$/;

export const isValidOutpoint = (value: string | undefined | null): boolean =>
	!!value && outpointRegex.test(value);

// Base58 alphabet, typical P2PKH address length
const base58AddressRegex = /^[1-9A-HJ-NP-Za-km-z]{25,34}$/;

export const isValidBase58Address = (
	value: string | undefined | null,
): boolean => !!value && base58AddressRegex.test(value);
