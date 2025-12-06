import CollectionLayout from "@/components/Collections/CollectionLayout";
import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import type { CollectionStats } from "@/types/collection";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

// Helper to add timeout to promises
const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
};

const Collection = async ({
  params,
}: {
  params: Promise<{ outpoint: string }>;
}) => {
  const { outpoint } = await params;
  const TIMEOUT_MS = 8000; // 8 second timeout to leave buffer before Vercel's 10s limit

  // Get the Ordinal TXO
  let collection: OrdUtxo | undefined;
  const collectionUrl = `${API_HOST}/api/txos/${outpoint}`;
  try {
    const { promise: promiseCollection, abort } =
      http.customFetch<OrdUtxo>(collectionUrl);
    collection = await withTimeout(promiseCollection, TIMEOUT_MS).catch(
      (error) => {
        abort();
        throw error;
      },
    );
  } catch (e) {
    console.error("Error fetching collection", e, collectionUrl);
  }

  // Ensure outpoint is a string (API might return object or mismatch)
  if (collection) {
    collection.outpoint = outpoint;
  }

  // Get the collection stats
  let stats: CollectionStats | undefined;
  const collectionStatsUrl = `${API_HOST}/api/collections/${outpoint}/stats`;
  try {
    const { promise, abort } =
      http.customFetch<CollectionStats>(collectionStatsUrl);
    stats =
      (await withTimeout(promise, TIMEOUT_MS).catch((error) => {
        abort();
        throw error;
      })) || [];
  } catch (e) {
    console.error("Error fetching stats", e, collectionStatsUrl);
  }

  if (!collection || !stats) {
    return (
      <CollectionLayout showBackLink>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="font-mono text-xl text-foreground mb-4">
              Collection not found
            </h2>
            <p className="text-muted-foreground text-sm">
              The collection data could not be loaded. This may be due to
              network issues or the collection may not exist.
            </p>
          </div>
        </div>
      </CollectionLayout>
    );
  }

  const collectionName = collection.origin?.data?.map?.name || "Collection";

  return (
    <CollectionLayout showBackLink collectionName={collectionName}>
      <CollectionPage stats={stats} collection={collection} />
    </CollectionLayout>
  );
};

export default Collection;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ outpoint: string }>;
}) {
  const { outpoint } = await params;
  const METADATA_TIMEOUT = 5000; // 5 second timeout for metadata

  let details: OrdUtxo | undefined;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), METADATA_TIMEOUT);

    details = await fetch(`${API_HOST}/api/inscriptions/${outpoint}`, {
      signal: controller.signal,
      next: { revalidate: 300 }, // 5 min cache
    })
      .then((res) => res.json() as Promise<OrdUtxo>)
      .finally(() => clearTimeout(timeoutId));
  } catch (e) {
    console.error("Error fetching metadata for collection", outpoint, e);
  }

  const collectionName = details
    ? details.origin?.data?.map?.name ||
    details.origin?.data?.bsv20?.tick ||
    details.origin?.data?.bsv20?.sym ||
    details.origin?.data?.insc?.json?.tick ||
    details.origin?.data?.insc?.json?.p ||
    details.origin?.data?.insc?.file.type ||
    "Mystery Outpoint"
    : "Collection";

  return {
    title: `${collectionName} Collection`,
    description: `Explore the ${collectionName} collection and its items on 1SatOrdinals.`,
    openGraph: {
      title: `${collectionName} Collection`,
      description: `Explore the ${collectionName} collection and its items on 1SatOrdinals.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${collectionName} Collection`,
      description: `Explore the ${collectionName} collection and its items on 1SatOrdinals.`,
    },
  };
}
