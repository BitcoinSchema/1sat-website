import PublisherPage from "@/components/pages/publisher";
import Image from "next/image";
import { COOM_COLLECTIONS } from "./constants";

const Publisher = async () => {
	const src = await import("/src/assets/images/coom/coom_logo.png");

	return (
		<div className="sm:container sm:mx-auto px-8">
			<div className="flex gap-12 justify-center items-center mb-16">
				<div className="avatar">
					<div className="w-24 rounded">
						<Image
							width={96}
							height={96}
							src={src}
							alt="Champions od Otherworldly Magic logo"
						/>
					</div>
				</div>
				<h1 className="text-2xl self-center font-bold leading-7 sm:truncate sm:text-3xl sm:tracking-tight">
					Champions of Otherworldly Magic
				</h1>
			</div>
			{COOM_COLLECTIONS.map((c) => (
				<PublisherPage key={c.outpoint} collection={c} />
			))}
		</div>
	);
};

export default Publisher;
