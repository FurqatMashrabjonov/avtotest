import { create } from "zustand";

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("avtotest-theme", dark ? "dark" : "light");
  } catch {
    /* ignore */
  }
}

const initial =
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  dark: initial,
  toggle: () => {
    const dark = !get().dark;
    apply(dark);
    set({ dark });
  },
}));
