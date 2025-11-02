"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import type { OrdUtxo } from "@/types/ordinals";
import { SquareArrowOutUpRight, X, ShoppingCart } from "lucide-react";
import Artifact from "@/components/artifact";
import BuyArtifactModal from "@/components/modal/buyArtifact";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const needsFlipButton = (artifact: OrdUtxo): boolean => {
    const contentType = artifact.origin?.data?.insc?.file.type || '';
    return contentType.startsWith('video/') ||
           contentType.includes('model/') ||
           contentType.includes('gltf') ||
           contentType.startsWith('audio/');
};

const shouldAllowScroll = (artifact: OrdUtxo): boolean => {
    const contentType = artifact.origin?.data?.insc?.file.type || '';
    return contentType.startsWith('image/') ||
           contentType.startsWith('text/') ||
           contentType.includes('html');
};

interface ArtifactViewerProps {
    artifact: OrdUtxo;
    size?: number;
    className?: string;
}

const ArtifactViewer = ({ artifact, size = 550, className = "" }: ArtifactViewerProps) => {
    const [selectedArtifact, setSelectedArtifact] = useState<OrdUtxo | null>(null);
    const [showBackdrop, setShowBackdrop] = useState(false);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedArtifact) {
                closeModal();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [selectedArtifact]);

    const handleClick = (e: React.MouseEvent) => {
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

    return (
        <>
            <div className={`relative ${className}`}>
                <Artifact
                    artifact={artifact}
                    size={size}
                    sizes="(max-width: 768px) 100vw, 550px"
                    showFooter={false}
                    showListingTag={false}
                    glow={true}
                    classNames={{
                        wrapper: "bg-transparent border-0",
                        media: "bg-[#111] text-center p-0",
                    }}
                />
                <div
                    className="absolute inset-0 cursor-pointer z-10"
                    onClick={handleClick}
                    aria-label="Open full screen view"
                />
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
                                    {selectedArtifact.data?.list && selectedArtifact.data.list.price && (
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

export default ArtifactViewer;
