"use client";

import Artifact from "@/components/artifact";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  isThemeToken,
  selectedOutpoints,
  toggleSelection,
} from "@/signals/wallet/selection";
import type { OrdUtxo } from "@/types/ordinals";
import { useSignals } from "@preact/signals-react/runtime";
import { ExternalLink, Palette, Send, Tag } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface OrdinalCardProps {
  ord: OrdUtxo;
  onApplyTheme?: (ord: OrdUtxo) => void;
  onClick?: (outpoint: string) => void;
}

export const OrdinalCard = ({
  ord,
  onApplyTheme,
  onClick,
}: OrdinalCardProps) => {
  useSignals();

  const outpoint = ord.outpoint;
  const isSelected = selectedOutpoints.value.has(outpoint);
  const isTheme = isThemeToken(ord);
  const fileType =
    ord.origin?.data?.insc?.file?.type?.split("/")?.[1]?.toUpperCase() ||
    "FILE";
  const inscNum = ord.origin?.num || ord.origin?.inum || "PENDING";

  // Long press support for mobile
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSelection(outpoint);
  };

  const handleApplyTheme = useCallback(() => {
    onApplyTheme?.(ord);
  }, [onApplyTheme, ord]);

  const handleViewDetails = useCallback(() => {
    window.location.href = `/outpoint/${outpoint}`;
  }, [outpoint]);

  // Long press handlers for mobile context menu
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Reset long press state after a short delay
    setTimeout(() => setIsLongPress(false), 100);
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const cardContent = (
    <Card
      className={`
        relative overflow-hidden rounded-lg border-2 transition-all duration-200 bg-card
        ${
          isSelected
            ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.15)]"
            : isTheme
              ? "border-border hover:border-purple-500/50"
              : "border-border hover:border-primary/50"
        }
      `}
    >
      {/* Selection Checkbox - Visible on hover or selected */}
      <div
        className={`absolute top-2 left-2 z-20 transition-opacity duration-200 ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        onClick={handleCheckboxChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSelection(outpoint);
          }
        }}
      >
        <div className="bg-background/80 p-0.5 rounded-sm backdrop-blur-sm">
          <Checkbox
            checked={isSelected}
            className="rounded-sm border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5"
          />
        </div>
      </div>

      {/* Theme Indicator Badge */}
      {isTheme && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="rounded-sm bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30 font-mono text-[10px] uppercase">
            THEME
          </Badge>
        </div>
      )}

      {/* Content Area */}
      <CardContent className="p-0 aspect-square bg-muted relative flex items-center justify-center overflow-hidden">
        <Artifact
          artifact={ord}
          to={onClick ? undefined : `/outpoint/${outpoint}`}
          onClick={onClick ? () => onClick(outpoint) : undefined}
          classNames={{
            wrapper: "w-full h-full",
            media: "object-cover",
          }}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          size={200}
          showFooter={false}
          priority={false}
        />
      </CardContent>

      {/* Footer Info */}
      <CardFooter className="flex flex-col items-start gap-2 p-3 border-t border-border bg-card">
        <div className="flex w-full justify-between items-center">
          <span className="font-mono text-xs text-muted-foreground truncate max-w-[100px]">
            #{inscNum}
          </span>
          <Badge
            variant="outline"
            className="rounded-sm text-[10px] text-muted-foreground border-border uppercase"
          >
            {fileType}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="group relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          data-long-press={isLongPress}
        >
          {cardContent}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {isTheme && onApplyTheme && (
          <>
            <ContextMenuItem
              onClick={handleApplyTheme}
              className="text-purple-400 focus:text-purple-300 focus:bg-purple-900/20"
            >
              <Palette className="w-4 h-4 mr-2" />
              Apply Theme
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={handleViewDetails}>
          <ExternalLink className="w-4 h-4 mr-2" />
          View Details
        </ContextMenuItem>
        <ContextMenuItem disabled>
          <Send className="w-4 h-4 mr-2" />
          Send
        </ContextMenuItem>
        <ContextMenuItem disabled>
          <Tag className="w-4 h-4 mr-2" />
          List for Sale
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default OrdinalCard;
