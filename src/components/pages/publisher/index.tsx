import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Collection = {
	outpoint: string;
	name: string;
	signerAddress?: string;
	image: string;
};

type PublisherCollectionProps = {
	collection: Collection;
};

const PublisherPage = async ({ collection: c }: PublisherCollectionProps) => {
	const src = await import(`@/assets/images/coom/${c.image}`);

	return (
		<>
			<Card
				key={c.outpoint}
				className="flex flex-col sm:flex-row items-center gap-4 p-4"
			>
				<div className="shrink-0">
					<Image
						width={(90 * 16) / 9}
						height={90}
						alt={`${c.name} image`}
						src={src}
						className="rounded-md object-cover"
					/>
				</div>
				<CardContent className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-0">
					<CardTitle className="text-center sm:text-left">{c.name}</CardTitle>
					<div className="flex justify-center sm:justify-end">
						<Button asChild>
							<Link href={`/publisher/COOM/${c.outpoint}`}>Check</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
			<Separator className="my-6" />
		</>
	);
};

export default PublisherPage;
