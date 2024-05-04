"use client"

import { MINI_API_HOST, ORDFS } from "@/constants";
import type { Collection } from "@/types/collection";
import { useQuery } from "@tanstack/react-query";
import { Noto_Serif } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import { useMediaQuery } from "usehooks-ts";
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

  const smUp = useMediaQuery('(min-width: 640px)');
  const mdUp = useMediaQuery('(min-width: 768px)');
  const lgUp = useMediaQuery('(min-width: 1024px)');
  const xlUp = useMediaQuery('(min-width: 1280px)');
  const xxlUp = useMediaQuery('(min-width: 1536px)');

  const settings = useMemo(() => {
    return {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: xxlUp ? 4 : xlUp ? 4 : lgUp ? 4 : mdUp ? 3 : smUp ? 2 : 1,
      slidesToScroll: xxlUp ? 4 : xlUp ? 4 : lgUp ? 4 : mdUp ? 3 : smUp ? 2 : 1,
      autoplay: true,
      autoplaySpeed: 3000,
    };
  }, [xxlUp, xlUp, lgUp, mdUp, smUp]);

  return (
    <>
      <h1 className={`text-2xl mb-4 ${notoSerif.className}`}>Featured Collections</h1>
      <FeaturedCollections settings={settings} />
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


