"use client";

import { useEffect, useState } from "react";

// Brand label varies by hostname. This used to be derived from the request
// host via headers() in a server component, which forced every page on the
// site into dynamic (uncacheable) rendering. Reading it client-side keeps
// the layout static — we default to the production brand and correct after
// hydration for alpha/local hosts.
const Brand = () => {
	const [host, setHost] = useState<string>("1sat.market");

	useEffect(() => {
		setHost(window.location.host);
	}, []);

	const isMarket = host === "1sat.market";
	const isAlpha =
		host === "alpha.1satordinals.com" || host === "alpha.1sat.market";
	const isLocal = host === "localhost:3000";

	return (
		<>
			<span className="md:block hidden text-nowrap">
				{isMarket || isAlpha
					? "1Sat.Market"
					: isLocal
						? "1Sat Hackinals"
						: "1Sat Ordinals"}
			</span>
			<div className="absolute -top-1 -right-12 bg-yellow-400 text-black text-xs font-bold py-1 px-2 rounded-sm transform rotate-12 shadow-md">
				{isAlpha ? "ALPHA" : "BETA"}
			</div>
		</>
	);
};

export default Brand;
