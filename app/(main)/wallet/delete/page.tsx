"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteWalletModal } from "@/components/wallet/delete-wallet-modal";
import { LocalWalletOnly } from "@/components/wallet/local-wallet-only";

export default function DeleteWalletPage() {
	const router = useRouter();
	const [open, setOpen] = useState(true);

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (!isOpen) {
			router.replace("/wallet");
		}
	};

	return (
		<LocalWalletOnly>
			<DeleteWalletModal open={open} onOpenChange={handleOpenChange} />
		</LocalWalletOnly>
	);
}
