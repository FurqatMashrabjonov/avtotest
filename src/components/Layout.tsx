import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useReview } from "@/store/useReview";
import { isDue } from "@/lib/fsrs";

export function Layout() {
  const cards = useReview((s) => s.cards);
  const dueCount = Object.values(cards).filter((c) => isDue(c)).length;

  return (
    <div className="min-h-dvh pb-20">
      <div className="max-w-xl mx-auto px-4">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur flex items-center justify-between py-3 border-b-2 border-swan">
          <span className="font-extrabold text-lg text-grass-dark">AvtoTest</span>
          {dueCount > 0 && (
            <span className="rounded-full bg-fox/15 text-fox px-3 py-1 text-sm font-extrabold">
              {dueCount} ta takrorlash
            </span>
          )}
        </header>
        <Outlet />
      </div>
      <BottomNav dueCount={dueCount} />
    </div>
  );
}
