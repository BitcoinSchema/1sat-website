"use client"

import { ordAddress } from "@/signals/wallet/address";
import Link from "next/link";
import { FaGithub } from "react-icons/fa6";
import OrdAddress from "../ordAddress";

const Footer = () => {
  return (<>
    <Link href="https://github.com/bitcoinschema/1sat-website" className="font-mono text-sm my-6 flex items-center justify-center w-full h-24">
      <FaGithub className="mr-2 w-4 h-4" /> Fork Me
    </Link>
    {ordAddress && (<div><OrdAddress /></div>)}
  </>
  );
};


export default Footer;

