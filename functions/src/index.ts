import { PrivateKey } from "bsv-wasm";
import corsModule from "cors";
import * as functions from "firebase-functions";
import { createOrdinal } from "js-1sat-ord";

const allowedOrigins = ["http://localhost:80"];
const options = {
  origin: allowedOrigins,
};
const cors = corsModule(options);

export const inscribe = functions.https.onRequest((req, res) => {
  cors(req, res, async (err) => {
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
        return;
      }
    }
    res.status(400).send();
  });
});

const handleInscribing = async (
  payPk: string,
  fileAsBase64: string,
  receiverAddress: string,
  changeAddress: string,
  fundingUtxo: any
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
  return tx;
};
