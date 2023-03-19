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
      const result = await handleInscribing(
        payPk,
        fileAsBase64,
        receiverAddress,
        changeAddress,
        fundingUtxo
      );
      res.status(200).json({ result });
    }
  });

  // req, res, async () => {

  // });
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
  return tx.to_hex();
};
