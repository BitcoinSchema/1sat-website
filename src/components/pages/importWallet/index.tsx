// // src/components/pages/importWallet/index.tsx

// "use client";

// import ImportWalletModal from "@/components/modal/importWallet";
// import { useSignal } from "@preact/signals-react";
// import { useRouter } from "next/navigation";
// import { useCallback, useEffect, useRef } from "react";
// import type { Keys } from "@/types/wallet";

// const ImportWalletPage = () => {
// 	const router = useRouter();
// 	const open = useSignal(true);
// 	const importData = useSignal<Keys | null>(null);
// 	const modalRef = useRef<{ handleImportData: (data: Keys) => void } | null>(
// 		null,
// 	);

// 	const close = useCallback(
// 		(signedOut = false) => {
// 			open.value = false;
// 			router.push("/");
// 		},
// 		[open, router],
// 	);

// 	const handleMessage = useCallback((event: MessageEvent) => {
// 		if (event.origin !== "https://1satordinals.com") return;

// 		if (event.data.type === "MIGRATE_KEYS") {
// 			console.log("MIGRATE OUTER")
// 			const keys = event.data.payload as Keys;
// 			importData.value = keys;
// 			// Immediately trigger the import process
// 			if (modalRef.current) {
// 				modalRef.current.handleImportData(keys);
// 			}
// 		}
// 	}, [importData]);

// 	useEffect(() => {
// 		window.addEventListener("message", handleMessage);
// 		return () => {
// 			window.removeEventListener("message", handleMessage);
// 		};
// 	}, [handleMessage]);

// 	return (
// 		<ImportWalletModal
// 			open={open.value}
// 			onClose={close}
// 			importData={importData.value}
// 			ref={modalRef}
// 		/>
// 	);
// };

// export default ImportWalletPage;

"use client";

import ImportWalletModal from "@/components/modal/importWallet";
import { useSignal } from "@preact/signals-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { Keys } from "@/types/wallet";
import { migrating } from "@/signals/wallet";

const ImportWalletPage = () => {
  const router = useRouter();
  const open = useSignal(true);
  const importData = useSignal<Keys | null>(null);
  const modalRef = useRef<{ handleImportData: (data: Keys) => void } | null>(
    null,
  );

  const close = useCallback(
    (signedOut = false) => {
			if (importData.value && signedOut) {
				// send post message
				console.log("ALREADY LOGGED IN sending postmessage")
				window.opener?.postMessage(
					{ type: "ALREADY_LOGGED_IN" },
					"https://1satordinals.com",
				);
			}
      open.value = false;
      router.push("/");
    },
    [importData.value, open, router],
  );

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== "https://1satordinals.com") return;
    if (event.data.type === "CHECK_READY") {
			migrating.value = true;
      // Respond that we're ready to receive the keys
      event.source?.postMessage({ type: "READY" }, { targetOrigin: event.origin });
    } else if (event.data.type === "MIGRATE_KEYS") {
      const keys = event.data.payload as Keys;
      importData.value = keys;
      // Immediately trigger the import process
      if (modalRef.current) {
        modalRef.current.handleImportData(keys);
      }
    }
  }, [importData]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage]);

  return (
    <ImportWalletModal
      open={open.value}
      onClose={close}
      importData={importData.value}
      ref={modalRef}
    />
  );
};

export default ImportWalletPage;