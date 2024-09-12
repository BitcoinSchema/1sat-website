export function getImageFromGP(imageTxId: string) {
  if (imageTxId.startsWith("bitfs://")) {
// bitfs://a53276421d2063a330ebbf003ab5b8d453d81781c6c8440e2df83368862082c5.out.1.1
    return `https://ordfs.network/${imageTxId.replace(
      "bitfs://",
      ""
    ).replace(".out.", "_").slice(0, -2)}`;
  }
	return `https://ordfs.network/${imageTxId.replace(
		"b://",
		""
	)}`;
}
