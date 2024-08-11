// metaForm.tsx

import { FaPlus, FaQuestionCircle } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { removeBtnClass } from "./collection";
import type { MetaMap } from "./image";

interface MetaFormProps {
  metadata: MetaMap[] | undefined;
  setMetadata: (metadata: MetaMap[]) => void;
  selectedCollection: string | undefined;
  selectedFile: File | null;
}

const MetaForm: React.FC<MetaFormProps> = ({ metadata, setMetadata, selectedCollection, selectedFile }) => {
  const removeMetaRow = (idx: number) => {
    setMetadata((metadata || []).filter((m) => m.idx !== idx));
  };

  const metaRow = (meta: MetaMap) => {
    return (
      <div className="flex flex-row w-full items-center" key={`metarow-${meta.idx}`}>
        <input
          type="text"
          disabled={
            meta.idx === 0 ||
            meta.key === "type" ||
            (!!selectedCollection &&
              (meta.key === "collectionId" || meta.key === "subType" || meta.key === "subTypeData" || meta.key === "app" || meta.key === "name"))
          }
          placeholder={
            [
              "ex. name",
              "ex. geohash",
              "ex. context",
              "ex. subcontext",
              "ex. collectionId",
              "ex. mintNumber",
              "ex. rank",
              "ex. rarityLabel",
              "ex. url",
              "ex. tx",
              "ex. platform",
            ][meta.idx] || "Key"
          }
          className="w-1/2 p-2 mr-1 my-1 rounded disabled:bg-[#010101] disabled:text-[#555]"
          value={meta.key}
          onChange={(e) => {
            // update metadata MetaMap
            // where meta.idx === idx
            e.preventDefault();
            setMetadata(
              (metadata || []).map((m) => {
                if (m.idx === meta.idx) {
                  return {
                    ...m,
                    // exclude whitespace, special characters, or any invalid key characters
                    key: e.target.value.replaceAll(/[^a-zA-Z0-9]/g, ""),
                  };
                }
                return m;
              })
            );
          }}
        />
        <input
          type="text"
          placeholder="Value"
          disabled={
            !!selectedCollection &&
            (meta.key === "collectionId" || meta.key === "subType" || meta.key === "subTypeData" || meta.key === "app" || meta.key === "type")
          }
          className="w-1/2 p-2 ml-1 my-1 rounded disabled:bg-[#010101] disabled:text-[#555]"
          value={meta.value}
          onChange={(e) => {
            // update metadata MetaMap
            // where meta.idx === idx
            e.preventDefault();
            setMetadata(
              (metadata || []).map((m) => {
                if (m.idx === meta.idx) {
                  return {
                    ...m,
                    value: e.target.value,
                  };
                }
                return m;
              })
            );
          }}
        />
        {meta.idx > 2 && meta.key !== "subTypeData" && meta.key !== "subType" && meta.key !== "collectionId" &&  (
          <button type="button" className={removeBtnClass} onClick={() => removeMetaRow(meta.idx)}>
            <IoMdClose />
          </button>
        )}
      </div>
    );
  };

  const metaHead = (
    <div className="flex items-center justify-between">
      <div>{!selectedCollection ? "Add Metadata (optional)" : "Metadata"}</div>
      <div>
        <button
          type="button"
          className="bg-yellow-600 hover:bg-yellow-700 transition text-white p-1 rounded ml-2"
          onClick={() => {
            const initialKeys = [
              { key: "app", value: "1sat.market", idx: 0 },
              { key: "type", value: "ord", idx: 1 },
              { key: "name", value: selectedFile?.name || "", idx: 2 },
            ];
            const data = (metadata || []).concat(initialKeys);
            setMetadata(
              data.concat([
                {
                  key: "",
                  value: "",
                  idx: data.length,
                },
              ])
            );
          }}
        >
          <FaPlus />
        </button>
      </div>
    </div>
  );

  return (
    <div className="my-4">
      {metaHead}
      <div className="flex items-center justify-between text-[#555] text-smfont-semibold">
        <div className="w-1/2 flex items-center p-2">
          <div className="mr-2">key</div>
          <div className="tooltip" data-tip="Helps indexers identify tagged transactions including collection membership.">
            <FaQuestionCircle />
          </div>
        </div>
        <div className="w-1/2 p-2">value</div>
      </div>
      {metadata?.map((m) => metaRow(m))}
    </div>
  );
};

export default MetaForm;