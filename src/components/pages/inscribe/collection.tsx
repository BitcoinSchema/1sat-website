"use client"

import { useSignals } from "@preact/signals-react/runtime";
import React from "react";

interface InscribeCollectionProps {
  inscribedCallback: () => void;
}

const InscribeCollection: React.FC<InscribeCollectionProps> = ({ inscribedCallback}) => {
  useSignals();
  return <div className="max-w-lg mx-auto" />;
};

export default InscribeCollection;
