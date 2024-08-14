import Artifact from "@/components/artifact";
import type { TxoData } from "@/types/ordinals";

interface FilePreviewProps {
  selectedFile: File | null;
  preview: string | ArrayBuffer | null;
  isImage: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({ selectedFile, preview, isImage }) => {
  return (
    <div>
      {isImage ? (
        selectedFile?.type &&
        typeof preview === "string" && (
          <Artifact
            classNames={{ media: "w-full h-full" }}
            artifact={{
              data: {
                insc: {
                  file: {
                    type: selectedFile.type,
                    size: selectedFile.size,
                  },
                },
              } as TxoData,
              script: "",
              outpoint: "",
              txid: "",
              vout: 0,
            }}
            size={300}
            src={preview as string}
            sizes={""}
            latest={true}
          />
        )
      ) : (
        <div className="w-full h-full bg-[#111] rounded flex items-center justify-center">FILE</div>
      )}
    </div>
  );
};

export default FilePreview;