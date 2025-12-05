export function fromHexString(hexString: string): Uint8Array {
  const matches = hexString.match(/.{1,2}/g);
  return new Uint8Array(
    matches ? matches.map((byte) => parseInt(byte, 16)) : []
  );
}

export function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
