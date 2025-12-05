"use client";

import ImageWithFallback from "@/components/ImageWithFallback";
import { ORDFS } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import type { OrdUtxo } from "@/types/ordinals";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CollectionContent = ({
	artifact,
	collection,
}: {
	artifact: OrdUtxo;
	collection: OrdUtxo;
}) => {
	useSignals();
	const _showCancelModal = useSignal(false);
	const _isOwner = artifact.owner === ordAddress.value;
	const _mapData = artifact.origin?.data?.map;
	const collectionData = collection.origin?.data?.map;
	const _collectionInscription = collection.origin?.data?.insc;
	// console.log({ mapData, collectionData, collectionInscription });

	const numItems = collectionData?.subTypeData?.quantity;
	return (
		<div>
			<h2 className="text-xl">{collection.origin?.data?.map?.name}</h2>
			<div className="flex items-center justify-between text-[#555] my-2">
				<div>{artifact.origin?.data?.map?.name}</div>
				{artifact.origin?.data?.map?.subTypeData.mintNumber > 0 ? (
					<div>
						{artifact.origin?.data?.map?.subTypeData.mintNumber}/
						{numItems}
					</div>
				) : (
					<div>&nbsp;</div>
				)}
			</div>

			<div className="flex gap-2">
				<ImageWithFallback
					src={`${ORDFS}/${collection.origin?.outpoint}`}
					alt=""
					width={200}
					height={200}
				/>
				<div className="text-[#555] p-2">
					{collectionData?.subTypeData?.description}
				</div>
			</div>

			<div className="my-4 w-full text-right">
				<Button asChild>
					<Link href={`/collection/${collection.origin?.outpoint}`}>
						Browse Collection
					</Link>
				</Button>
			</div>
		</div>
	);
};

export default CollectionContent;
