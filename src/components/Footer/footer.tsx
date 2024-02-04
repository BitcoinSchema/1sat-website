import Link from "next/link";
import { FaBook } from "react-icons/fa6";


const Footer = () => {
  return (<div className=" my-6 w-full h-24">
    <Link href="https://docs.1satordinals.com" className="font-mono flex items-center justify-center text-sm max-w-fit mx-auto">
      <FaBook className="mr-2 w-4 h-4" /> Protocol Docs
    </Link>
    {/* <Vivi /> */}
    {/* {ordAddress && (<div><OrdAddress /></div>)} */}
  </div>
  );
};


export default Footer;

