"use client";

import { ORDFS } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const FeaturedCollections = () => {
	const [activeIndex, setActiveIndex] = useState(0);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		const interval = setInterval(() => {
			setActiveIndex((prevIndex) => {
				if (prevIndex + 3 >= featured.length) return 0;
				return (prevIndex + 3) % featured.length;
			});
		}, 3000); // Change 3000 to the desired interval in milliseconds

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (itemRefs.current[activeIndex]) {
			itemRefs.current[activeIndex]?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "start",
			});
		}
	}, [activeIndex]);

	return (
		<>
			<h1 className="text-xl mb-4">Featured Collections</h1>
			<div className="carousel gap-4 carousel-center w-full mb-8">
				{featured.map((collection, idx) => {
					const isActive = idx === activeIndex;
					return (
						<div
							key={`c-${collection.origin}`}
							ref={(el) => (itemRefs.current[idx] = el)}
							className={`carousel-item ${
								isActive ? "active" : ""
							}`}
						>
							<Link href={`/collection/${collection.origin}`}>
								<Image
									src={
										collection.previewUrl ||
										`${ORDFS}/${collection.origin}`
									}
									alt={collection.name}
									width={300}
									height={300}
									className="rounded h-[300px] w-[300px]"
									id={`item-${collection.origin}`}
								/>
							</Link>
						</div>
					);
				})}
			</div>
			{/* Rest of your component */}
		</>
	);
};

export default FeaturedCollections;

type Featured = {
	origin: string;
	name: string;
	previewUrl: string;
	height: number;
	royalties?: {
		type: string;
		destination: string;
		percentage: string;
	}[];
}[];

