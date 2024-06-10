import { OrdUtxo } from "@/types/ordinals";
import Link from "next/link";
import { toBitcoin } from "satoshi-bitcoin-ts";

const FlowGrid = ({ artifacts, className }: { artifacts: OrdUtxo[], className: string }) => {
    return <div className={`relative text-center ${className}`}>
        {/* <div className='fixed z-10 bottom-0 left-0 mb-8 w-full h-24'>
      <div className='relative bg-[#111] h-full w-[30rem] max-w-[90vw] mx-auto flex flex-col items-start rounded-lg'>
          <span className="px-4 py-2 text-sm italic">Prompt</span>
          <input
              type='text'
              placeholder='Describe the image you want to generate'
              className='w-full px-4 py-2 text-lg text-white text-sm rounded-md focus:outline-none focus:ring-0 focus:border-none'
          />
          <div className='absolute right-0 bottom-0 flex items-center justify-center mb-4 mr-4'>
              <button className='bg-[#333] text-[#555] px-4 py-2 rounded-full text-sm animate animate-pulse'>Generate</button>
          </div>
      </div>
  </div> */}
        <div className='columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-8 gap-y-8'>
            {artifacts.map(artifact => (
                <Link href={`/outpoint/${artifact?.outpoint}/listing`} key={artifact.txid}>
                    <div
                        key={artifact.txid}
                        className='relative mb-4 break-inside-avoid'
                    >
                        <div className='relative shadow-md bg-[#111]'>
                            <img
                                src={`https://ordfs.network/${artifact.origin?.outpoint}`}
                                alt={`Image ${artifact.txid}`}
                                className='w-full h-auto rounded-lg '
                            />
                            <div className='absolute inset-0 flex flex-col justify-end p-4 text-white bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition duration-300 ease-in-out hover:opacity-100'>
                                <p className='text-base font-bold'>{toBitcoin(artifact.data?.list?.price || 0)} BSV</p>
                                <p className='text-sm'>{artifact.data?.map?.name}</p>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>

    </div>
}

export default FlowGrid;

