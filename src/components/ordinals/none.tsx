"use client"

import { useSignals } from "@preact/signals-react/runtime";
import { selectedType } from "../Wallet/filter";
import { ArtifactType } from "../artifact";

const None = () => {
  useSignals();
  const typeName: string | null = selectedType.value ? Object.values(ArtifactType)[selectedType.value] : null;
  return <div className="grid mb-4">You have no {selectedType.value ? `${typeName} ` : ''}ordinals</div>

}

export default None;