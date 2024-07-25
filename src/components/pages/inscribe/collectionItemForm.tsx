"use client"

import type { OrdUtxo } from "@/types/ordinals";
// CollectionForm.tsx
import { FaQuestionCircle } from "react-icons/fa";
import type { MetaMap } from "./image";
import { useRouter } from "next/navigation";

interface CollectionFormProps {
  userCollections?: OrdUtxo[];
  selectedCollection: string | undefined;
  setSelectedCollection: (collection: string) => void;
  collectionEnabled: boolean;
  setCollectionEnabled: (enabled: boolean) => void;
  setMetadata: (metadata: MetaMap[]) => void;
  selectedFile: File | null;
}

const CollectionItemForm: React.FC<CollectionFormProps> = ({
  userCollections,
  selectedCollection,
  setSelectedCollection,
  collectionEnabled,
  setCollectionEnabled,
  setMetadata,
  selectedFile,
}) => {

  const router = useRouter();

  return (
    <div className="my-4">
      {/* // toggle between minting a collection item or inscribing an image */}
      <div className="form-control mb-4">
        <label className="label cursor-pointer">
          <div className="label-text flex items-center">
            {collectionEnabled ? (
              <div>
                <span className="text-[#555] mr-2">Single Inscription</span>
                <span className="text-warning-200/50">Collection Item</span>
              </div>
            ) : (
              <div>
                <span className="text-yellow-200/50 mr-2">Single Inscription</span>
                <span className="text-[#555]">Collection Item</span>
              </div>
            )}
            <div className="tooltip" data-tip="A collection must be created before adding collection items.">
              <FaQuestionCircle className="w-8" />
            </div>
          </div>
          <input
            type="checkbox"
            className="toggle"
            checked={collectionEnabled}
            onChange={(e) => setCollectionEnabled(e.target.checked)}
          />
        </label>
      </div>

      {collectionEnabled && (
        <>
          <label htmlFor="collectionSelect" className="font-medium flex justify-between mb-2">
            Parent Collection <span className="text-[#555]">optional</span>
          </label>
          <select
            id="collectionSelect"
            className="select select-bordered w-full"
            value={selectedCollection}
            onChange={(e) => {
              // set collection id on metadata
              const collectionId = e.target.value;
              if (collectionId === "new-collection") {
                // redirect to collection form
                router.push("/inscribe?tab=collection");
                return;
              }
              const collection = userCollections?.find((c) => c.outpoint === collectionId);
              if (collection) {
                // use "mapData" to populate initial metadata
                setMetadata([
                  { key: "app", value: "1sat.market", idx: 0 },
                  { key: "type", value: "ord", idx: 1 },
                  { key: "name", value: selectedFile?.name || "", idx: 2 },
                  { key: "collectionId", value: collectionId, idx: 3 },
                  { key: "subType", value: "collectionItem", idx: 4 },
                  {
                    key: "subTypeData",
                    value: JSON.stringify({
                      rank: "",
                      mintNumber: "",
                      rarityLabel: "",
                    }),
                    idx: 5,
                  },
                ]);
              }
              setSelectedCollection(e.target.value);
            }}
          >
            <option value="">Choose a Collection</option>
            <option value="new-collection">New Collection</option>
            {userCollections?.map((collection) => (
              <option key={collection.outpoint} value={collection.outpoint}>
                {collection.data?.map?.name || "Unnamed Collection"}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
};

export default CollectionItemForm