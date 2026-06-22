import { useNavigate } from "react-router-dom";
import { CheckCircle2, CalendarClock } from "lucide-react";
import { categories, questionsByCategory } from "@/lib/data";
import { useGame } from "@/store/useGame";
import { useReview, catKey } from "@/store/useReview";
import { isDue } from "@/lib/fsrs";
import { cn } from "@/lib/utils";

export default function Topics() {
  const nav = useNavigate();
  const solved = useGame((s) => s.solvedIds);
  const cards = useReview((s) => s.cards);
  const solvedSet = new Set(solved);

  return (
    <div className="pb-6">
      <h1 className="pt-5 text-2xl font-extrabold">Mavzular</h1>
      <p className="text-wolf font-semibold">{categories.length} ta mavzu bo'yicha mashq.</p>

      <div className="mt-4 grid gap-2.5">
        {categories.map((c) => {
          const qs = questionsByCategory(c.id);
          if (!qs.length) return null;
          const card = cards[catKey(c.id)];
          const due = isDue(card);
          const done = qs.filter((q) => solvedSet.has(q.id)).length;
          const pct = Math.round((done / qs.length) * 100);
          const complete = done === qs.length;
          return (
            <button
              key={c.id}
              onClick={() => nav(`/quiz/category/${c.id}`)}
              className={cn(
                "btn-3d rounded-2xl border-2 bg-white p-3.5 flex items-center gap-3 text-left hover:bg-polar",
                due ? "border-fox" : "border-swan"
              )}
            >
              <div
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-xl font-extrabold text-white",
                  complete ? "bg-grass" : due ? "bg-fox" : "bg-sky"
                )}
              >
                {complete ? <CheckCircle2 className="h-6 w-6" /> : c.order}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold leading-tight line-clamp-2">{c.name}</div>
                <div className="mt-1 h-2 w-full rounded-full bg-swan overflow-hidden">
                  <div className="h-full rounded-full bg-grass transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {due ? (
                <span className="text-[11px] font-extrabold text-fox shrink-0 flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" /> Takror
                </span>
              ) : (
                <span className="text-xs font-bold text-wolf shrink-0">{done}/{qs.length}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
