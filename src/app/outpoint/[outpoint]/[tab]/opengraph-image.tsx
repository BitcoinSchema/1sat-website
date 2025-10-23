import { Container } from "@/components/og/Container";
import { Gradient } from "@/components/og/Gradient";
import { Logo } from "@/components/og/Logo";
import { API_HOST, ORDFS } from "@/constants";
import type { OrdUtxo, SigilMeta } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import { getNotoSerifItalicFont } from "@/utils/font";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "1Sat Ordinals Outpoint";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { outpoint: string };
}) {
  const notoSerif = await getNotoSerifItalicFont();

  const detailsUrl = `${API_HOST}/api/inscriptions/${params.outpoint}`
  const details = await fetch(
    detailsUrl,
    {
      next: { revalidate: 86400 }, // Cache for 24 hours - opengraph images rarely change
      headers: { 
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' 
      }
    }
  ).then((res) => {
    if (!res.ok) {
      throw new Error(`Error fetching JSON from ${detailsUrl}`);
    }
    return res.json() as Promise<OrdUtxo>
  });

  const sigilData = details.origin?.data?.map?.sigil;
  let sigilImageTxid: string | undefined;
  if (sigilData) {
    const sigil = JSON.parse(sigilData) as SigilMeta;
    sigilImageTxid = sigil.image.split("b://")[1];
  }

  // const url = `https://res.cloudinary.com/tonicpow/image/fetch/c_crop,b_rgb:111111,g_center,h_${size.height},w_${size.width}/f_auto/${ORDFS}/${params.outpoint}`;
  // use this instead https://res.cloudinary.com/tonicpow/image/fetch/c_fill,h_630,w_1200,b_rgb:111111/https://ordfs.network/f0542a36cfd31fdcd6bd4667b79e22741c361283f359e89d7b1a053ec28b2c24_0
  const url = `https://res.cloudinary.com/tonicpow/image/fetch/c_fill,h_${size.height},w_${size.width},b_rgb:111111/${ORDFS}/${sigilImageTxid || params.outpoint}`
  console.log("Opengraph image url:", url)


  const isImageInscription =
    details?.origin?.data?.insc?.file.type?.startsWith("image");
  // const url = `${ORDFS}/${params.outpoint}`;

  const name = displayName(details, false);
  return new ImageResponse(
    (
      <Container>
        {isImageInscription || sigilData ? (
          // biome-ignore lint/a11y/useAltText: <explanation>
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={alt} {...size} />
        ) : (
          name || "Mystery Outpoint"
        )}
        {name && (
          <div style={{
            fontFamily: "Noto Serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "3rem",
            top: 0,
            left: 0,
            position: "absolute",
            background: "rgba(0, 0, 0, 0.5)",
            width: "100%",
            padding: ".5rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>{name || ""}</div>
        )}
        <Gradient />
        <Logo />
      </Container>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Serif",
          data: notoSerif,
          style: "italic",
          weight: 400,
        },
      ],
    }
  );
}

// export const displayName = (details: OrdUtxo): string | undefined => {
//   return details.origin?.data?.map?.name || details.origin?.data?.map?.subTypeData.name ||
//     details.origin?.data?.bsv20?.tick ||
//     details.origin?.data?.bsv20?.sym ||
//     details.origin?.data?.insc?.json?.tick ||
//     details.origin?.data?.insc?.json?.p ||
//     details.origin?.data?.insc?.file.type;
// }