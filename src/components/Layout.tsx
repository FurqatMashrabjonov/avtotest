import { Outlet } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useReview } from "@/store/useReview";
import { useTheme } from "@/store/useTheme";
import { isDue } from "@/lib/fsrs";

export function Layout() {
  const cards = useReview((s) => s.cards);
  const dueCount = Object.values(cards).filter((c) => isDue(c)).length;
  const { dark, toggle } = useTheme();

  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b-2 border-line">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-extrabold text-lg text-grass-dark">AvtoTest</span>
          <div className="flex items-center gap-3">
            {dueCount > 0 && (
              <span className="rounded-full bg-fox/15 text-fox px-3 py-1 text-sm font-extrabold">
                {dueCount} ta takrorlash
              </span>
            )}
            <button
              onClick={toggle}
              aria-label="Mavzu almashtirish"
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-line text-faint hover:bg-muted"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-xl mx-auto px-4">
        <Outlet />
      </div>
      <BottomNav dueCount={dueCount} />
    </div>
  );
}
