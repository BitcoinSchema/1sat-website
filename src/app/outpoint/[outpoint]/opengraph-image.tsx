import { Container } from "@/components/og/Container";
import { Gradient } from "@/components/og/Gradient";
import { Logo } from "@/components/og/Logo";
import { API_HOST } from "@/constants";
import { ordfsImageUrl } from "@/utils/ordfsImage";
import type { OrdUtxo, SigilMeta } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import { getNotoSerifItalicFont } from "@/utils/font";
import { isValidOutpoint } from "@/utils/validation";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "1Sat Ordinals Outpoint";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Cache generated images at the CDN — inscription content is immutable
const cacheHeaders = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
};

export default async function Image({
  params,
}: {
  params: { outpoint: string };
}) {
  const notoSerif = await getNotoSerifItalicFont();

  const imageOptions = {
    ...size,
    headers: cacheHeaders,
    fonts: [
      {
        name: "Noto Serif",
        data: notoSerif,
        style: "italic" as const,
        weight: 400 as const,
      },
    ],
  };

  const fallback = (label: string) =>
    new ImageResponse(
      (
        <Container>
          {label}
          <Gradient />
          <Logo />
        </Container>
      ),
      imageOptions
    );

  if (!isValidOutpoint(params.outpoint)) {
    return fallback("1Sat Ordinals");
  }

  let details: OrdUtxo;
  try {
    const res = await fetch(`${API_HOST}/api/inscriptions/${params.outpoint}`);
    if (!res.ok) {
      return fallback("Mystery Outpoint");
    }
    details = (await res.json()) as OrdUtxo;
  } catch (e) {
    return fallback("Mystery Outpoint");
  }

  const sigilData = details.origin?.data?.map?.sigil;
  let sigilImageTxid: string | undefined;
  if (sigilData) {
    try {
      const sigil = JSON.parse(sigilData) as SigilMeta;
      sigilImageTxid = sigil.image?.split("b://")[1];
    } catch (e) {
      // ignore malformed sigil metadata
    }
  }

  const isImageInscription =
    details.origin?.data?.insc?.file?.type?.startsWith("image");

  // f=png forces a format satori can always render; the endpoint
  // rasterizes even SVG sources when a raster format is requested
  const url = ordfsImageUrl(sigilImageTxid || params.outpoint, {
    w: size.width,
    h: size.height,
    fit: "fill",
    f: "png",
  });

  const name = displayName(details, false);
  return new ImageResponse(
    (
      <Container>
        {isImageInscription || sigilImageTxid ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} {...size} />
        ) : (
          name || "Mystery Outpoint"
        )}
        <Gradient />
        <Logo />
      </Container>
    ),
    imageOptions
  );
}
