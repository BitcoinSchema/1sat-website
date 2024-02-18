import CreateWalletPage from "@/components/pages/createWallet";
import { randomKeys } from "@/utils/keys";

const WalletPage = async () => {
  const { payPk, ordPk } = await randomKeys();

  return (
    <CreateWalletPage payPk={payPk} ordPk={ordPk} />
  );
};

export default WalletPage;
