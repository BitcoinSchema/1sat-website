import { OrdUtxo } from "@/types/ordinals";
import Link from "next/link";
import { toBitcoin } from "satoshi-bitcoin-ts";

const FlowGrid = ({ artifacts, className }: { artifacts: OrdUtxo[], className: string }) => {
    return <div className={`relative text-center ${className}`}>
        <div className='columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4'>
            {artifacts.map(artifact => {
                const src = `https://ordfs.network/${artifact.origin?.outpoint}`

                return (
                <Link href={`/outpoint/${artifact?.outpoint}/listing`} key={artifact.txid}>
                    <div
                        key={artifact.txid}
                        className='relative mb-4 break-inside-avoid'
                    >
                        <div className='relative shadow-md bg-[#111]'>
                            <img
                            src={`https://res.cloudinary.com/tonicpow/image/fetch/c_pad,b_rgb:111111,g_center,w_${375}/f_auto/${src}`}
                                
                                alt={`Image ${artifact.txid}`}
                                className='w-full h-auto rounded-lg'
                            />
                            <div className='absolute inset-0 flex flex-col justify-end p-4 text-white bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition duration-300 ease-in-out hover:opacity-100'>
                                <p className='text-base font-bold'>{toBitcoin(artifact.data?.list?.price || 0)} BSV</p>
                                <p className='text-sm'>{artifact.data?.map?.name}</p>
                            </div>
                        </div>
                    </div>
                </Link>
            )})}
        </div>
    </div>
}

export default FlowGrid;

