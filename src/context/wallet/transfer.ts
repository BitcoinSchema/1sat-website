import { P2PKHAddress, PrivateKey } from "bsv-wasm-web";
import { Utxo, sendOrdinal } from "js-1sat-ord";

export const handleTransferring = async (
  payPk: string,
  ordPk: string,
  address: string,
  fundingUtxo: Utxo,
  ordinalUtxo: Utxo,
  satsPerByteFee: number
) => {
  const paymentPk = PrivateKey.from_wif(payPk);
  const ordinalPk = PrivateKey.from_wif(ordPk);
  const changeAddress = P2PKHAddress.from_pubkey(
    paymentPk.to_public_key()
  ).to_string();
  try {
    const tx = await sendOrdinal(
      fundingUtxo,
      ordinalUtxo,
      paymentPk,
      changeAddress,
      satsPerByteFee,
      ordinalPk,
      address
    );
    return tx;
  } catch (e) {
    throw e;
  }
};
