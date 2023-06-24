import Tabs, { Tab } from "@/components/tabs";
import { useWallet } from "@/context/wallet";
import { Transaction } from "bsv-wasm-web";
import { WithRouterProps } from "next/dist/client/with-router";
import React, { useCallback, useState } from "react";
import { FiCompass, FiPlus } from "react-icons/fi";
import AirdropTabs, { AirdropTab } from "./tabs";

interface PageProps extends WithRouterProps {}

const AirdropOrdinalsPage: React.FC<PageProps> = ({}) => {
  const { bsv20Balances } = useWallet();
  const [outpoint, setOutpoint] = useState<string | undefined>();
  const [selectedTicker, setSelectedTicker] = useState<string | undefined>();
  const [additionalAddresses, setAdditionalAddresses] = useState(
    [] as string[]
  );

  const clickAirdrop = useCallback(() => {
    console.log("clicked airdrop");

    const tx = new Transaction(1, 0);

    // forEach(additionalAddresses, (address) => {
    //   const cut = Math.floor(amt / additionalAddresses.length);
    //   const a = P2PKHAddress.from_string(address);
    //   const script = a.get_locking_script();
    //   const txOut = new TxOut(BigInt(cut), script);
    //   tx.add_output(txOut);
    // });
    console.log(tx.to_hex());
  }, []);

  const addAddress = useCallback(() => {
    console.log("add address");
    setAdditionalAddresses([...additionalAddresses, ""]);
  }, [additionalAddresses]);

  return (
    <div className="p-8">
      <Tabs currentTab={Tab.Airdrop} />

      <AirdropTabs currentTab={AirdropTab.Ordinals} />

      <h1 className="text-4xl">Airdrop Ordinals</h1>

      <div className="flex flex-col items-center justify-center">
        {!outpoint && (
          <div
            // onClick={clickSelectItem}
            className="text-blue-400 hover:text-blue-500 transition font-semibold cursor-pointer p-2 flex items-center justify-center"
          >
            <FiCompass className="mr-2" /> Select an Item
          </div>
        )}

        <h1 className="self-start text-4xl">To</h1>

        {additionalAddresses.map((address, idx) => (
          <div className="w-full my-4 mx-4 relative" key={`address-${idx}`}>
            <input
              type="text"
              className="w-full p-2 text-xl rounded "
              placeholder="Address"
            />
          </div>
        ))}
        <div className="w-full my-4 mx-4 relative">
          <input
            type="text"
            className="w-full p-2 text-xl rounded "
            placeholder="Address"
          />
          <button onClick={addAddress}>
            <FiPlus className="cursor-pointer absolute right-0 bottom-0 text-3xl font-semibold text-gray-400 hover:text-gray-500 transition mb-2 mr-2" />
          </button>
        </div>
        <button
          // disabled={amt === 0 || !selectedTicker}
          className="disabled:bg-[#222] disabled:text-[#333] bg-yellow-400 hover:bg-yellow-500 transition text-black  font-semibold w-full p-2 text-xl rounded my-4"
          onClick={clickAirdrop}
        >
          Airdrop{" "}
          {/* {amt && additionalAddresses.length > 0
            ? `${amt / additionalAddresses.length} each`
            : ""}{" "} */}
          {selectedTicker}
        </button>
      </div>
    </div>
  );
};

export default AirdropOrdinalsPage;
