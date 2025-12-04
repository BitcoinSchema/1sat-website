"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchThemeByOrigin,
  applyThemeMode,
  clearTheme,
  type ThemeToken,
} from "@theme-token/sdk";

interface OrdinalWithMap {
  origin: string;
  map?: { app?: string };
}

interface UseThemeTokenReturn {
  /** ThemeToken ordinals found in the provided list */
  themeTokens: OrdinalWithMap[];
  /** Currently active theme, if any */
  activeTheme: ThemeToken | null;
  /** Origin of the currently active theme */
  activeOrigin: string | null;
  /** Load and apply a theme by origin */
  loadTheme: (origin: string) => Promise<void>;
  /** Reset to default theme (clear applied theme) */
  resetTheme: () => void;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Hook for detecting and applying ThemeToken ordinals.
 *
 * @param ordinals - Array of ordinals to filter for ThemeTokens
 * @returns Object with theme management functions and state
 *
 * @example
 * ```tsx
 * const { themeTokens, loadTheme, resetTheme, activeTheme } = useThemeToken(userOrdinals);
 *
 * return (
 *   <div>
 *     {themeTokens.map(t => (
 *       <button key={t.origin} onClick={() => loadTheme(t.origin)}>
 *         Apply Theme
 *       </button>
 *     ))}
 *     {activeTheme && <button onClick={resetTheme}>Reset to Default</button>}
 *   </div>
 * );
 * ```
 */
export function useThemeToken(
  ordinals: OrdinalWithMap[] = []
): UseThemeTokenReturn {
  const [activeTheme, setActiveTheme] = useState<ThemeToken | null>(null);
  const [activeOrigin, setActiveOrigin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Filter for ThemeToken ordinals
  const themeTokens = ordinals.filter((o) => o.map?.app === "ThemeToken");

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("selected-theme-origin");
    if (saved) {
      loadTheme(saved);
    }
  }, []);

  const loadTheme = useCallback(async (origin: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const published = await fetchThemeByOrigin(origin);
      if (published) {
        const mode = document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
        applyThemeMode(published.theme, mode);
        setActiveTheme(published.theme);
        setActiveOrigin(origin);
        localStorage.setItem("selected-theme-origin", origin);
      } else {
        throw new Error(`Theme not found for origin: ${origin}`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Failed to load theme:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetTheme = useCallback(() => {
    clearTheme();
    setActiveTheme(null);
    setActiveOrigin(null);
    localStorage.removeItem("selected-theme-origin");
  }, []);

  return {
    themeTokens,
    activeTheme,
    activeOrigin,
    loadTheme,
    resetTheme,
    isLoading,
    error,
  };
}
