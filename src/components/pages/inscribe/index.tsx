"use client";

import { useSignals } from "@preact/signals-react/runtime";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import Inscribe from "@/components/pages/inscribe/inscribe";
import { payPk, utxos } from "@/signals/wallet";
import type { InscriptionTab } from "./tabs";

const InscribePage: React.FC = () => {
	useSignals();
	const params = useSearchParams();
	const router = useRouter();
	const tab = params.get("tab") as InscriptionTab;
	const generated = params.get("generated") === "true";
	return (
		<>
			{payPk.value && utxos.value && (
				<Inscribe tab={tab} generated={generated} />
			)}
			<div className="p-2 md:p-4">
				{(!payPk.value || !utxos.value) && (
					<div
						className="rounded bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-4 md:p-8"
						onClick={() => router.push("./wallet")}
					>
						You need funds to inscribe. Check your wallet.
					</div>
				)}
			</div>
		</>
	);
};

export default InscribePage;
