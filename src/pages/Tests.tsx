import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, CheckCircle2, CalendarClock } from "lucide-react";
import { testBlocks } from "@/lib/data";
import { useGame } from "@/store/useGame";
import { useReview, testKey } from "@/store/useReview";
import { isDue, dueLabel } from "@/lib/fsrs";
import { cn } from "@/lib/utils";

export default function Tests() {
  const nav = useNavigate();
  const mistakeIds = useGame((s) => s.mistakeIds);
  const solved = useGame((s) => s.solvedIds);
  const cards = useReview((s) => s.cards);
  const solvedSet = new Set(solved);

  return (
    <div className="pb-6">
      <h1 className="pt-5 text-2xl font-extrabold">Testlar</h1>
      <p className="text-faint font-semibold">61 ta test, har birida 20 savol.</p>

      {!!mistakeIds.length && (
        <button
          onClick={() => nav("/quiz/mistakes")}
          className="btn-3d mt-4 w-full rounded-2xl border-2 border-cardinal-dark bg-cardinal text-white p-4 flex items-center gap-4 text-left"
        >
          <AlertTriangle className="h-8 w-8 shrink-0" />
          <div className="flex-1">
            <div className="font-extrabold text-lg">Xatolar ustida ish</div>
            <div className="text-sm font-semibold opacity-90">{mistakeIds.length} ta xato savol</div>
          </div>
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {testBlocks.map((block, i) => {
          const n = i + 1;
          const card = cards[testKey(n)];
          const due = isDue(card);
          const done = block.filter((q) => solvedSet.has(q.id)).length;
          const complete = done === block.length;
          const pct = Math.round((done / block.length) * 100);
          return (
            <button
              key={n}
              onClick={() => nav(`/quiz/test/${n}`)}
              className={cn(
                "btn-3d rounded-2xl border-2 bg-card p-3 flex items-center gap-3 text-left hover:bg-muted",
                due ? "border-fox" : "border-line"
              )}
            >
              <div
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-xl font-extrabold text-white",
                  complete ? "bg-grass" : due ? "bg-fox" : "bg-sky"
                )}
              >
                {complete ? <CheckCircle2 className="h-6 w-6" /> : n}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold leading-tight">{n}-test</div>
                <div className="mt-1 h-2 w-full rounded-full bg-line overflow-hidden">
                  <div className="h-full rounded-full bg-grass transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className={cn("text-[11px] font-bold mt-0.5 flex items-center gap-1", due ? "text-fox" : "text-faint")}>
                  {due && <CalendarClock className="h-3 w-3" />}
                  {card ? dueLabel(card) : `${done}/${block.length}`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
