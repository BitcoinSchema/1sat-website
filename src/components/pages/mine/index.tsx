import Image from "next/image";
import Link from "next/link";
import type React from "react";
import src from "/src/assets/images/pow20/collapsed.png";

const COLOR1 = "#2A1603"; // Replace with your desired color1
const COLOR2 = "#DB8738"; // Replace with your desired color2

const MinePage: React.FC = async () => {
	return (
		<>
			<main className="px-4 flex items-center justify-center h-full w-full min-h-[calc(100dvh-15rem+)]">
				<div className="flex flex-col items-center w-full h-full relative">
					<pre
						className="leading-[2.5rem] tracking-tight font-mono text-4xl select-none my-12"
						style={{
							background: `linear-gradient(to bottom, ${COLOR1}, ${COLOR2})`,
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
						}}
					>
						{bloodyPow}
					</pre>
					<div className="my-12">
						<img
							src={src}
							height={21}
							width={716}
							alt="collapsed"
							className="w-full rounded border-2 border-neutral/75"
						/>
					</div>
					<div className="w-full flex flex-col items-center justify-center h-full">
						<div className="divider divider-warning w-64 mx-auto text-warning/50">
							Download Miner
						</div>
						<div>
							Request beta access in{" "}
							<a
								href="https://discord.gg/kCspYAsRZr"
								target="_blank"
								rel="noreferrer"
								className="text-accent"
							>
								Discord
							</a>
							.
						</div>
						<div className="flex mx-auto max-w-fit gap-4 pointer-events-none opacity-10">
							<Link
								href="#/miner/pow20-windows-amd64.exe"
								className="flex flex-col btn md:btn-lg btn-primary  font-bold mt-4"
							>
								Windows
								<span className="font-normal text-xs text-neutral/50">
									+Cuda
								</span>
							</Link>
							<Link
								href="#/miner/pow20-darwin-amd64"
								className="flex flex-col btn md:btn-lg btn-primary  font-bold mt-4"
							>
								Mac
								<span className="font-normal text-xs text-neutral/50">
									Amd64
								</span>
							</Link>
							<Link
								href="#/miner/pow20-darwin-arm64"
								className="flex flex-col btn md:btn-lg btn-primary  font-bold mt-4"
							>
								Mac
								<span className="font-normal text-xs text-neutral/50">
									Arm64
								</span>
							</Link>
						</div>
					</div>
				</div>
			</main>
		</>
	);
};

export default MinePage;

const bloodyPow = ` ██▓███   ▒█████   █     █░
▓██░  ██▒▒██▒  ██▒▓█░ █ ░█░
▓██░ ██▓▒▒██░  ██▒▒█░ █ ░█
▒██▄█▓▒ ▒▒██   ██░░█░ █ ░█
▒██▒ ░  ░░ ████▓▒░░░██▒██▓ 20
▒▓▒░ ░  ░░ ▒░▒░▒░ ░ ▓░▒ ▒
░▒ ░       ░ ▒ ▒░   ▒ ░ ░
░░       ░ ░ ░ ▒    ░   ░
             ░ ░      ░       `;
