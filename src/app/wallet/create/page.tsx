import CreateWalletPage from "@/components/pages/createWallet";
import { randomKeys } from "@/utils/keys";

const WalletPage = async () => {
  // document.getElementById('delete_wallet_modal').showModal()
  const { payPk, ordPk } = await randomKeys();

  return (
    <CreateWalletPage payPk={payPk} ordPk={ordPk} />
  );
};

export default WalletPage;
