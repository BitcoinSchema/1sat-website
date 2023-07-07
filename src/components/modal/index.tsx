import React, { ReactNode, useEffect } from "react";

type ModalProps = {
  children: ReactNode;
  onClose?: () => void;
};

const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
  useEffect(() => {
    if (onClose) {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.keyCode === 27) {
          onClose();
        }
      };
      window.addEventListener("keydown", handleEsc);

      return () => {
        window.removeEventListener("keydown", handleEsc);
      };
    }
  }, [onClose]);

  return (
    <div
      className="left-0 top-0 overflow-auto w-full h-full absolute flex items-center justify-center bg-[#555]/30 backdrop-blur"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        const target = (e.target as HTMLDivElement)?.id;
        if (target === "backdrop" && onClose) {
          onClose();
        }
      }}
      id="backdrop"
    >
      {children}
    </div>
  );
};

export default Modal;
