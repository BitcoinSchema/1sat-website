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
    const tx = await handleInscribing(
      payPk,
      fileAsBase64,
      receiverAddress,
      changeAddress,
      fundingUtxo
    );

    const satsIn = fundingUtxo.satoshis;
    const satsOut = Number(tx.satoshis_out());
    if (satsIn && satsOut) {
      const fee = satsIn - satsOut;

      const result = {
        rawTx: tx.to_hex(),
        size: tx.get_size(),
        fee,
        numInputs: tx.get_ninputs(),
        numOutputs: tx.get_noutputs(),
      };
      res.status(200).json({ result });
    } else {
      console.log({ satsIn, satsOut });
      res.status(400).send();
    }
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
  const inscription = {
    dataB64: fileAsBase64,
    contentType: "image/jpeg",
    outPoint: `${fundingUtxo.txid}_${fundingUtxo.vout}`,
  };

  // returns Promise<Transaction>
  const tx = await createOrdinal(
    fundingUtxo,
    receiverAddress,
    paymentPk,
    changeAddress,
    0.1,
    inscription
  );
  return tx;
};
