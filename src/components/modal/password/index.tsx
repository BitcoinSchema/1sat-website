import { useStorage } from "@/context/storage";
import { useWallet } from "@/context/wallet";
import { EncryptDecrypt } from "@/context/wallet/types";
import { generatePassphrase } from "@/utils/passphrase";
import { useCallback } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { RiErrorWarningFill } from "react-icons/ri";
import { TbDice } from "react-icons/tb";
import Modal from "../.";
import { toastErrorProps, toastProps } from "../../pages";
import * as S from "../../pages/styles";

type Props = {
  mode: EncryptDecrypt;
  onClose: () => void;
};

const PasswordModal: React.FC<Props> = ({ mode, onClose }) => {
  const {
    passphrase,
    setPassphrase,
    setShowEnterPassphrase,
    showEnterPassphrase,
    encryptedBackup,
  } = useWallet();
  const { setEncryptionKeyFromPassphrase } = useStorage();

  const handlePassphraseChange = useCallback(
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      setPassphrase(e.target.value);
    },
    [setPassphrase]
  );

  const handleClickGenerate = useCallback(() => {
    const phrase = generatePassphrase(1);
    setPassphrase(phrase);
  }, [setPassphrase]);

  const handleClickEncrypt = useCallback(async () => {
    if (passphrase) {
      console.log("encrypt keys with passphrase");
      try {
        await setEncryptionKeyFromPassphrase(passphrase);
      } catch (e) {
        console.error(e);
        toast.error("Failed to encrypt keys", toastErrorProps);
      }
    }
  }, [passphrase, setEncryptionKeyFromPassphrase]);

  const handleClickDecrypt = useCallback(async () => {
    if (passphrase) {
      console.log("decrypt keys w passphrase");

      try {
        await setEncryptionKeyFromPassphrase(
          passphrase,
          encryptedBackup?.pubKey
        );
        // setShowEnterPassphrase(false);
      } catch (e) {
        console.error(e);
        toast.error("Failed to decrypt keys", toastErrorProps);
      }
    }
    encryptedBackup;
  }, [
    setShowEnterPassphrase,
    passphrase,
    setEncryptionKeyFromPassphrase,
    encryptedBackup,
  ]);

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col text-center justify-between text-[#aaa] bg-black max-w-2xl p-4 md:p-8 rounded-lg">
        <h1 className="text-2xl">Enter a password</h1>
        <div className="my-4">
          {showEnterPassphrase === EncryptDecrypt.Decrypt
            ? "Decrypt"
            : "Encrypt"}{" "}
          your saved keys.
        </div>
        <div className="font-semibold md:text-xl my-2 relative">
          <div className="absolute right-0 h-full flex items-center justify-center mr-2 cursor-pointer">
            <CopyToClipboard
              text={passphrase || ""}
              onCopy={() => {
                toast.success("Copied phrase. Careful now!", toastProps);
              }}
            >
              <button
                disabled={!passphrase}
                className="disabled:text-[#555] transition text-black font-semibold font-mono"
              >
                <FiCopy />
              </button>
            </CopyToClipboard>
          </div>
          <S.Input
            type="password"
            onChange={handlePassphraseChange}
            value={passphrase}
            className="w-full placeholder-[#555]"
            placeholder={"your-password-here"}
          />
        </div>
        {showEnterPassphrase === EncryptDecrypt.Encrypt && (
          <div>
            <div className="flex items-center">
              <div
                onClick={handleClickGenerate}
                className="flex items-center cursor-pointer p-2 group text-blue-400 hover:text-blue-500"
              >
                <TbDice className="mr-2 group-hover:animate-spin" /> Generate a
                strong passphrase
              </div>
            </div>
          </div>
        )}
        <div className="text-gray-500 text-xs sm:test-sm md:text-base flex justify-center items-center my-4 ">
          <RiErrorWarningFill className="mr-2" />
          {showEnterPassphrase === EncryptDecrypt.Encrypt
            ? "You still need to keep your 12 word seed  phrase."
            : "Your password unlocks your wallet each time you visit"}
        </div>

        <button
          disabled={(passphrase?.length || 0) < 6}
          className="rounded p-2 bg-yellow-500 hover:bg-yellow-600 transition text-black font-semibold font-mono"
          onClick={
            showEnterPassphrase === EncryptDecrypt.Decrypt
              ? handleClickDecrypt
              : handleClickEncrypt
          }
        >
          {showEnterPassphrase === EncryptDecrypt.Decrypt
            ? "Unlock Wallet"
            : "Encrypt & Continue"}
        </button>
      </div>
    </Modal>
  );
};
export default PasswordModal;
