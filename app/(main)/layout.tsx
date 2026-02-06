import { DualSidebarLayout } from "@/components/dual-sidebar-layout";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { CWIRelayProvider } from "./cwi-relay-provider";

export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<KeyboardShortcuts />
			<CWIRelayProvider />
			<DualSidebarLayout>{children}</DualSidebarLayout>
		</>
	);
}
