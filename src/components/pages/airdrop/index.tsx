import Tabs, { Tab } from "@/components/tabs";
import { useWallet } from "@/context/wallet";
import { P2PKHAddress, Transaction, TxOut } from "bsv-wasm-web";
import { forEach } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { FiPlus } from "react-icons/fi";
import AirdropTabs, { AirdropTab } from "./tabs";

interface PageProps extends WithRouterProps {}

const AirdropPage: React.FC<PageProps> = ({}) => {
  const searchParams = useSearchParams();

  const tab = searchParams.get("tab");
  const { bsv20Balances } = useWallet();

  const [amt, setAmt] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState<string | undefined>();
  const [additionalAddresses, setAdditionalAddresses] = useState(
    [] as string[]
  );

  const currentTab = useMemo(() => {
    return tab as AirdropTab;
  }, [tab]);

  const changeAmt = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
    setAmt(parseInt(e.target.value));
  }, []);

  const clickAirdrop = useCallback(() => {
    console.log("clicked airdrop");

    const tx = new Transaction(1, 0);

    forEach(additionalAddresses, (address) => {
      const cut = Math.floor(amt / additionalAddresses.length);
      const a = P2PKHAddress.from_string(address);
      const script = a.get_locking_script();
      const txOut = new TxOut(BigInt(cut), script);
      tx.add_output(txOut);
    });
    console.log(tx.to_hex());
  }, [amt, additionalAddresses]);

  const changeTicker = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      console.log(e.target.value);
      setSelectedTicker(e.target.value);
    },
    []
  );

  const selectedBalance = useMemo(() => {
    return (
      bsv20Balances &&
      Object.entries(bsv20Balances).find(
        ([ticker, balance]) => ticker === selectedTicker
      )
    );
  }, [bsv20Balances, selectedTicker]);

  const addAddress = useCallback(() => {
    console.log("add address");
    setAdditionalAddresses([...additionalAddresses, ""]);
  }, [additionalAddresses]);

  return (
    <React.Fragment>
      <Tabs currentTab={Tab.Airdrop} />
      <div>
        <AirdropTabs currentTab={AirdropTab.BSV20} />

        <h1 className="text-4xl">Airdrop Tokens</h1>

        <div className="flex flex-col items-center justify-center">
          <select
            className="w-full p-2 text-xl rounded my-4"
            onChange={changeTicker}
          >
            {bsv20Balances &&
              Object.entries(bsv20Balances).map(([ticker, balance], idx) => (
                <React.Fragment key={`${ticker}-${idx}`}>
                  <option value={ticker}>{ticker}</option>;
                </React.Fragment>
              ))}
          </select>

          <input
            type="text"
            className="w-full p-2 text-xl rounded my-4 mx-4"
            onChange={changeAmt}
            placeholder={
              selectedBalance ? `Max: ${selectedBalance[1]}` : "Amount"
            }
          />
          <h1 className="self-start text-4xl">To</h1>

          {additionalAddresses.map((address, idx) => (
            <div
              className="w-full my-4 mx-4 relative"
              key={`${address}-${idx}`}
            >
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
            disabled={amt === 0 || !selectedTicker}
            className="disabled:bg-[#222] disabled:text-[#333] bg-yellow-400 hover:bg-yellow-500 transition text-black  font-semibold w-full p-2 text-xl rounded my-4"
            onClick={clickAirdrop}
          >
            Airdrop{" "}
            {amt && additionalAddresses.length > 0
              ? `${amt / additionalAddresses.length} each`
              : ""}{" "}
            {selectedTicker}
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

export default AirdropPage;
