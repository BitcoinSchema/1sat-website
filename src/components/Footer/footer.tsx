import Link from "next/link";
import { BsGpuCard } from "react-icons/bs";
import { FaBook } from "react-icons/fa6";

const Footer = () => {
	return (
		<div className="my-6 w-full h-24 flex justify-center items-center">
			<Link
				href="https://docs.1satordinals.com"
				target="_blank"
				className="font-mono flex items-center text-sm"
			>
				<FaBook className="mr-2 w-4 h-4" /> Protocol Docs
			</Link>
			<span className="mx-2">&bull;</span>
			<Link href="/mine" className="font-mono flex items-center text-sm">
				<BsGpuCard className="mr-2 w-4 h-4" /> Mine Pow20
			</Link>
		</div>
	);
};

export default Footer;

{
	/* <Vivi /> */
}
{
	/* {ordAddress && (<div><OrdAddress /></div>)} */
}
