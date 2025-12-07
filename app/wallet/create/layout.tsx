import { CreateWalletProvider } from "./provider";

export default function CreateWalletLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <CreateWalletProvider>{children}</CreateWalletProvider>;
}
