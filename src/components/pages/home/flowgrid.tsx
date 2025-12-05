"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
            <div key={`skeleton-${i}`} className="relative mb-4">
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

// Hook to determine number of columns based on window width
const useColumnCount = () => {
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1280) setColumns(4);      // xl
            else if (width >= 1024) setColumns(3); // lg
            else if (width >= 640) setColumns(2);  // sm
            else setColumns(1);
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    return columns;
};

const FlowGrid = ({ initialArtifacts, className }: { initialArtifacts: OrdUtxo[], className: string }) => {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const seenOutpoints = useRef<Set<string>>(new Set());
    const [visible, setVisible] = useState<Set<string>>(new Set());
    const [selectedArtifact, setSelectedArtifact] = useState<OrdUtxo | null>(null);
    const [showBackdrop, setShowBackdrop] = useState(false);
    
    // Determine column count
    const columnCount = useColumnCount();

    // Intersection Observer for images
    const observerRef = useRef<IntersectionObserver | null>(null);

    const observeImage = useCallback((element: HTMLElement | null, outpoint: string) => {
        if (!element || visible.has(outpoint)) return;
        
        if (!observerRef.current) {
            observerRef.current = new IntersectionObserver((entries) => {
                const newVisible = new Set<string>();
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('data-outpoint');
                        if (id) newVisible.add(id);
                        observerRef.current?.unobserve(entry.target);
                    }
                });
                
                if (newVisible.size > 0) {
                    setVisible(prev => {
                        const next = new Set(prev);
                        newVisible.forEach(id => next.add(id));
                        return next;
                    });
                }
            }, { threshold: 0.1 });
        }

        element.setAttribute('data-outpoint', outpoint);
        observerRef.current.observe(element);
    }, [visible]);

    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
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
        // Skip view transition for now if it's causing issues, or keep it simple
        if (typeof document !== 'undefined' && 'startViewTransition' in document) {
             try {
                // @ts-ignore
                const transition = document.startViewTransition(() => {
                    flushSync(() => {
                        setSelectedArtifact(artifact);
                    });
                });
                transition.ready.then(() => {
                    setShowBackdrop(true);
                }).catch(() => {
                    setShowBackdrop(true);
                });
            } catch (err) {
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
            const response = await fetch(`/api/feed?cursor=${pageParam}&limit=30`);
            const result = await response.json() as { items: OrdUtxo[], nextCursor: number | null, total: number };
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
                total: 1000
            }],
            pageParams: [0]
        } : undefined,
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const allArtifacts = useMemo(() => {
        const flat = data?.pages.flatMap(page => page.items) || [];
        const seen = new Set<string>();
        return flat.filter(artifact => {
            if (!artifact?.outpoint) return false;
            if (!artifact.origin?.outpoint) return false;
            const outpointStr = artifact.outpoint || `${artifact.txid}_${artifact.vout}`;
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

    // Infinite scroll sentinel
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: '400px' } // Increased rootMargin for smoother loading
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const renderArtifact = (artifact: OrdUtxo) => {
        const outpointStr = artifact.outpoint || `${artifact.txid}_${artifact.vout}`;
        const originOutpoint = artifact.origin?.outpoint;
        
        if (!originOutpoint) return null;

        const src = `https://ordfs.network/${originOutpoint}`;
        const contentType = getContentType(artifact);
        const imgSrc = contentType === 'image' ? `https://res.cloudinary.com/tonicpow/image/fetch/c_pad,b_rgb:111111,g_center,w_${375}/f_auto/${src}` : src;
        const isVisible = visible.has(outpointStr);

        return (
            <Link href={`/outpoint/${outpointStr}/timeline`} key={outpointStr} className="block mb-4">
                <div
                    className={`relative break-inside-avoid group ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                    onClick={(e) => handleCardClick(e, artifact)}
                    ref={(el) => observeImage(el, outpointStr)}
                >
                    <div className={"relative shadow-md bg-[#111] rounded-lg overflow-hidden"}>
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
                                className='w-full h-auto'
                                width={375}
                                muted
                                playsInline
                            />
                        ) : contentType === '3d' ? (
                            <div className='w-full aspect-square bg-gradient-to-br from-purple-900/30 to-blue-900/30 flex items-center justify-center'>
                                <Box className="w-24 h-24 text-purple-300/50" />
                            </div>
                        ) : contentType === 'audio' ? (
                            <div className='w-full aspect-square bg-gradient-to-br from-pink-900/30 to-orange-900/30 flex items-center justify-center'>
                                <Music className="w-24 h-24 text-pink-300/50" />
                            </div>
                        ) : (
                            <ImageWithFallback
                                src={imgSrc}
                                alt={`Image ${artifact.txid}`}
                                className='w-full h-auto'
                                width={375}
                            />
                        )}
                        
                        <div className='absolute inset-0 flex flex-col justify-end p-4 text-white bg-gradient-to-t from-black via-transparent to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 pointer-events-none'>
                            <p className='text-base font-bold'>{toBitcoin(artifact.data?.list?.price || 0)} BSV</p>
                            <p className='text-sm truncate'>{artifact.data?.map?.name}</p>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <>
        <div className={`relative ${className}`}>
            <div className="flex gap-4">
                {columns.map((colItems, colIndex) => (
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
                         <div key={i} className="flex-1">
                             <LoadingSkeleton count={5} />
                         </div>
                     ))}
                 </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-20 w-full flex items-center justify-center mt-8">
                {hasNextPage && (
                    <div className="text-muted-foreground">
                        {isFetchingNextPage ? 'Loading more...' : 'Scroll for more'}
                    </div>
                )}
            </div>
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
