import { Container } from "@/components/og/Container";
import { Logo } from "@/components/og/Logo";
import type { AssetType } from "@/constants";
import { getNotoSerifItalicFont } from "@/utils/font";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "1Sat Ordinals Market Listings";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { tab: AssetType };
}) {
  const notoSerif = await getNotoSerifItalicFont();

  return new ImageResponse(
    (
      <Container>
        {`${params.tab} Market Listings`}
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
