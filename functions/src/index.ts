import { PrivateKey, Script } from "bsv-wasm";
import corsModule from "cors";
import * as functions from "firebase-functions";
import { createOrdinal } from "js-1sat-ord";
import { StandardToExtended } from './bitcoin-ef/standard-to-extended';
import { ArcClient } from './js-arc-client';

const allowedOrigins = ["http://localhost:80"];
const options = {
  origin: allowedOrigins,
};
const cors = corsModule(options);

const ARC = 'https://arc.gorillapool.io';
const arcClient = new ArcClient(ARC, {});

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
      const satsIn = tx.satoshis_in();
      const satsOut = tx.satoshis_out();
      if (satsIn && satsOut) {
        const fee = -tx.satoshis_out();

        const result = {
          rawTx: tx.get_size(),
          fee,
          numInputs: tx.get_ninputs(),
          numOutputs: tx.get_noutputs(),
        };
        res.status(200).json({ result });
      }
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
  return tx;
};

interface PreviousOutput {
  lockingScript: string;
  script: string
  satoshis: number;
}
export const broadcast = functions.https.onRequest(async (req, res) => {
  cors(req, res, async (err) => {
    let parents: PreviousOutput[] = req.body.parents;
    let rawtx: string = req.body.rawtx;
    parents.forEach((s) => {
      s.lockingScript = Script.from_asm_string(s.script).to_hex()
    })
    const ef = StandardToExtended(rawtx, parents);
    const result = await arcClient.postTransaction(ef);
    res.status(200).json({ result });
  });
});
