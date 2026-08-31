import { DualSidebarLayout } from "@/components/dual-sidebar-layout";
import { CWIRelayProvider } from "./cwi-relay-provider";

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<CWIRelayProvider />
			<DualSidebarLayout>{children}</DualSidebarLayout>
		</>
	);
}
