import { PrivateKey } from "bsv-wasm";

export default async (req: any, res: any) => {
  const payPk = PrivateKey.from_random().to_wif();
  const ordPk = PrivateKey.from_random().to_wif();

  return res.status(200).json({ payPk, ordPk });
};
