"use client";

import { toSvg } from "jdenticon";

interface JDenticonProps {
  className?: string;
  hashOrValue: any;
}

const JDenticon = ({ className, hashOrValue }: JDenticonProps) => {
  const svgStr = toSvg(hashOrValue, 300);
  const svg = new Blob([svgStr], { type: "image/svg+xml" });
  const imageUrl = URL.createObjectURL(svg);
  return (
    <img src={imageUrl} className={className ?? ""} />
  );
};

export default JDenticon;
