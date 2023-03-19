import { PrivateKey } from "bsv-wasm";
import { createOrdinal, Utxo } from "js-1sat-ord";

export default async (req: any, res: any) => {
  const { payPk, fileAsBase64, receiverAddress, changeAddress, fundingUtxo } =
    req.body;
  if (
    payPk &&
    fileAsBase64 &&
    receiverAddress &&
    changeAddress &&
    fundingUtxo
  ) {
    const result = await handleInscribing(
      payPk,
      fileAsBase64,
      receiverAddress,
      changeAddress,
      fundingUtxo
    );
    res.status(200).json({ result });
  }
};

const handleInscribing = async (
  payPk: string,
  fileAsBase64: string,
  receiverAddress: string,
  changeAddress: string,
  fundingUtxo: Utxo
) => {
  const paymentPk = PrivateKey.from_wif(payPk);

  // inscription
  const inscription = { dataB64: fileAsBase64, contentType: "image/jpeg" };

  // returns Promise<Transaction>
  const tx = await createOrdinal(
    fundingUtxo,
    receiverAddress,
    paymentPk,
    changeAddress,
    0.1,
    inscription
  );
  return tx.to_hex();
};
