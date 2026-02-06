/**
 * XDM (Cross-Document Messaging) types matching @bsv/sdk's XDMSubstrate protocol.
 *
 * Request:  dApp → iframe (isInvocation: true)
 * Response: iframe → dApp (isInvocation: false)
 */

export interface CWIRequest {
	type: "CWI";
	isInvocation: true;
	id: string;
	call: string;
	args: unknown;
}

export interface CWIResponse {
	type: "CWI";
	isInvocation: false;
	id: string;
	result?: unknown;
	status?: "error";
	description?: string;
	code?: number;
}
