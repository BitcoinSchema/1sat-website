import { knownAudioTypes, knownImageTypes, knownVideoTypes } from "@/constants";
import { generatedImage } from "@/signals/ai";
import type { FileEvent } from "@/types/file";
import { useCallback, useEffect, useState } from "react";

const useFileHandler = ({ generated }: { generated?: boolean }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);
  const [isImage, setIsImage] = useState<boolean>(false);

  useEffect(() => {
    // if an imageUrl is provided, load it and set the preview
    if (generated && generatedImage.value && !preview) {
      const decoded = Buffer.from(generatedImage.value.data, "base64");
      const arrayBuffer = decoded.buffer.slice(
        decoded.byteOffset,
        decoded.byteOffset + decoded.byteLength
      ) as ArrayBuffer;
      setIsImage(true);

      const file = new File([arrayBuffer], "image.png", { type: "image/png" });
      setSelectedFile(file);
      setPreview(`data:image/png;base64,${generatedImage.value.data}`);
    }
  }, [generated, generatedImage.value, preview, setIsImage]);

  const handleFileChange = useCallback((event: FileEvent) => {
    const file = event.target.files[0] as File;

    if (knownImageTypes.includes(file.type)) {
      setIsImage(true);
    } else if (knownVideoTypes.includes(file.type)) {
      setIsImage(false);
    } else if (knownAudioTypes.includes(file.type)) {
      setIsImage(false);
    } else {
      setIsImage(false);
    }

    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, []);

  return { selectedFile, setSelectedFile, preview, isImage, handleFileChange };
};

export default useFileHandler;