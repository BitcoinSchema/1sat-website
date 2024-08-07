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


// {"rank":1113,"image":"b://cbacb16c3a03729165542f20404827f1ee91bc1f9783089c41c59524ebf75a22","score":"6.81","title":"Rare Sirloins #2149","number":2149,"rarity":"Common","series":2180,"attributes":[{"count":36,"value":"Blue","rarity":"Epic","trait_type":"Meat"},{"count":117,"value":"Free Range Egg","rarity":"Common","trait_type":"Garnish"},{"count":154,"value":"Pees","rarity":"Common","trait_type":"Side 1"},{"count":89,"value":"Banana","rarity":"Common","trait_type":"Side 2"},{"count":54,"value":"Fresh Water","rarity":"Common","trait_type":"Background"}]}


export default async function Image({
  params,
}: {
  params: { outpoint: string };
}) {
  const notoSerif = await getNotoSerifItalicFont();

  const details = await fetch(
    `${API_HOST}/api/inscriptions/${params.outpoint}`
  ).then((res) => res.json() as Promise<OrdUtxo>);

  const isImageInscription =
    details.origin?.data?.insc?.file.type?.startsWith("image");

  const sigilData = details.origin?.data?.map?.sigil;
  let sigilImageTxid: string | undefined;
  if (sigilData) {
    const sigil = JSON.parse(sigilData) as SigilMeta;
    sigilImageTxid = sigil.image.split("b://")[1];
  }
  // const url = `${ORDFS}/${params.outpoint}`;
  const url = `https://res.cloudinary.com/tonicpow/image/fetch/c_fill,h_${size.height},w_${size.width},b_rgb:111111/${ORDFS}/${sigilImageTxid || params.outpoint}`

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
            fontSize: "1.5rem",
            top: 0,
            left: 0,
            margin: "1rem",
            position: "absolute",
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