interface TelegramWebApp {
  ready(): void;
  expand(): void;
  colorScheme: "light" | "dark";
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    accent_text_color?: string;
  };
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  HapticFeedback: {
    impactOccurred(style: "light" | "medium" | "heavy"): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };
  CloudStorage: {
    setItem(key: string, value: string, cb?: (e: string | null) => void): void;
    getItem(key: string, cb: (e: string | null, v: string) => void): void;
    getItems(keys: string[], cb: (e: string | null, v: Record<string, string>) => void): void;
    removeItem(key: string, cb?: (e: string | null) => void): void;
    removeItems(keys: string[], cb?: (e: string | null) => void): void;
    getKeys(cb: (e: string | null, k: string[]) => void): void;
  };
  onEvent(ev: string, cb: () => void): void;
  offEvent(ev: string, cb: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const wa = (): TelegramWebApp | undefined => window.Telegram?.WebApp;

export const TG = {
  isAvailable: () => !!wa(),
  ready: () => wa()?.ready(),
  expand: () => wa()?.expand(),
  colorScheme: (): "light" | "dark" => wa()?.colorScheme ?? "light",
  themeParams: () => wa()?.themeParams ?? {},

  // haptic (falls back to navigator.vibrate in browser)
  hapticSuccess: () => {
    wa()?.HapticFeedback?.notificationOccurred("success");
    navigator.vibrate?.(50);
  },
  hapticError: () => {
    wa()?.HapticFeedback?.notificationOccurred("error");
    navigator.vibrate?.([60, 40, 60]);
  },
  hapticSelect: () => {
    wa()?.HapticFeedback?.selectionChanged();
    navigator.vibrate?.(10);
  },

  // back button
  showBack: (cb: () => void) => {
    const bb = wa()?.BackButton;
    if (!bb) return;
    bb.onClick(cb);
    bb.show();
  },
  hideBack: (cb?: () => void) => {
    const bb = wa()?.BackButton;
    if (!bb) return;
    if (cb) bb.offClick(cb);
    bb.hide();
  },

  // CloudStorage helpers
  csSet: (key: string, val: string): Promise<void> =>
    new Promise((res, rej) =>
      wa()?.CloudStorage?.setItem(key, val, (e) => (e ? rej(e) : res())) ?? res()
    ),
  csGet: (keys: string[]): Promise<Record<string, string>> =>
    new Promise((res, rej) =>
      wa()?.CloudStorage?.getItems(keys, (e, v) => (e ? rej(e) : res(v ?? {}))) ?? res({})
    ),
  csRemove: (keys: string[]): Promise<void> =>
    new Promise((res, rej) =>
      wa()?.CloudStorage?.removeItems(keys, (e) => (e ? rej(e) : res())) ?? res()
    ),
  csGetKeys: (): Promise<string[]> =>
    new Promise((res, rej) =>
      wa()?.CloudStorage?.getKeys((e, k) => (e ? rej(e) : res(k ?? []))) ?? res([])
    ),

  // Apply Telegram theme colors as CSS vars (call once on init)
  applyTheme: () => {
    const p = wa()?.themeParams;
    if (!p) return;
    const root = document.documentElement;
    const set = (v: string, val?: string) => val && root.style.setProperty(v, val);
    set("--tg-bg", p.bg_color);
    set("--tg-text", p.text_color);
    set("--tg-hint", p.hint_color);
    set("--tg-link", p.link_color);
    set("--tg-btn", p.button_color);
    set("--tg-btn-text", p.button_text_color);
    set("--tg-secondary-bg", p.secondary_bg_color);
    set("--tg-header-bg", p.header_bg_color);
    // sync dark mode
    const dark = wa()?.colorScheme === "dark";
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("avtotest-theme", dark ? "dark" : "light"); } catch {}
  },
};
