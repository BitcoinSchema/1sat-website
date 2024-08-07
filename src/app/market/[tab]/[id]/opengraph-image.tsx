
import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import { API_HOST, AssetType, ORDFS } from "@/constants";
import type { BSV20 } from "@/types/bsv20";
import { getNotoSerifItalicFont } from "@/utils/font";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "1Sat Ordinals Inscription";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { tab: AssetType; id: string };
}) {
  const notoSerif = await getNotoSerifItalicFont();

  let ticker: string | undefined;
  let icon: string | undefined;
  if (params.tab === AssetType.BSV20) {
    ticker = params.id;
  } else {
    const detailsUrl = `${API_HOST}/api/bsv20/id/${params.id}`;
    const details = await fetch(detailsUrl).then(
      (res) => res.json() as Promise<BSV20>
    );
    ticker = details.sym;
    icon = details.icon || "b974de563db7ca7a42f421bb8a55c61680417404c661deb7a052773eb24344e3_0";
    console.log({ details })
  }

  return new ImageResponse(
    (
      <Container>
        {params.tab === AssetType.BSV21 && (
          <div style={{
            fontFamily: "Noto Serif",
            fontStyle: "italic",
            position: "absolute",
            top: 0,
            left: 0,
            margin: "1rem",
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            color: "#555555",
          }}
          >
            {params.id}
          </div>
        )}
        <img width="50" height="50" src={`${ORDFS}/${icon}`} alt={ticker || ""} style={{
          marginRight: ".5rem",
        }} />
        {ticker || "Mystery Outpoint"}
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


const tickerName = (details: BSV20, assetType: AssetType) => {
  return assetType === AssetType.BSV20 ? details.tick : details.sym;
}