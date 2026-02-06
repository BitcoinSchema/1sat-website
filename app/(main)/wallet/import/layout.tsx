import { ImportWalletProvider } from "./provider";

export default function ImportLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ImportWalletProvider>{children}</ImportWalletProvider>;
}
