import type { PrivateKey } from "@bsv/sdk";
import { fetchPayUtxos, oneSatBroadcaster, type Payment, sendUtxos, type SendUtxosConfig } from "js-1sat-ord";

export const sweepUtxos = async (paymentPk: PrivateKey, fromAddress: string, toAddress: string) => {
  const utxos = await fetchPayUtxos(fromAddress);
  if (!utxos.length) {
    throw new Error('No utxos to sweep');
  }
  const amount = utxos.map(utxo => utxo.satoshis).reduce((a, b) => a + b, 0) - 1;
  const payments: Payment[] = [{
    to: toAddress,
    amount
  }]
  const config: SendUtxosConfig = {
    utxos,
    paymentPk,
    payments,
  }
  const { tx } = await sendUtxos(config)
  const { txid } = await tx.broadcast(oneSatBroadcaster());

  console.log('Change sweep:', txid);
  return amount;
};