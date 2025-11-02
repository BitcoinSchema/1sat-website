"use client"

import { useState, useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import type { OrdUtxo } from "@/types/ordinals";
import Link from "next/link";
import { toBitcoin } from "satoshi-token";
import { useInfiniteQuery } from "@tanstack/react-query";
import Artifact from "@/components/artifact";
import { SquareArrowOutUpRight, X, Play, ShoppingCart, Box, Music } from "lucide-react";
import BuyArtifactModal from "@/components/modal/buyArtifact";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const LoadingSkeleton = ({ count }: { count: number }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <div key={`skeleton-${i}`} className="relative mb-4 break-inside-avoid">
                <div className="skeleton h-64 w-full rounded-lg bg-[#222]"></div>
            </div>
        ))}
    </>
);

const needsFlipButton = (artifact: OrdUtxo): boolean => {
    const contentType = artifact.origin?.data?.insc?.file.type || '';
    return contentType.startsWith('video/') ||
           contentType.includes('model/') ||
           contentType.includes('gltf') ||
           contentType.startsWith('audio/');
};

const shouldAllowScroll = (artifact: OrdUtxo): boolean => {
    const contentType = artifact.origin?.data?.insc?.file.type || '';
    // Only images and text types allow scrolling
    // Videos, audio, 3D models must fit within container
    return contentType.startsWith('image/') ||
           contentType.startsWith('text/') ||
           contentType.includes('html');
};

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
    const [mounted, setMounted] = useState(false);
    const [selectedArtifact, setSelectedArtifact] = useState<OrdUtxo | null>(null);
    const [showBackdrop, setShowBackdrop] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
        setMounted(true);
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

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setScrollStart({
            x: scrollContainerRef.current.scrollLeft,
            y: scrollContainerRef.current.scrollTop
        });
        e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        scrollContainerRef.current.scrollLeft = scrollStart.x - dx;
        scrollContainerRef.current.scrollTop = scrollStart.y - dy;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
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
            const result = await response.json() as { items: OrdUtxo[], nextCursor: number | null };
            console.log(`Received ${result.items.length} items, nextCursor: ${result.nextCursor}, total: ${result.total}`);
            result.items.forEach(item => {
                const outpoint = item.outpoint || `${item.txid}_${item.vout}`;
                seenOutpoints.current.add(outpoint);
            });
            return result;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: 0,
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    const allArtifacts = data?.pages.flatMap(page => page.items) || [];
    const seen = new Set<string>();
    const artifacts = allArtifacts.filter(artifact => {
        if (!artifact?.outpoint) return false;
        if (!artifact.origin?.outpoint) return false;
        if (seen.has(artifact.outpoint)) return false;
        seen.add(artifact.outpoint);
        return true;
    });

    useEffect(() => {
        console.log(`FlowGrid: ${data?.pages.length || 0} pages, ${allArtifacts.length} total artifacts, ${artifacts.length} after dedup, hasNextPage: ${hasNextPage}`);
    }, [data?.pages.length, allArtifacts.length, artifacts.length, hasNextPage]);

    useEffect(() => {
        for (const artifact of artifacts) {
            if (!visible.has(artifact.outpoint)) {
                setVisible(prev => new Map(prev).set(artifact.outpoint, false));
            }
        }
        return () => {
            observers.current.forEach(observer => observer.disconnect());
        };
    }, [artifacts, visible]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !mounted) return;

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
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, mounted]);

    return (
        <>
        <div className={`relative text-center ${className}`}>
            <div className='columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4'>
                {!mounted || artifacts.length === 0 ? (
                    <LoadingSkeleton count={20} />
                ) : (
                    <>
                        {artifacts.map((artifact) => {
                            const src = `https://ordfs.network/${artifact.origin?.outpoint}`;
                            const isInModal = selectedArtifact?.outpoint === artifact.outpoint;
                            const contentType = getContentType(artifact);
                            const imgSrc = contentType === 'image' ? `https://res.cloudinary.com/tonicpow/image/fetch/c_pad,b_rgb:111111,g_center,w_${375}/f_auto/${src}` : src;

                            return (
                                <Link href={`/outpoint/${artifact?.outpoint}/listing`} key={artifact.outpoint}>
                                    <div
                                        className={`relative mb-4 break-inside-avoid group ${visible.get(artifact.outpoint) ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
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
                                                    style={{
                                                        viewTransitionName: `artifact-${artifact.outpoint}`
                                                    } as React.CSSProperties}
                                                    ref={(el) => {
                                                        if (!el) return;
                                                        observeImage(el as any, artifact)
                                                    }}
                                                />
                                            ) : contentType === '3d' ? (
                                                <div
                                                    className='w-full aspect-square rounded-lg bg-gradient-to-br from-purple-900/30 to-blue-900/30 flex items-center justify-center'
                                                    style={{
                                                        viewTransitionName: `artifact-${artifact.outpoint}`
                                                    } as React.CSSProperties}
                                                >
                                                    <Box className="w-24 h-24 text-purple-300/50" />
                                                </div>
                                            ) : contentType === 'audio' ? (
                                                <div
                                                    className='w-full aspect-square rounded-lg bg-gradient-to-br from-pink-900/30 to-orange-900/30 flex items-center justify-center'
                                                    style={{
                                                        viewTransitionName: `artifact-${artifact.outpoint}`
                                                    } as React.CSSProperties}
                                                >
                                                    <Music className="w-24 h-24 text-pink-300/50" />
                                                </div>
                                            ) : (
                                                <img
                                                    src={imgSrc}
                                                    alt={`Image ${artifact.txid}`}
                                                    className='w-full h-auto rounded-lg'
                                                    width={375}
                                                    style={{
                                                        viewTransitionName: `artifact-${artifact.outpoint}`
                                                    } as React.CSSProperties}
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

        {selectedArtifact && (() => {
            const requiresFlipButton = needsFlipButton(selectedArtifact);
            const allowScroll = shouldAllowScroll(selectedArtifact);
            const ordinalName = selectedArtifact.data?.map?.name || selectedArtifact.origin?.data?.map?.name;
            return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity duration-300"
                style={{
                    opacity: showBackdrop ? 1 : 0,
                    viewTransitionName: 'none'
                } as React.CSSProperties}
                onClick={closeModal}
            >
                <div
                    className="relative flex flex-col w-[90vw] h-[96vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-2 shrink-0">
                        <p className="text-sm font-medium text-white/90 truncate">
                            {ordinalName || '\u00A0'}
                        </p>
                        <ButtonGroup>
                            {selectedArtifact.data?.list?.price && (
                                <Button
                                    variant="secondary"
                                    size="iconSm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowBuyModal(true);
                                    }}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="iconSm"
                                onClick={() => window.open(`https://ordfs.network/${selectedArtifact.origin?.outpoint}`, '_blank', 'noopener,noreferrer')}
                            >
                                <SquareArrowOutUpRight className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="iconSm"
                                onClick={closeModal}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </ButtonGroup>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className={`shadow-2xl bg-[#111] rounded-lg flex-1 ${allowScroll ? 'grid place-items-center overflow-auto' : 'flex items-center justify-center overflow-hidden'}`}
                        onMouseDown={allowScroll ? handleMouseDown : undefined}
                        onMouseMove={allowScroll ? handleMouseMove : undefined}
                        onMouseUp={allowScroll ? handleMouseUp : undefined}
                        onMouseLeave={allowScroll ? handleMouseUp : undefined}
                        style={{
                            cursor: allowScroll ? (isDragging ? 'grabbing' : 'grab') : 'default'
                        } as React.CSSProperties}
                    >
                        {requiresFlipButton ? (
                            <Artifact
                                artifact={selectedArtifact}
                                size={800}
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                                showFooter={false}
                                showListingTag={false}
                                clickToZoom={false}
                                classNames={{
                                    wrapper: allowScroll ? "" : "max-w-full max-h-full w-full h-full",
                                    media: allowScroll ? "max-w-full h-auto object-contain" : "max-w-full max-h-full w-full h-full object-contain"
                                }}
                                style={{
                                    viewTransitionName: `artifact-${selectedArtifact.outpoint}`
                                } as React.CSSProperties}
                            />
                        ) : (
                            <img
                                src={`https://ordfs.network/${selectedArtifact.origin?.outpoint}`}
                                alt="Full size artifact"
                                className="max-w-full h-auto select-none"
                                draggable={false}
                                style={{
                                    viewTransitionName: `artifact-${selectedArtifact.outpoint}`
                                } as React.CSSProperties}
                            />
                        )}
                    </div>
                </div>
            </div>
            );
        })()}

        {selectedArtifact && showBuyModal && selectedArtifact.data?.list?.price && (() => {
            const requiresFlipButton = needsFlipButton(selectedArtifact);
            return (
                <BuyArtifactModal
                    listing={selectedArtifact}
                    onClose={() => setShowBuyModal(false)}
                    price={BigInt(Math.ceil(selectedArtifact.data.list.price))}
                    content={
                        requiresFlipButton ? (
                            <Artifact
                                artifact={selectedArtifact}
                                size={400}
                                sizes="400px"
                                showFooter={false}
                                showListingTag={false}
                                clickToZoom={false}
                                classNames={{
                                    wrapper: "",
                                    media: "max-w-full h-auto object-contain"
                                }}
                            />
                        ) : (
                            <img
                                src={`https://ordfs.network/${selectedArtifact.origin?.outpoint}`}
                                alt="Artifact preview"
                                className="w-full h-auto object-contain"
                            />
                        )
                    }
                    showLicense={true}
                />
            );
        })()}
        </>
    );
};

export default FlowGrid;
