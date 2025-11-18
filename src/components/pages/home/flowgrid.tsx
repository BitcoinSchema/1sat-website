"use client"

import { useState, useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import type { OrdUtxo } from "@/types/ordinals";
import Link from "next/link";
import { toBitcoin } from "satoshi-token";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SquareArrowOutUpRight, Play, Box, Music } from "lucide-react";
import ArtifactModal from "@/components/modal/artifactModal";
import ImageWithFallback from "@/components/ImageWithFallback";

const LoadingSkeleton = ({ count }: { count: number }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <div key={`skeleton-${i}`} className="relative mb-4 break-inside-avoid">
                <div className="skeleton w-full aspect-square rounded-lg bg-[#333] animate-pulse"></div>
            </div>
        ))}
    </>
);

const getContentType = (artifact: OrdUtxo): 'video' | 'audio' | '3d' | 'image' => {
    const contentType = artifact.origin?.data?.insc?.file.type || '';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('audio/')) return 'audio';
    if (contentType.includes('model/') || contentType.includes('gltf')) return '3d';
    return 'image';
};

const FlowGrid = ({ initialArtifacts, className }: { initialArtifacts: OrdUtxo[], className: string }) => {
    const observers = useRef<Map<string, IntersectionObserver>>(new Map());
    const sentinelRef = useRef<HTMLDivElement>(null);
    const seenOutpoints = useRef<Set<string>>(new Set());
    const [visible, setVisible] = useState<Map<string, boolean>>(new Map());
    const [selectedArtifact, setSelectedArtifact] = useState<OrdUtxo | null>(null);
    const [showBackdrop, setShowBackdrop] = useState(false);

    const observeImage = useCallback((element: HTMLImageElement, artifact: OrdUtxo) => {
        if (!element) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(prev => new Map(prev).set(artifact.outpoint, true));
                observer.disconnect();
            }
        }, { threshold: 0.1 });
        observer.observe(element);
        observers.current.set(artifact.outpoint, observer);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedArtifact) {
                closeModal();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [selectedArtifact]);

    const handleCardClick = (e: React.MouseEvent, artifact: OrdUtxo) => {
        e.preventDefault();
        if (typeof document !== 'undefined' && 'startViewTransition' in document) {
            try {
                const transition = (document as any).startViewTransition(() => {
                    flushSync(() => {
                        setSelectedArtifact(artifact);
                    });
                });
                transition.ready.then(() => {
                    setShowBackdrop(true);
                }).catch(() => {
                    // Transition aborted, ensure modal still shows
                    setShowBackdrop(true);
                });
            } catch (err) {
                // Fallback if transition fails
                setSelectedArtifact(artifact);
                setShowBackdrop(true);
            }
        } else {
            setSelectedArtifact(artifact);
            setShowBackdrop(true);
        }
    };

    const closeModal = () => {
        setShowBackdrop(false);
        setSelectedArtifact(null);
    };

    useEffect(() => {
        initialArtifacts.forEach(a => {
            const outpoint = a.outpoint || `${a.txid}_${a.vout}`;
            seenOutpoints.current.add(outpoint);
        });
    }, [initialArtifacts]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['market-flow'],
        queryFn: async ({ pageParam }) => {
            console.log(`Fetching page at cursor ${pageParam}`);
            const response = await fetch(`/api/feed?cursor=${pageParam}&limit=30`);
            const result = await response.json() as { items: OrdUtxo[], nextCursor: number | null, total: number };
            console.log(`Received ${result.items.length} items, nextCursor: ${result.nextCursor}, total: ${result.total}`);
            result.items.forEach(item => {
                const outpoint = item.outpoint || `${item.txid}_${item.vout}`;
                seenOutpoints.current.add(outpoint);
            });
            return result;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: 0,
        initialData: initialArtifacts.length > 0 ? {
            pages: [{
                items: initialArtifacts,
                nextCursor: initialArtifacts.length,
                total: initialArtifacts.length
            }],
            pageParams: [0]
        } : undefined,
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const allArtifacts = data?.pages.flatMap(page => page.items) || [];
    const seen = new Set<string>();
    const artifacts = allArtifacts.filter(artifact => {
        if (!artifact?.outpoint) return false;
        if (!artifact.origin?.outpoint) return false;

        // Use artifact.outpoint directly - this is the CURRENT listing outpoint
        const outpointStr = artifact.outpoint || `${artifact.txid}_${artifact.vout}`;

        if (seen.has(outpointStr)) return false;
        seen.add(outpointStr);
        return true;
    });

    useEffect(() => {
        console.log(`FlowGrid: ${data?.pages.length || 0} pages, ${allArtifacts.length} total artifacts, ${artifacts.length} after dedup, hasNextPage: ${hasNextPage}`);
    }, [data?.pages.length, allArtifacts.length, artifacts.length, hasNextPage]);

    useEffect(() => {
        // Initialize all new artifacts as visible immediately
        // IntersectionObserver lazy loading was causing items to stay invisible
        for (const artifact of artifacts) {
            // Use artifact.outpoint directly - this is the CURRENT listing outpoint
            const outpointStr = artifact.outpoint || `${artifact.txid}_${artifact.vout}`;

            setVisible(prev => {
                if (!prev.has(outpointStr)) {
                    return new Map(prev).set(outpointStr, true);
                }
                return prev;
            });
        }
        return () => {
            observers.current.forEach(observer => observer.disconnect());
        };
    }, [artifacts]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    console.log('Sentinel intersecting, fetching next page');
                    fetchNextPage();
                }
            },
            { threshold: 0, rootMargin: '0px 0px 1000px 0px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <>
        <div className={`relative text-center ${className}`}>
            <div className='columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4'>
                {artifacts.length === 0 ? (
                    <LoadingSkeleton count={20} />
                ) : (
                    <>
                        {artifacts.map((artifact) => {
                            // Use the artifact.outpoint directly - this is the CURRENT listing outpoint, not the origin
                            const outpointStr = artifact.outpoint || `${artifact.txid}_${artifact.vout}`;

                            // Ensure origin.outpoint is a string and not an object
                            const originOutpoint = artifact.origin?.outpoint;
                            const isValidOutpoint = originOutpoint && typeof originOutpoint === 'string' && originOutpoint.length > 0;

                            if (!isValidOutpoint) {
                                console.warn('Invalid origin outpoint for artifact:', artifact.txid, originOutpoint);
                                return null;
                            }

                            const src = `https://ordfs.network/${originOutpoint}`;
                            const isInModal = selectedArtifact?.outpoint === outpointStr;
                            const contentType = getContentType(artifact);
                            const imgSrc = contentType === 'image' ? `https://res.cloudinary.com/tonicpow/image/fetch/c_pad,b_rgb:111111,g_center,w_${375}/f_auto/${src}` : src;

                            return (
                                <Link href={`/outpoint/${outpointStr}/timeline`} key={outpointStr}>
                                    <div
                                        className={`relative mb-4 break-inside-avoid group ${visible.get(outpointStr) ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                                        onClick={(e) => handleCardClick(e, artifact)}
                                    >
                                        <div className={"relative shadow-md bg-[#111] rounded-lg"}>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    window.open(`https://ordfs.network/${artifact.origin?.outpoint}`, '_blank', 'noopener,noreferrer');
                                                }}
                                                className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <SquareArrowOutUpRight className="w-4 h-4 text-white" />
                                            </button>
                                            {contentType === 'video' && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                    <div className="p-4 bg-black/60 rounded-full">
                                                        <Play className="w-12 h-12 text-white fill-white" />
                                                    </div>
                                                </div>
                                            )}
                                            {contentType === 'video' ? (
                                                <video
                                                    src={src}
                                                    className='w-full h-auto rounded-lg'
                                                    width={375}
                                                    muted
                                                    playsInline
                                                    ref={(el) => {
                                                        if (!el) return;
                                                        observeImage(el as any, artifact)
                                                    }}
                                                />
                                            ) : contentType === '3d' ? (
                                                <div
                                                    className='w-full aspect-square rounded-lg bg-gradient-to-br from-purple-900/30 to-blue-900/30 flex items-center justify-center'
                                                >
                                                    <Box className="w-24 h-24 text-purple-300/50" />
                                                </div>
                                            ) : contentType === 'audio' ? (
                                                <div
                                                    className='w-full aspect-square rounded-lg bg-gradient-to-br from-pink-900/30 to-orange-900/30 flex items-center justify-center'
                                                >
                                                    <Music className="w-24 h-24 text-pink-300/50" />
                                                </div>
                                            ) : (
                                                <ImageWithFallback
                                                    src={imgSrc}
                                                    alt={`Image ${artifact.txid}`}
                                                    className='w-full h-auto rounded-lg'
                                                    width={375}
                                                    ref={(el) => {
                                                        if (!el) return;
                                                        observeImage(el, artifact)
                                                    }}
                                                />
                                            )}
                                            <div className='absolute inset-0 flex flex-col justify-end p-4 text-white bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 pointer-events-none'>
                                                <p className='text-base font-bold'>{toBitcoin(artifact.data?.list?.price || 0)} BSV</p>
                                                <p className='text-sm'>{artifact.data?.map?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                        {isFetchingNextPage && <LoadingSkeleton count={30} />}
                    </>
                )}
            </div>
            <div ref={sentinelRef} className="h-20" />
        </div>

        <ArtifactModal
            artifact={selectedArtifact}
            showBackdrop={showBackdrop}
            onClose={closeModal}
        />
        </>
    );
};

export default FlowGrid;
