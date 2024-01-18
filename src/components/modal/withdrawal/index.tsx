"use client";

import { utxos } from "@/signals/wallet";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useCallback } from "react";
import { toBitcoin, toSatoshi } from "satoshi-bitcoin-ts";

interface DespotModalProps {
  onClose: () => void;
}

const WithdrawalModal: React.FC<DespotModalProps> = ({ onClose }) => {
  useSignals()
  // use signal for amount and address
  const amount = useSignal("0");
  const address = useSignal("");
  const balance = computed(() => {
    if (!utxos.value) {
      return 0;
    }
    return utxos.value.reduce((acc, utxo) => acc + utxo.satoshis, 0);
  });

  const submit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!amount.value || !address.value) {
      return;
    }
    if (toSatoshi(amount.value) > balance.value) {
      console.error("Not enough Bitcoin");
      return;
    }
    console.log(amount.value, address.value);
  }, [amount, address, balance]);

  const setAmountToBalance = useCallback(() => {
    amount.value = `${toBitcoin(balance.value)}`;
    console.log(amount.value);
  }, [amount, balance]);



  return (
    <div
      className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 overflow-hidden"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-lg m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-64 md:h-full overflow-hidden mb-4">
        <form onSubmit={submit}>
        <div className="flex justify-between">
          <div className="text-lg font-semibold">Withdrawal</div>
          <div
            className="text-xs cursor-pointer text-[#aaa]"
            onClick={setAmountToBalance}
          >
            Balance: {toBitcoin(balance.value)} BSV
          </div>
        </div>

        <div className="flex flex-col w-full">
          <label className="text-sm font-semibold text-[#aaa] mb-2">
            Amount
          </label>
          <input
            type="text"
            placeholder="0.00000000"
            className="input input-bordered w-full"
            value={amount.value || "0"}
            onChange={(e) => {
              amount.value = e.target.value;
            }}
          />
        </div>
        <div className="flex flex-col mt-4">
          <label className="text-sm font-semibold text-[#aaa] mb-2">
            Address
          </label>
          <input
            type="text"
            placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
            className="input input-bordered w-full"
            onChange={(e) => {
              address.value = e.target.value;
            }}
          />
        </div>
        <div className="modal-action">
          <button className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white">
            Send
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalModal;
