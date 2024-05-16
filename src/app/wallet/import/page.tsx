import ImportWalletPage from "@/components/pages/importWallet";

const WalletPage = async () => {
  return <ImportWalletPage />;
};

export default WalletPage;

export async function generateMetadata() {
  return {
    title: "Import Wallet - 1SatOrdinals",
    description: "Create your own wallet on 1SatOrdinals.",
    openGraph: {
      title: "Import Wallet - 1SatOrdinals",
      description: "Import your own wallet on 1SatOrdinals.",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Import Wallet - 1SatOrdinals",
      description: "Import your own wallet on 1SatOrdinals.",
    },
  };
}
