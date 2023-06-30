import { PendingTransaction } from "@/context/wallet";
import React from "react";

interface InscribeCollectionProps {
  inscribedCallback: (pendingTx: PendingTransaction) => void;
}

const InscribeCollection: React.FC<InscribeCollectionProps> = ({}) => {
  return <div className="max-w-lg mx-auto"></div>;
};

export default InscribeCollection;
