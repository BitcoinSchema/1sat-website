import { API_HOST, ORDFS } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
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
}: { params: { outpoint: string } }) {

  const notoSerif = fetch(
    new URL('./NotoSerif-Italic.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer())
   
	const details = await fetch(
		`${API_HOST}/api/inscriptions/${params.outpoint}`,
	).then((res) => res.json() as Promise<OrdUtxo>);

  // If its an image type, use the image as the og:image
	if (details.origin?.data?.insc?.file.type?.startsWith("image")) {
    const url = `${ORDFS}/${params.outpoint}`;
		return new ImageResponse(
			<img src={url} alt={alt} />,
      {
        // For convenience, we can re-use the exported opengraph-image
        // size config to also set the ImageResponse's width and height.
        ...size       
      }
		);
	}

  // Otherwise, generate a text image
	return new ImageResponse(
		<div
			style={{
				fontSize: 48,
				background: "black",
        color: "white",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
        fontFamily: "Noto Serif",
			}}
		>
			{details.origin?.data?.map?.name ||
				details.origin?.data?.bsv20?.tick ||
				details.origin?.data?.bsv20?.sym ||
        details.origin?.data?.insc?.json?.tick ||
        details.origin?.data?.insc?.json?.p ||
        details.origin?.data?.insc?.file.type ||
				"Mystery Outpoint"}
		</div>,
		{
			...size,
      fonts: [
        {
          name: 'Noto Serif',
          data: await notoSerif,
          style: 'italic',
          weight: 400,
        },
      ],
		},
	);
}
