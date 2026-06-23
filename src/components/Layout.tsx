import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, ArrowLeft } from "lucide-react";
import { useTheme } from "@/store/useTheme";
import { TG } from "@/lib/telegram";
import { useTelegramSync } from "@/hooks/useTelegramSync";

export function Layout() {
  const { dark, toggle } = useTheme();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  useEffect(() => {
    TG.ready();
    TG.expand();
    TG.applyTheme();
    TG.hideBack();
    const wa = window.Telegram?.WebApp;
    if (wa) wa.onEvent("themeChanged", TG.applyTheme);
    return () => { if (wa) wa.offEvent("themeChanged", TG.applyTheme); };
  }, []);

  useTelegramSync();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b-2 border-line">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          {!isHome && (
            <button onClick={() => nav("/")} className="text-faint hover:text-fg">
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
          <span className="font-extrabold text-lg text-grass-dark flex-1">AvtoTest</span>
          <button
            onClick={toggle}
            aria-label="Mavzu almashtirish"
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-line text-faint hover:bg-muted"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>
      <div className="max-w-xl mx-auto px-4 pb-8">
        <Outlet />
      </div>
    </div>
  );
}
