import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, CheckCircle2, ClipboardList, Layers, CalendarClock } from "lucide-react";
import { categories, questionsByCategory, testBlocks } from "@/lib/data";
import { useGame } from "@/store/useGame";
import { useReview, testKey, catKey } from "@/store/useReview";
import { isDue, dueLabel } from "@/lib/fsrs";
import { cn } from "@/lib/utils";

type Tab = "tests" | "topics";

export default function Home() {
  const nav = useNavigate();
  const mistakeIds = useGame((s) => s.mistakeIds);
  const solved = useGame((s) => s.solvedIds);
  const cards = useReview((s) => s.cards);
  const solvedSet = new Set(solved);
  const [tab, setTab] = useState<Tab>("tests");

  // count due (test + topic) cards
  const dueCount = Object.values(cards).filter((c) => isDue(c)).length;

  return (
    <div className="max-w-xl mx-auto px-4 pb-16">
      {/* sticky header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur flex items-center justify-between py-3 border-b-2 border-swan">
        <span className="font-extrabold text-lg text-grass-dark">AvtoTest</span>
        {dueCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-fox/15 text-fox px-3 py-1 text-sm font-extrabold">
            <CalendarClock className="h-4 w-4" /> {dueCount} ta takrorlash
          </span>
        )}
      </header>

      <div className="pt-6">
        <h1 className="text-2xl font-extrabold">Salom! 👋</h1>
        <p className="text-wolf font-semibold">Haydovchilik guvohnomasi testlarini mashq qiling.</p>
      </div>

      {/* mistakes (only if any) */}
      {!!mistakeIds.length && (
        <button
          onClick={() => nav("/quiz/mistakes")}
          className="btn-3d mt-5 w-full rounded-2xl border-2 border-cardinal-dark bg-cardinal text-white p-4 flex items-center gap-4 text-left"
        >
          <AlertTriangle className="h-8 w-8 shrink-0" />
          <div className="flex-1">
            <div className="font-extrabold text-lg">Xatolar ustida ish</div>
            <div className="text-sm font-semibold opacity-90">{mistakeIds.length} ta xato savol</div>
          </div>
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* tabs */}
      <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-polar border-2 border-swan">
        <TabBtn active={tab === "tests"} onClick={() => setTab("tests")} icon={<ClipboardList className="h-5 w-5" />}>
          Testlar
        </TabBtn>
        <TabBtn active={tab === "topics"} onClick={() => setTab("topics")} icon={<Layers className="h-5 w-5" />}>
          Mavzular
        </TabBtn>
      </div>

      {tab === "tests" ? (
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {testBlocks.map((block, i) => {
            const n = i + 1;
            const card = cards[testKey(n)];
            const done = block.filter((q) => solvedSet.has(q.id)).length;
            const complete = done === block.length;
            const pct = Math.round((done / block.length) * 100);
            return (
              <CardTile
                key={n}
                badge={complete ? <CheckCircle2 className="h-6 w-6" /> : n}
                complete={complete}
                due={isDue(card)}
                title={`${n}-test`}
                pct={pct}
                sub={card ? dueLabel(card) : `${done}/${block.length}`}
                onClick={() => nav(`/quiz/test/${n}`)}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5">
          {categories.map((c) => {
            const qs = questionsByCategory(c.id);
            if (!qs.length) return null;
            const card = cards[catKey(c.id)];
            const done = qs.filter((q) => solvedSet.has(q.id)).length;
            const pct = Math.round((done / qs.length) * 100);
            const complete = done === qs.length;
            return (
              <button
                key={c.id}
                onClick={() => nav(`/quiz/category/${c.id}`)}
                className="btn-3d rounded-2xl border-2 border-swan bg-white p-3.5 flex items-center gap-3 text-left hover:bg-polar"
              >
                <div
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-xl font-extrabold text-white",
                    complete ? "bg-grass" : "bg-sky"
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
                {isDue(card) ? (
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
      )}

      <p className="text-center text-xs text-wolf font-semibold mt-10">
        Ma'lumotlar manbai: tezkoravtotest.uz
      </p>
    </div>
  );
}

function CardTile({
  badge,
  complete,
  due,
  title,
  pct,
  sub,
  onClick,
}: {
  badge: React.ReactNode;
  complete: boolean;
  due: boolean;
  title: string;
  pct: number;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "btn-3d rounded-2xl border-2 bg-white p-3 flex items-center gap-3 text-left hover:bg-polar",
        due ? "border-fox" : "border-swan"
      )}
    >
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl font-extrabold text-white",
          complete ? "bg-grass" : due ? "bg-fox" : "bg-sky"
        )}
      >
        {badge}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold leading-tight">{title}</div>
        <div className="mt-1 h-2 w-full rounded-full bg-swan overflow-hidden">
          <div className="h-full rounded-full bg-grass transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className={cn("text-[11px] font-bold mt-0.5", due ? "text-fox" : "text-wolf")}>{sub}</div>
      </div>
    </button>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl py-2.5 font-extrabold transition",
        active ? "bg-white text-grass-dark shadow-sm" : "text-wolf"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
