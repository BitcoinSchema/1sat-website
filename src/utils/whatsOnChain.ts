export const getRawTxById = async (txid: string): Promise<string> => {
  const r = await fetch(
    `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
  );
  return await r.text();
};
