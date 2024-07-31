export function getImageFromGP(imageTxId: string) {
	return `https://ordinals.gorillapool.io/content/${imageTxId.replace(
		"b://",
		""
	)}`;
}
