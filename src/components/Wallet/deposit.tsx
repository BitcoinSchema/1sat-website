"use client";
import { fundingAddress } from "@/signals/wallet/address";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { FaCopy } from "react-icons/fa";
import { useCopyToClipboard } from "usehooks-ts";

const Deposit = () => {
	const [text, copy] = useCopyToClipboard();
	return (
		<div className="">
			<h1 className="font-semibold text-lg mb-4">Deposit Bitcoin SV</h1>

			<div className="text-warning rounded p-2 mx-auto mb-4 border-warning border">
				This is not an Ordinals address. Send BSV only.
			</div>
			<div className="hover:text-neutral-content w-fit bg-neutral text-neutral-content/50 rounded p-2 mx-auto my-4 transition">
				<button
					type="button"
					className={"flex items-center justify-between w-full"}
					onClick={() => {
						copy(fundingAddress.value || "");
						toast.success("Copied Funding Address");
						// showDropdown.value = false;
					}}
				>
					{fundingAddress.value}
					<FaCopy className="ml-2" />
				</button>
			</div>
			<QRCodeSVG
				value={fundingAddress.value || ""}
				className="w-full  h-full mx-auto"
				includeMargin={true}
			/>
		</div>
	);
};

export default Deposit;
