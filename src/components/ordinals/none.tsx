"use client";

import { useSignals } from "@preact/signals-react/runtime";
import { selectedType } from "../Wallet/filter";
import { ArtifactType } from "../artifact";

const None = () => {
	useSignals();
	const typeName: string | null = selectedType.value
		? selectedType.value
		: null;
	return (
		<div className="w-full grid mb-4">
			No{" "}
			{selectedType.value && selectedType.value !== ArtifactType.All
				? `${typeName} `
				: ""}
			ordinals
		</div>
	);
};

export default None;
