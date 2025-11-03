"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { OrdUtxo } from "@/types/ordinals";
import { SquareArrowOutUpRight, X, ShoppingCart, Info } from "lucide-react";
import Artifact from "@/components/artifact";
import BuyArtifactModal from "@/components/modal/buyArtifact";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const needsFlipButton = (artifact: OrdUtxo): boolean => {
    const contentType = artifact.origin?.data?.insc?.file.type || '';
    return contentType.startsWith('video/') ||
           contentType.includes('model/') ||
           contentType.includes('gltf') ||
           contentType.startsWith('audio/') ||
           contentType.startsWith('text/') ||
           contentType.includes('html');
};

const shouldAllowScroll = (artifact: OrdUtxo): boolean => {
    const contentType = artifact.origin?.data?.insc?.file.type || '';
    return contentType.startsWith('image/') ||
           contentType.startsWith('text/') ||
           contentType.includes('html');
};

interface ArtifactModalProps {
    artifact: OrdUtxo | null;
    showBackdrop: boolean;
    onClose: () => void;
}

const ArtifactModal = ({ artifact, showBackdrop, onClose }: ArtifactModalProps) => {
    const router = useRouter();
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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

    if (!artifact) return null;

    const requiresFlipButton = needsFlipButton(artifact);
    const allowScroll = shouldAllowScroll(artifact);
    const ordinalName = artifact.data?.map?.name || artifact.origin?.data?.map?.name;

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity duration-300"
                style={{
                    opacity: showBackdrop ? 1 : 0,
                    viewTransitionName: 'none'
                } as React.CSSProperties}
                onClick={onClose}
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
                            {artifact.data?.list && artifact.data.list.price && (
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
                                onClick={() => router.push(`/outpoint/${artifact.origin?.outpoint}`)}
                            >
                                <Info className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="iconSm"
                                onClick={() => window.open(`https://ordfs.network/${artifact.origin?.outpoint}`, '_blank', 'noopener,noreferrer')}
                            >
                                <SquareArrowOutUpRight className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="iconSm"
                                onClick={onClose}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </ButtonGroup>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className={`shadow-2xl bg-[#111] rounded-lg flex-1 flex ${allowScroll ? 'items-start overflow-auto' : 'items-center overflow-hidden'} justify-center`}
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
                                artifact={artifact}
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                                showFooter={false}
                                showListingTag={false}
                                clickToZoom={false}
                                classNames={{
                                    wrapper: "w-full h-full",
                                    media: "w-full h-full"
                                }}
                            />
                        ) : (
                            <div className={allowScroll ? "flex items-center justify-center min-h-full w-full" : "contents"}>
                                <img
                                    src={`https://ordfs.network/${artifact.origin?.outpoint}`}
                                    alt="Full size artifact"
                                    className={allowScroll ? "w-auto h-auto select-none" : "max-w-full max-h-full object-contain select-none"}
                                    draggable={false}
                                    style={{
                                        viewTransitionName: `artifact-${artifact.outpoint}`
                                    } as React.CSSProperties}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showBuyModal && artifact.data?.list?.price && (
                <BuyArtifactModal
                    listing={artifact}
                    onClose={() => setShowBuyModal(false)}
                    price={BigInt(Math.ceil(artifact.data.list.price))}
                    content={
                        requiresFlipButton ? (
                            <Artifact
                                artifact={artifact}
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
                                src={`https://ordfs.network/${artifact.origin?.outpoint}`}
                                alt="Artifact preview"
                                className="w-full h-auto object-contain"
                            />
                        )
                    }
                    showLicense={true}
                />
            )}
        </>
    );
};

export default ArtifactModal;
