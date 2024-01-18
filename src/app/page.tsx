import HomePage from "@/components/pages/home";

// convert to metadata api
{/* <Head>
<title>1SatOrdinals.com</title>
<meta
  name="description"
  content="An Ordinals-compatible implementation on Bitcoin SV"
/>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" href="/favicon.ico" />
</Head> */}
export default async function Home() {
  // context.res.setHeader(
  //   'Cache-Control',
  //   'public, s-maxage=3600, stale-while-revalidate=59'
  // )


  try {
    return <HomePage />;
  } catch (e) {
    console.error("failed to get artifact", e);
    return null;
  }
}
