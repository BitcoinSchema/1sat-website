"use client"

import { MINI_API_HOST, ORDFS } from "@/constants";
import type { Collection } from "@/types/collection";
import { useQuery } from "@tanstack/react-query";
import { Noto_Serif } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import FeaturedCollections from "./featured";

const notoSerif = Noto_Serif({
  style: "italic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const Collections = () => {
  const { data } = useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: async () =>
      await fetch(`${MINI_API_HOST}/collection/`).then(
        (res) => res.json()
      ),
  });

  return (
    <>
      <h1 className={`text-2xl mb-4 ${notoSerif.className}`}>Featured Collections</h1>
      <FeaturedCollections />
      <h1 className={`text-2xl mb-4 ${notoSerif.className}`}>Current Hype</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 w-full">
        {data?.map((c) => (
          <div key={c.outpoint} className="relative overflow-hidden w-[300px] h-[300px]">
            <Link href={`/collection/${c.outpoint}`}>
              <Image
                width={300}
                height={300}
                src={c.data?.map?.previewUrl || `${ORDFS}/${c.outpoint}`}
                alt=""
                className="rounded-box"
              />
            </Link>
            <div className="absolute bottom-0 left-0 w-full h-fit p-2 bg-black/15 text-sm font-mono">
              <Link href={`/collection/${c.outpoint}`} className="drop-shadow">
                {c.data?.map?.name}
              </Link>
              <p className="drop-shadow">{c.height}</p>
              <p className="drop-shadow">
                {c.stats?.count
                  ? c.stats.max
                    ? c.stats.count
                    : `#${c.stats.count}`
                  : ""}
                {c.stats?.max ? `/${c.stats.max}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Collections;


