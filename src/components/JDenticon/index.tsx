"use client";

import { toSvg } from "jdenticon";
import Image from "next/image";

interface JDenticonProps {
  className?: string;
  hashOrValue?: string;
}

const JDenticon = ({ className, hashOrValue }: JDenticonProps) => {
  if (!hashOrValue) {
    hashOrValue = "0";
  }
  const svgStr = toSvg(hashOrValue, 300);
  const imageUrl = `data:image/svg+xml,${encodeURIComponent(svgStr)}`;
  return (
    <Image alt="" src={imageUrl} className={className ?? ""} width={0} height={0} />
  );
};

export default JDenticon;
