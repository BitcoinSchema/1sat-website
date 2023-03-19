import { P2PKHAddress, PrivateKey } from "bsv-wasm";
import { createOrdinal } from "js-1sat-ord";

// const mint = useCallback(() => {
//   const utxo = {};
//   const paymentPk = PrivateKey.from_wif(process.env.PAYMENT_WIF);
//   const changeAddress = P2PKHAddress.from_wif(process.env.PAYMENT_WIF);
//   const destinationAddress = P2PKHAddress.from_wif(process.env.ORDINAL_WIF);
//   createOrdinal(utxo, destinationAddress, paymentPk, changeAddress, {
//     dataB64: b64Image,
//     contentType: "image/png",
//   });
// }, []);

export default async function (req: any, res: any) {
  console.log(req.body);
  const {
    paymentPKInput,
    fileAsBase64,
    inputTxid,
    receiverAddress,
    changeAddress,
  } = req.body;
  if (
    paymentPKInput &&
    fileAsBase64 &&
    inputTxid &&
    receiverAddress &&
    changeAddress
  ) {
    const completion = await handleInscribing(
      paymentPKInput,
      fileAsBase64,
      inputTxid,
      receiverAddress,
      changeAddress
    );
    console.log("Completion Data", completion);
    res.status(200).json({ result: { completion } });
  }
}

const handleInscribing = async (
  paymentPKInput: string,
  fileAsBase64: string,
  inputTxid: string,
  receiverAddress: string,
  changeAddress: string
) => {
  const paymentPk = PrivateKey.from_wif(paymentPKInput);
  console.log({
    paymentPKInput,
    paymentPk,
    inputTxid,
    receiverAddress,
    changeAddress,
  });

  let p2Script = P2PKHAddress.from_string(changeAddress);
  console.log(p2Script.get_locking_script().to_asm_string());

  const utxo = {
    satoshis: 10000,
    txid: "42ca4a6de42e8b0746b4b8408ba2597d40554bb7d95f17e282b31472cdc13382",
    script:
      "OP_DUP OP_HASH160 de09f55f150d814e6600455ffa1dc26c6393c0f3 OP_EQUALVERIFY OP_CHECKSIG", //p2Script.get_locking_script().to_asm_string(),
    vout: 0,
  };

  // inscription
  const inscription = { dataB64: fileAsBase64, contentType: "image/jpeg" };
  console.log(inscription);
  // returns Promise<Transaction>
  const tx = await createOrdinal(
    utxo,
    receiverAddress,
    paymentPk,
    changeAddress,
    0.1,
    inscription
  );
  console.log(tx.to_hex());
  return tx.to_hex();
};
