"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteWalletModal } from "@/components/wallet/delete-wallet-modal";

export default function DeleteWalletPage() {
	const router = useRouter();
	const [open, setOpen] = useState(true);

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (!isOpen) {
			router.back();
		}
	};

	return <DeleteWalletModal open={open} onOpenChange={handleOpenChange} />;
}
