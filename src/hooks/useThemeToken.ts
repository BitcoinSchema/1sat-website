"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  fetchThemeByOrigin,
  applyThemeMode,
  clearTheme,
  type ThemeToken,
} from "@theme-token/sdk";

const THEME_ORIGIN_KEY = "1sat-theme-origin";

export interface UseThemeTokenResult {
  activeTheme: ThemeToken | null;
  activeOrigin: string | null;
  isLoading: boolean;
  loadTheme: (origin: string) => Promise<boolean>;
  resetTheme: () => void;
}

export function useThemeToken(): UseThemeTokenResult {
  const { resolvedTheme } = useTheme();
  const [activeTheme, setActiveTheme] = useState<ThemeToken | null>(null);
  const [activeOrigin, setActiveOrigin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(THEME_ORIGIN_KEY);
    if (saved) {
      loadThemeInternal(saved);
    }
  }, []);

  // Re-apply theme when light/dark mode changes
  useEffect(() => {
    if (activeTheme && resolvedTheme) {
      const mode = resolvedTheme === "dark" ? "dark" : "light";
      applyThemeMode(activeTheme, mode);
    }
  }, [resolvedTheme, activeTheme]);

  const loadThemeInternal = async (origin: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const published = await fetchThemeByOrigin(origin);
      if (published?.theme) {
        const mode = document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
        applyThemeMode(published.theme, mode);
        setActiveTheme(published.theme);
        setActiveOrigin(origin);
        localStorage.setItem(THEME_ORIGIN_KEY, origin);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to load theme:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadTheme = useCallback(async (origin: string): Promise<boolean> => {
    return loadThemeInternal(origin);
  }, []);

  const resetTheme = useCallback(() => {
    clearTheme();
    setActiveTheme(null);
    setActiveOrigin(null);
    localStorage.removeItem(THEME_ORIGIN_KEY);
  }, []);

  return {
    activeTheme,
    activeOrigin,
    isLoading,
    loadTheme,
    resetTheme,
  };
}