const featured: Featured = [
	{
		origin: "97ef55d928bf9101343aba2d2abef446d47c6502f032748c4b509cb7a44fbfe7_0",
		name: "Cyebr Skeleton Punks",
		previewUrl:
			"https://takeit-art-prod.s3.amazonaws.com/Cyebr_Skeleton_Punks/15ca772b-f7a8-42b0-a4f3-fcd8d2e16a99",
		height: 793171,
	},
	{
		origin: "2f3f22a5631a8634317757bd8a48982d476681307bf3cd71320d1240b3eeb9f5_0",
		name: "Free Pepe",
		previewUrl:
			"https://ordfs.network/2f3f22a5631a8634317757bd8a48982d476681307bf3cd71320d1240b3eeb9f5_0",
		height: 793360,
	},
	{
		origin: "11b33ee8b9b8ea37199dcdb8d5e653e61bd96804e291d71eae9b6c221a6408de_0",
		height: 795451,
		previewUrl:
			"https://ordfs.network/11b33ee8b9b8ea37199dcdb8d5e653e61bd96804e291d71eae9b6c221a6408de_0",
		name: "Dungeons of Deliverance",
	},
	{
		origin: "0d2b430030ab8480a430a300e0393d107b3754bce4d98bf919c39f0e752b6746_0",
		name: "Testy Pepes",
		previewUrl:
			"https://ordfs.network/0d2b430030ab8480a430a300e0393d107b3754bce4d98bf919c39f0e752b6746_0",
		height: 793348,
	},
	{
		origin: "52609820f2c020b9a6a9eaca44cae0f3972412710f5b76b52a723683a259100e_0",
		name: "coOM Test",
		previewUrl:
			"https://ordfs.network/52609820f2c020b9a6a9eaca44cae0f3972412710f5b76b52a723683a259100e_0",
		height: 792657,
	},
	{
		origin: "7b18fec9f75ba18a81a2527b119f84360d2defa1f1ed9a141cbd31a791b32f8a_0",
		name: "The Moto Club 2",
		previewUrl:
			"https://takeit-art-prod.s3.amazonaws.com/The_Moto_Club_2/c9ab6fc5-a9b1-43fe-b6b3-fb6dfcc77ab7",
		height: 792498,
	},
	{
		origin: "8cd5c67c79fd819d177f367bd5fa5a8ff8ceb801939ae39c82129164f9dc2788_0",
		name: "BitCoinDragons",
		previewUrl:
			"https://takeit-art-prod.s3.amazonaws.com/BitCoinDragons/a8b9bc7a-3156-4eea-83f7-777b83b11b67",
		height: 792227,
		royalties: [
			{
				type: "paymail",
				destination: "soysauce@handcash.io",
				percentage: "0.03",
			},
		],
	},
	{
		origin: "5117338ee9885e867fbf51d7a36b09b786bc395c817f49fd91ab6f0cb0771f97_0",
		name: "Masks of Salvation",
		previewUrl:
			"https://ordfs.network/5117338ee9885e867fbf51d7a36b09b786bc395c817f49fd91ab6f0cb0771f97_0",
		height: 791882,
	},
	{
		origin: "80d224cdf1d6f6b5145a7f5ede14b357ea7c05f7f7f4aaab04d4cc36d707f806_0",
		name: "Bookworms",
		previewUrl:
			"https://ordfs.network/80d224cdf1d6f6b5145a7f5ede14b357ea7c05f7f7f4aaab04d4cc36d707f806_0",
		height: 794090,
	},
	{
		origin: "da3ee657f921c33f38d861b4a23358e61a14f0ace56746cc2df6fa16f22cc477_0",
		name: "Ordi Pixels",
		previewUrl:
			"https://takeit-art-prod.s3.amazonaws.com/OrdiPixels/3c71a743-8a70-4a7b-93c2-569b0248e88f",
		height: 792167,
	},
	{
		origin: "3f5400faf0f209fcf185e9409f6a361b8f64bcc84bab8007654b00101720cf05_0",
		name: "Sadness",
		previewUrl:
			"https://takeit-art-prod.s3.amazonaws.com/Sadness/f2a2ca1b-df66-4c76-8b18-7a226f060a4e",
		height: 794314,
	},
	{
		origin: "3ce9034e0763511446b4cfa0e3504a0602c5dbf2f6ab6497a7f7ab6d3ae058db_0",
		name: "1Zoide",
		previewUrl:
			"https://takeit-art-prod.s3.amazonaws.com/1Zoide/ae18bbd2-b322-48cd-8b3e-ba127121d7f5",
		height: 792196,
	},
	{
		origin: "d2901f73588a012e4d4b1a44354195f86c1f057c1ccf4b612bc20c6359b11248_0",
		name: "Uniqords",
		previewUrl:
			"https://ordfs.network/d2901f73588a012e4d4b1a44354195f86c1f057c1ccf4b612bc20c6359b11248_0",
		height: 783972,
	},
	{
		origin: "ac9c9f59ae63ae07bc5a25e20dc5635f233076ab18df8c43e2c16e4f3242c750_0",
		name: "CoOM Battles · Genesis Airdrop",
		previewUrl:
			"https://ordfs.network/d873901497a2743e8832668bad9b58c22706e08b20b6d0b574436c02b8b04d28_1",
		height: 795624,
	},
	{
		origin: "8c0fe025b4ef7f9242ceb724bb26a5163e05fbd114675fe42ef6fbb40cc61117_0",
		name: "Testy Bots",
		previewUrl:
			"https://ordfs.network/8c0fe025b4ef7f9242ceb724bb26a5163e05fbd114675fe42ef6fbb40cc61117_0",
		height: 797939,
	},
	{
		origin: "9ef343b39a0fe94d7a0558b5ad01e474e6354fa5158a7326953cba45bb6b645b_0",
		name: "Elephant",
		previewUrl:
			"https://ordfs.network/9ef343b39a0fe94d7a0558b5ad01e474e6354fa5158a7326953cba45bb6b645b_0",
		height: 797436,
	},
	{
		origin: "df8a277aa03b595f6e50b576093ef6fc039a83635b2325640fce6c8d27f9edb5_0",
		name: "Cyber Apes",
		previewUrl:
			"https://takeit-art-prod.s3.amazonaws.com/Cyber_Apes/e101fcfe-ed92-42c0-a8ee-e1355fa9852f",
		height: 796184,
	},
	{
		origin: "01a3f41c0469654b5a241f6b9851e26d945237120e47ddfe608a858233314385_0",
		name: "SATOSHI T-SHIRT",
		height: 822067,
		previewUrl:
			"https://ordfs.network/01a3f41c0469654b5a241f6b9851e26d945237120e47ddfe608a858233314385_0",
	},
	{
		origin: "e7675dfb0ab6699615c3a1a136b15967b1d91db6ccfdc33ec3c1e477b8db8dd3_0",
		name: "Apocalyptic Skulls",
		height: 822067,
		previewUrl:
			"https://ordfs.network/e7675dfb0ab6699615c3a1a136b15967b1d91db6ccfdc33ec3c1e477b8db8dd3_0",
	},
	{
		origin: "8b53a045593360ad6cf40eb5560a22569f81210adf4e8183b64c33fa10fd1c5f_0",
		name: "The Burning City",
		height: 822147,
		previewUrl:
			"https://ordfs.network/8b53a045593360ad6cf40eb5560a22569f81210adf4e8183b64c33fa10fd1c5f_0",
	},
	{
		origin: "eaf6d49b61709e2819106450d69aa07ca348518d5604ddde0d2ceb86b91b10c5_0",
		name: "Aurora Smoke Creations",
		height: 821186,
		previewUrl:
			"https://ordfs.network/eaf6d49b61709e2819106450d69aa07ca348518d5604ddde0d2ceb86b91b10c5_0",
	},
	{
		origin: "4a971c2b635c15020b4db94e8ee5335f24c31b3cca24217eba62dc33f5119924_0",
		name: "Queen Amina",
		height: 821186,
		previewUrl:
			"https://ordfs.network/4a971c2b635c15020b4db94e8ee5335f24c31b3cca24217eba62dc33f5119924_0",
	},
	{
		origin: "10348fea8e360dff673599653c6045c1481c7fc83fc5047f810fa4a0fc1c0a3a_0",
		name: "Satoshi Island",
		height: 820397,
		previewUrl:
			"https://ordfs.network/10348fea8e360dff673599653c6045c1481c7fc83fc5047f810fa4a0fc1c0a3a_0",
	},
	{
		origin: "d4d9f56ac42133771a01e116c99ea5f116a3f0fd07d1a616ebefec8b9cc67551_0",
		name: "Chromatic Orbits",
		height: 819673,
		previewUrl:
			"https://ordfs.network/d4d9f56ac42133771a01e116c99ea5f116a3f0fd07d1a616ebefec8b9cc67551_0",
	},
	{
		origin: "ba2faf2e161778e7eb43dca0d8cd4b1c634287b3f10823cf19b5d63dd4438579_0",
		name: "Pixel Zoide",
		height: 798748,
		previewUrl:
			"https://ordfs.network/ba2faf2e161778e7eb43dca0d8cd4b1c634287b3f10823cf19b5d63dd4438579_0",
	},
	{
		origin: "987ab3e622292c79500cb8f57d1a4cb78f767286ddc845c6fcede2d3da2c6465_0",
		name: "Quantum Entropy",
		height: 798626,
		previewUrl:
			"https://ordfs.network/987ab3e622292c79500cb8f57d1a4cb78f767286ddc845c6fcede2d3da2c6465_0",
	},
	{
		origin: "9c3306139873896cf8c34af1df30544fc6f25f1615406331ac398e758c47e120_0",
		name: "The missing Dryad Queens",
		height: 821186,
		previewUrl:
			"https://ordfs.network/9c3306139873896cf8c34af1df30544fc6f25f1615406331ac398e758c47e120_0",
	},
	{
		origin: "9fa0be6133b10632e45e231ef88448b2c48a821e08afaacc7ac7e6e12ea232b0_0",
		name: "The Frosty Village",
		height: 821248,
		previewUrl:
			"https://ordfs.network/9fa0be6133b10632e45e231ef88448b2c48a821e08afaacc7ac7e6e12ea232b0_0",
	},
	{
		origin: "777960410d05f101969c8d176a256bddcaa5e98528ee7e25193e358b3f60d139_0",
		name: "Hodlocker Season 2",
		height: 820397,
		previewUrl:
			"https://ordfs.network/777960410d05f101969c8d176a256bddcaa5e98528ee7e25193e358b3f60d139_0",
	},
	{
		origin: "806a98823f654f17268f61a0e04cfc70a55011a75108ec4427ca0779de922540_0",
		name: "Angels Of Darkness",
		height: 820397,
		previewUrl:
			"https://ordfs.network/806a98823f654f17268f61a0e04cfc70a55011a75108ec4427ca0779de922540_0",
	},
	{
		origin: "ba4984725557824eb46e6dd00b9461fd703beb6a1f69d4098266c969b7bfeec1_0",
		name: "Last Hope",
		height: 819573,
		previewUrl:
			"https://ordfs.network/ba4984725557824eb46e6dd00b9461fd703beb6a1f69d4098266c969b7bfeec1_0",
	},
	{
		origin: "153901edbc17c714bfaf1953e82032b02faa61296ca179ff1caf8e392ff18bab_0",
		name: "Hodlocker Season 1",
		height: 818432,
		previewUrl:
			"https://ordfs.network/153901edbc17c714bfaf1953e82032b02faa61296ca179ff1caf8e392ff18bab_0",
	},
	{
		origin: "6352cd99e4df66f727175b71da91f0bf0276cd4541ab6cb213126ea22c7f8f61_0",
		name: "Magic Mushrooms",
		height: 818426,
		previewUrl:
			"https://ordfs.network/6352cd99e4df66f727175b71da91f0bf0276cd4541ab6cb213126ea22c7f8f61_0",
	},
	{
		origin: "805d7173b4018228004f8655d994ea967851bdb1e15aebcf5936aeb4147fedf1_0",
		name: "Testing Burgers",
		height: 818298,
		previewUrl:
			"https://ordfs.network/805d7173b4018228004f8655d994ea967851bdb1e15aebcf5936aeb4147fedf1_0",
	},
	{
		origin: "d545e4218a92492d7129ffc2caa02c09a7e38505a775f65b919884417814b281_0",
		name: "Nakagon 2",
		height: 808506,
		previewUrl:
			"https://ordfs.network/d545e4218a92492d7129ffc2caa02c09a7e38505a775f65b919884417814b281_0",
	},
	{
		origin: "76e7af296d8c051775caa2a305cf99d13c870999eecedf6a453c02377e87814f_0",
		name: "1Zoide",
		height: 792196,
		previewUrl:
			"https://ordfs.network/76e7af296d8c051775caa2a305cf99d13c870999eecedf6a453c02377e87814f_0",
	},
];
