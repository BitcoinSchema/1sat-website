import { PrivateKey } from "bsv-wasm";
import corsModule from "cors";
import * as functions from "firebase-functions";
import { createOrdinal } from "js-1sat-ord";

const allowedOrigins = ["http://localhost:80"];
const options = {
  origin: allowedOrigins,
};
const cors = corsModule(options);

type PendingInscription = {
  rawTx: string;
  size: number;
  fee: number;
  numInputs: number;
  numOutputs: number;
};

export const inscribe = functions.https.onRequest((req, res) => {
  cors(req, res, async (err) => {
    const {
      payPk,
      fileAsBase64,
      receiverAddress,
      fileContentType,
      changeAddress,
      fundingUtxo,
    } = req.body;
    console.log({
      payPk,
      fileAsBase64,
      fileContentType,
      receiverAddress,
      changeAddress,
      fundingUtxo,
    });
    if (
      payPk &&
      fileAsBase64 &&
      fileContentType &&
      receiverAddress &&
      changeAddress &&
      fundingUtxo
    ) {
      try {
        const tx = await handleInscribing(
          payPk,
          fileAsBase64,
          fileContentType,
          receiverAddress,
          changeAddress,
          fundingUtxo
        );
        const satsIn = fundingUtxo.satoshis;
        const satsOut = Number(tx.satoshis_out());
        if (satsIn && satsOut) {
          const fee = satsIn - satsOut;

          if (fee < 0) {
            res.type("application/json");
            res.status(402).send({ error: "Fee inadequate" });
            return;
          }
          const result = {
            rawTx: tx.to_hex(),
            size: tx.get_size(),
            fee,
            numInputs: tx.get_ninputs(),
            numOutputs: tx.get_noutputs(),
          } as PendingInscription;
          res.status(200).json({ result });
          return;
        }
      } catch (e) {
        console.error(e);
        res.status(500).send(e.toString());
        return;
      }
    }
    res.status(400).send("");
  });
});

const handleInscribing = async (
  payPk: string,
  fileAsBase64: string,
  fileContentType: string,
  receiverAddress: string,
  changeAddress: string,
  fundingUtxo: any
) => {
  const paymentPk = PrivateKey.from_wif(payPk);

  // inscription
  const inscription = {
    dataB64: fileAsBase64,
    contentType: fileContentType,
  };

  try {
    const tx = await createOrdinal(
      fundingUtxo,
      receiverAddress,
      paymentPk,
      changeAddress,
      0.1,
      inscription
    );
    return tx;
  } catch (e) {
    throw e;
  }
};
