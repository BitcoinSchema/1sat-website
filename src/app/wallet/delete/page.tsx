import DeleteWalletPage from "@/components/pages/deleteWallet";

const WalletPage = () => {
	// document.getElementById('delete_wallet_modal').showModal()
	return <DeleteWalletPage />;
};

export default WalletPage;

export async function generateMetadata() {
	return {
		title: "Logout - 1SatOrdinals",
		description: "Logout from your account on 1SatOrdinals.",
		openGraph: {
			title: "Logout - 1SatOrdinals",
			description: "Logout from your account on 1SatOrdinals.",
			type: "website",
		},
		twitter: {
			card: "summary",
			title: "Logout - 1SatOrdinals",
			description: "Logout from your account on 1SatOrdinals.",
		},
	};
}
