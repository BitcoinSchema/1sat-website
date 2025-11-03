"use client";

import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import type { OrdUtxo } from "@/types/ordinals";
import Artifact from "@/components/artifact";
import ArtifactModal from "@/components/modal/artifactModal";

interface ArtifactViewerProps {
    artifact: OrdUtxo;
    size?: number;
    className?: string;
}

const ArtifactViewer = ({ artifact, size = 550, className = "" }: ArtifactViewerProps) => {
    const [selectedArtifact, setSelectedArtifact] = useState<OrdUtxo | null>(null);
    const [showBackdrop, setShowBackdrop] = useState(false);

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

            <ArtifactModal
                artifact={selectedArtifact}
                showBackdrop={showBackdrop}
                onClose={closeModal}
            />
        </>
    );
};

export default ArtifactViewer;
