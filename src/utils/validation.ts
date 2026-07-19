// A 64-char hex txid, optionally followed by _vout (e.g. abc...def_0)
const outpointRegex = /^[0-9a-fA-F]{64}(?:_\d{1,6})?$/;

// Base58 alphabet, typical P2PKH address length
const base58AddressRegex = /^[1-9A-HJ-NP-Za-km-z]{25,34}$/;

export const isValidOutpoint = (value: string | undefined | null): boolean =>
	!!value && outpointRegex.test(value);

export const isValidBase58Address = (
	value: string | undefined | null,
): boolean => !!value && base58AddressRegex.test(value);
