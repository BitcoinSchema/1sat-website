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
        <FaBook className="mr-2 w-4 h-4" /> Protocol Docs
      </Link>
      <span className="mx-2">&bull;</span>
      <Link href="/mine" className={`font-mono flex items-center text-sm ${linkClass}`}>
        <BsGpuCard className="mr-2 w-4 h-4" /> Mine Pow20
      </Link>
      {/* // discord link */}
      <span className="mx-2">&bull;</span>
      <Link
        href="https://discord.gg/fpSaAPPj4r"
        target="_blank"
        className={`font-mono flex items-center text-sm ${linkClass}`}
      >
        <FaDiscord className="mr-2 w-4 h-4" /> Discord
      </Link>
      {/* <Vivi /> */}
    </div >
  );
};

export default Footer;

/* {ordAddress && (<div><OrdAddress /></div>)} */
