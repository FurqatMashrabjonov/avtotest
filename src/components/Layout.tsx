import { useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { TG } from "@/lib/telegram";
import { useTelegramSync } from "@/hooks/useTelegramSync";

export function Layout() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const backCb = useRef(() => nav("/"));

  useEffect(() => {
    TG.ready();
    TG.expand();
    TG.applyTheme();
    const wa = window.Telegram?.WebApp;
    if (wa) wa.onEvent("themeChanged", TG.applyTheme);
    return () => { if (wa) wa.offEvent("themeChanged", TG.applyTheme); };
  }, []);

  // TG back button: show on sub-pages, hide on home
  useEffect(() => {
    const cb = backCb.current;
    if (isHome) {
      TG.hideBack(cb);
    } else {
      TG.showBack(cb);
    }
    return () => { TG.hideBack(cb); };
  }, [isHome]);

  useTelegramSync();

  return (
    <div className="min-h-dvh max-w-xl mx-auto px-4 pb-8">
      <Outlet />
    </div>
  );
}
