"use client";

import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import Artifact from "@/components/artifact";
import type { OrdUtxo } from "@/types/ordinals";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  artifacts?: OrdUtxo[];
  className?: string;
}

const SlideShow = ({ artifacts, className }: Props) => {
  const [sorted, setSorted] = useState<OrdUtxo[]>(artifacts || []);
  // every 30 seconds rotate the top artifact to the bottom
  useEffect(() => {
    const interval = setInterval(() => {
      if (sorted && sorted.length > 0) {
        const first = sorted.shift();
        if (first) {
          setSorted([...sorted, first]);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [sorted]);

  return (
    <div
      className={`mx-auto w-full my-8 stack ${className ? className : ""
        }`}
    >
      {sorted?.map((artifact, idx, all) => (
        <Artifact
          artifact={artifact}
          sizes={"100vw"}
          glow={idx === all.length - 1}
          key={artifact?.origin?.outpoint}
          classNames={{
            wrapper:
              "w-[90vw] md:w-full md:min-w-96 md:max-w-[400px] 3xl:max-w-[600px] flex items-center justify-center",
            media: "w-full rounded",
          }}
          size={600}
          to={`/outpoint/${artifact?.outpoint}/listing?details=false`}
          priority={true}
          showListingTag={false}
          showFooter={false}
        />
      ))}
      {!artifacts && (
        <div className="max-w-[600px] text-yellow-400 font-mono">
          <div className="cursor-pointer mb-8 w-full">
            <Link href="/wallet">
              <Image
                style={{
                  boxShadow: "0 0 0 0 rgba(0, 0, 0, 1)",
                  transform: "scale(1)",
                  animation: "pulse 2s infinite",
                  width: "11rem",
                  height: "11rem",
                }}
                src={oneSatLogo}
                alt={"1Sat Ordinals"}
                className="cursor-pointer mx-auto rounded"
              />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlideShow;
