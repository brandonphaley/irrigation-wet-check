import { useEffect, useState } from "react";
import type { ThemeName } from "../types";

const KEY = "ssc-wet-check-theme";

export const THEMES: { value: ThemeName; label: string }[] = [
  { value: "util", label: "Utilitarian" },
  { value: "friendly", label: "Friendly modern" },
  { value: "sun", label: "Sun-readable" },
  { value: "dark", label: "Dark mode" },
];

function read(): ThemeName {
  const v = localStorage.getItem(KEY) as ThemeName | null;
  return v && THEMES.some((t) => t.value === v) ? v : "util";
}

/** Theme choice persisted to localStorage (a UI preference, not inspection data). */
export function useTheme(): [ThemeName, (t: ThemeName) => void] {
  const [theme, setThemeState] = useState<ThemeName>(read);

  useEffect(() => {
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return [theme, setThemeState];
}
