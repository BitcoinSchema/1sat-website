"use client";

import ImageWithFallback from "@/components/ImageWithFallback";
import { ORDFS } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import { OrdUtxo } from "@/types/ordinals";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";

const CollectionContent = ({
	artifact,
	collection,
}: {
	artifact: OrdUtxo;
	collection: OrdUtxo;
}) => {
	useSignals();
	const showCancelModal = useSignal(false);
	const isOwner = artifact.owner === ordAddress.value;
	const mapData = artifact.origin?.data?.map;
	const collectionData = collection.origin?.data?.map;
	const collectionInscription = collection.origin?.data?.insc;
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
				<Link href={`/collection/${collection.origin?.outpoint}`}>
					<button type="button" className="btn">
						Browse Collection
					</button>
				</Link>
			</div>
		</div>
	);
};

export default CollectionContent;
