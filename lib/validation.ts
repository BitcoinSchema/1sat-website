// A 64-char hex txid, optionally followed by a vout separated by `_` (legacy
// web convention) or `.` (1sat-stack convention)
const outpointRegex = /^[0-9a-fA-F]{64}(?:[_.]\d{1,6})?$/;

export const isValidOutpoint = (value: string | undefined | null): boolean =>
	!!value && outpointRegex.test(value);
