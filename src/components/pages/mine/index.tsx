import Image from "next/image";
import Link from "next/link";
import type React from "react";
import src from "@/assets/images/pow20/collapsed.png";
import { Button } from "@/components/ui/button";

const COLOR1 = "#2A1603"; // Replace with your desired color1
const COLOR2 = "#DB8738"; // Replace with your desired color2

const MinePage: React.FC = async () => {
	return (
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
						<Image
							src={src}
							height={21}
							width={716}
							alt="collapsed"
							className="w-full rounded border-2 border-neutral/75"
						/>
					</div>
					<div className="w-full flex flex-col items-center justify-center h-full">
						<div className="w-64 mx-auto my-4 flex items-center gap-3 text-amber-500/70 text-xs uppercase tracking-wide">
							<span className="h-px flex-1 bg-amber-500/40" />
							<span>Download Miner</span>
							<span className="h-px flex-1 bg-amber-500/40" />
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
							<Button
								asChild
								size="lg"
								className="flex flex-col font-bold mt-4"
							>
								<Link href="#/miner/pow20-windows-amd64.exe">
									Windows
									<span className="font-normal text-xs text-neutral/50">
										+Cuda
									</span>
								</Link>
							</Button>
							<Button
								asChild
								size="lg"
								className="flex flex-col font-bold mt-4"
							>
								<Link href="#/miner/pow20-darwin-amd64">
									Mac
									<span className="font-normal text-xs text-neutral/50">
										Amd64
									</span>
								</Link>
							</Button>
							<Button
								asChild
								size="lg"
								className="flex flex-col font-bold mt-4"
							>
								<Link href="#/miner/pow20-darwin-arm64">
									Mac
									<span className="font-normal text-xs text-neutral/50">
										Arm64
									</span>
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</main>
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
