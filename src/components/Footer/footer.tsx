import Link from "next/link";
import { BsGpuCard } from "react-icons/bs";
import { FaBook, FaDiscord } from "react-icons/fa6";

const Footer = () => {
  const linkClass = "hover:text-yellow-500 text-yellow-400/25 transition-color duration-1000"

  return (
    <div className="my-6 w-full h-24 flex justify-center items-center text-neutral">
      <Link
        href="https://docs.1satordinals.com"
        target="_blank"
        className={`font-mono flex items-center text-sm ${linkClass}`}
      >
        <FaBook className="mr-2 w-4 h-4" /> Protocol
      </Link>
      <span className="mx-2">&bull;</span>
      <Link href="/mine" className={`font-mono flex items-center text-sm ${linkClass}`}>
        <BsGpuCard className="mr-2 w-4 h-4" /> Mine Pow20
      </Link>
      {/* // discord link */}
      <span className="mx-2">&bull;</span>
      <Link
        href="https://discord.gg/t5AsAsQxGT"
        target="_blank"
        className={`font-mono flex items-center text-sm ${linkClass}`}
      >
        <FaDiscord className="mr-2 w-4 h-4" /> Discord
      </Link>
      <span className="mx-2">&bull;</span>
      <Link
        href="https://x.com/1SatMarket"
        target="_blank"
        className={`font-mono flex items-center text-sm ${linkClass}`}
      >
        <svg className="w-4 h-4 mr-2" width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <title>1Sat.Market on X</title>
          <path d="M17.1761 4H19.9362L13.9061 10.7774L21 20H15.4456L11.0951 14.4066L6.11723 20H3.35544L9.80517 12.7508L3 4H8.69545L12.6279 9.11262L17.1761 4ZM16.2073 18.3754H17.7368L7.86441 5.53928H6.2232L16.2073 18.3754Z" fill="CurrentColor" />
        </svg> 1Sat.Market
      </Link>
      {/* <Vivi /> */}
    </div >
  );
};

export default Footer;

/* {ordAddress && (<div><OrdAddress /></div>)} */
