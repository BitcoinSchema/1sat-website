"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Box, Music, Play, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toBitcoin } from "satoshi-token";
import ImageWithFallback from "@/components/image-with-fallback";
import ArtifactModal from "@/components/modal/artifact-modal";
import { Button } from "@/components/ui/button";
import { fetchMarketActivity } from "@/lib/api";
import type { OrdUtxo } from "@/lib/types/ordinals";

const LoadingSkeleton = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: skeletons are static placeholders
      <div key={`skeleton-${i}`} className="relative mb-4 break-inside-avoid">
        <div className="w-full aspect-square rounded-lg bg-muted animate-pulse" />
      </div>
    ))}
  </>
);

const getContentType = (
  artifact: OrdUtxo,
): "video" | "audio" | "3d" | "image" => {
  const contentType = artifact.origin?.data?.insc?.file.type || "";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.includes("model/") || contentType.includes("gltf"))
    return "3d";
  return "image";
};

// Hook to determine number of columns based on window width
const useColumnCount = () => {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1280)
        setColumns(4); // xl
      else if (width >= 1024)
        setColumns(3); // lg
      else if (width >= 640)
        setColumns(2); // sm
      else setColumns(1);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return columns;
};

export default function FlowGrid({ className = "" }: { className?: string }) {
  // biome-ignore lint/correctness/noUnusedVariables: intended for future optimization
  const seenOutpoints = useRef<Set<string>>(new Set());
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [selectedArtifact, setSelectedArtifact] = useState<OrdUtxo | null>(
    null,
  );
  const [showBackdrop, setShowBackdrop] = useState(false);

  // Determine column count
  const columnCount = useColumnCount();

  // Intersection Observer for images
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observeImage = useCallback(
    (element: HTMLElement | null, outpoint: string) => {
      if (!element || visible.has(outpoint)) return;

      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            const newVisible = new Set<string>();
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const id = entry.target.getAttribute("data-outpoint");
                if (id) newVisible.add(id);
                observerRef.current?.unobserve(entry.target);
              }
            });

            if (newVisible.size > 0) {
              setVisible((prev) => {
                const next = new Set(prev);
                newVisible.forEach((id) => {
                  next.add(id);
                });
                return next;
              });
            }
          },
          { threshold: 0.1 },
        );
      }

      element.setAttribute("data-outpoint", outpoint);
      observerRef.current.observe(element);
    },
    [visible],
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const closeModal = useCallback(() => {
    setShowBackdrop(false);
    setSelectedArtifact(null);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedArtifact) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedArtifact, closeModal]);

  const handleCardClick = (e: React.MouseEvent, artifact: OrdUtxo) => {
    e.preventDefault();
    // Skip view transition for now if it's causing issues, or keep it simple
    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      document.startViewTransition
    ) {
      try {
        const transition = document.startViewTransition(() => {
          flushSync(() => {
            setSelectedArtifact(artifact);
          });
        });
        transition.ready
          .then(() => {
            setShowBackdrop(true);
          })
          .catch(() => {
            setShowBackdrop(true);
          });
      } catch (_err) {
        setSelectedArtifact(artifact);
        setShowBackdrop(true);
      }
    } else {
      setSelectedArtifact(artifact);
      setShowBackdrop(true);
    }
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["market-flow"],
      queryFn: fetchMarketActivity,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: 0,
    });

  const allArtifacts = useMemo(() => {
    const flat = data?.pages.flatMap((page) => page.items) || [];
    const seen = new Set<string>();
    return flat.filter((artifact) => {
      if (!artifact?.outpoint) return false;
      if (!artifact.origin?.outpoint) return false;
      const outpointStr =
        artifact.outpoint || `${artifact.txid}_${artifact.vout}`;
      if (seen.has(outpointStr)) return false;
      seen.add(outpointStr);
      return true;
    });
  }, [data?.pages]);

  // Distribute artifacts into columns
  const columns = useMemo(() => {
    const cols: OrdUtxo[][] = Array.from({ length: columnCount }, () => []);
    allArtifacts.forEach((artifact, i) => {
      cols[i % columnCount].push(artifact);
    });
    return cols;
  }, [allArtifacts, columnCount]);

  // Track scroll position for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;

      const isNearBottom = scrollY + windowHeight >= documentHeight - 100; // 100px threshold

      if (isNearBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderArtifact = (artifact: OrdUtxo) => {
    const outpointStr =
      artifact.outpoint || `${artifact.txid}_${artifact.vout}`;
    const originOutpoint = artifact.origin?.outpoint;

    if (!originOutpoint) return null;

    const src = `https://ordfs.network/${originOutpoint}`;
    const contentType = getContentType(artifact);
    const imgSrc =
      contentType === "image"
        ? `https://res.cloudinary.com/tonicpow/image/fetch/c_pad,b_rgb:111111,g_center,w_${375}/f_auto/${src}`
        : src;
    const isVisible = visible.has(outpointStr);

    return (
      <div
        key={outpointStr}
        className={`block mb-4 relative break-inside-avoid group transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
        ref={(el) => observeImage(el, outpointStr)}
      >
        {/* Main Click Target - Link */}
        <Link
          href={`/outpoint/${outpointStr}/timeline`}
          className="absolute inset-0 z-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={(e) => handleCardClick(e, artifact)}
        >
          <span className="sr-only">View Artifact</span>
        </Link>

        {/* Card Content */}
        <div className="relative shadow-md bg-card rounded-lg overflow-hidden pointer-events-none">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8 bg-black/50 hover:bg-black/70 text-white pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(
                `https://ordfs.network/${artifact.origin?.outpoint}`,
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            <SquareArrowOutUpRight className="w-4 h-4" />
          </Button>

          {contentType === "video" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="p-4 bg-black/60 rounded-full">
                <Play className="w-12 h-12 text-white fill-white" />
              </div>
            </div>
          )}

          {contentType === "video" ? (
            <video
              src={src}
              className="w-full h-auto"
              width={375}
              muted
              playsInline
            />
          ) : contentType === "3d" ? (
            <div className="w-full aspect-square bg-gradient-to-br from-purple-900/30 to-blue-900/30 flex items-center justify-center">
              <Box className="w-24 h-24 text-purple-300/50" />
            </div>
          ) : contentType === "audio" ? (
            <div className="w-full aspect-square bg-gradient-to-br from-pink-900/30 to-orange-900/30 flex items-center justify-center">
              <Music className="w-24 h-24 text-pink-300/50" />
            </div>
          ) : (
            <ImageWithFallback
              src={imgSrc}
              alt={`Image ${artifact.txid}`}
              className="w-full h-auto"
              width={375}
              height={375}
            />
          )}

          <div className="absolute inset-0 flex flex-col justify-end p-4 text-white bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 pointer-events-none">
            <p className="text-base font-bold">
              {toBitcoin(artifact.data?.list?.price || 0)} BSV
            </p>
            <p className="text-sm truncate">{String(artifact.data?.map?.name || "")}</p>
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
      <div className={`relative ${className}`}>
        <div className="flex gap-4">
          {columns.map((colItems, colIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: columns are structural
            <div key={colIndex} className="flex-1 flex flex-col gap-0 min-w-0">
              {colItems.map(renderArtifact)}
              {/* Add skeletons to columns when loading more */}
              {isFetchingNextPage && <LoadingSkeleton count={2} />}
            </div>
          ))}

          {allArtifacts.length === 0 && !isFetchingNextPage && (
            <div className="w-full text-center py-20 text-muted-foreground col-span-full">
              No artifacts found.
            </div>
          )}
        </div>

        {/* Initial loading state */}
        {allArtifacts.length === 0 && isFetchingNextPage && (
          <div className="flex gap-4">
            {Array.from({ length: columnCount }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton columns are static
              <div key={i} className="flex-1">
                <LoadingSkeleton count={5} />
              </div>
            ))}
          </div>
        )}
      </div>

      <ArtifactModal
        artifact={selectedArtifact}
        showBackdrop={showBackdrop}
        onClose={closeModal}
      />
    </>
  );
}
