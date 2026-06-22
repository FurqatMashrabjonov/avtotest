import { useNavigate } from "react-router-dom";
import { CalendarClock, ClipboardList, Layers, AlertCircle } from "lucide-react";
import { categoryById } from "@/lib/data";
import { useReview } from "@/store/useReview";
import { cn } from "@/lib/utils";
import type { StoredCard } from "@/lib/fsrs";

const DAY = 86400000;
const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

interface Item {
  key: string;
  card: StoredCard;
  isTest: boolean;
  num: string;
  title: string;
  route: string;
}

function resolve(key: string, card: StoredCard): Item {
  const [kind, id] = key.split(":");
  if (kind === "test") {
    return { key, card, isTest: true, num: id, title: `${id}-test`, route: `/quiz/test/${id}` };
  }
  const cat = categoryById.get(Number(id));
  return {
    key,
    card,
    isTest: false,
    num: String(cat?.order ?? "?"),
    title: cat?.name ?? "Mavzu",
    route: `/quiz/category/${id}`,
  };
}

function dayLabel(ms: number, today: number): string {
  if (ms <= today) return "Bugun";
  if (ms === today + DAY) return "Ertaga";
  return new Date(ms).toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" });
}

export default function Calendar() {
  const nav = useNavigate();
  const cards = useReview((s) => s.cards);

  const today = startOfDay(Date.now());
  const items = Object.entries(cards).map(([key, card]) => resolve(key, card));

  if (!items.length) {
    return (
      <div className="pt-20 text-center px-6">
        <CalendarClock className="h-16 w-16 mx-auto text-swan" />
        <h1 className="mt-4 text-xl font-extrabold">Kalendar bo'sh</h1>
        <p className="text-wolf font-semibold mt-1">
          Test yoki mavzu topshiring — FSRS keyingi takrorlash sanasini belgilaydi.
        </p>
      </div>
    );
  }

  // bucket by day; overdue merged into today
  const buckets = new Map<number, Item[]>();
  for (const it of items) {
    let day = startOfDay(new Date(it.card.due).getTime());
    if (day < today) day = today;
    if (!buckets.has(day)) buckets.set(day, []);
    buckets.get(day)!.push(it);
  }
  const days = [...buckets.keys()].sort((a, b) => a - b);
  const overdueCount = items.filter((it) => new Date(it.card.due).getTime() <= Date.now()).length;

  return (
    <div className="pb-6">
      <h1 className="pt-5 text-2xl font-extrabold">Kalendar</h1>
      <p className="text-wolf font-semibold">Qaysi testni qachon takrorlash kerak.</p>

      {overdueCount > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-fox bg-fox/10 px-4 py-3 flex items-center gap-2 font-extrabold text-fox">
          <AlertCircle className="h-5 w-5" /> Bugun {overdueCount} ta takrorlash kerak
        </div>
      )}

      <div className="mt-5 space-y-6">
        {days.map((day) => {
          const list = buckets.get(day)!.sort((a, b) => +new Date(a.card.due) - +new Date(b.card.due));
          const isToday = day === today;
          return (
            <div key={day}>
              <div className={cn("text-sm font-extrabold uppercase tracking-wide mb-2", isToday ? "text-fox" : "text-wolf")}>
                {dayLabel(day, today)}
              </div>
              <div className="grid gap-2">
                {list.map((it) => (
                  <button
                    key={it.key}
                    onClick={() => nav(it.route)}
                    className={cn(
                      "btn-3d rounded-2xl border-2 bg-white p-3 flex items-center gap-3 text-left hover:bg-polar",
                      isToday ? "border-fox" : "border-swan"
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl font-extrabold text-white",
                        isToday ? "bg-fox" : "bg-sky"
                      )}
                    >
                      {it.isTest ? <ClipboardList className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold leading-tight line-clamp-2">{it.title}</div>
                      <div className="text-[11px] font-semibold text-wolf">
                        {it.isTest ? "Test" : "Mavzu"} · {Math.round(it.card.stability)} kun barqarorlik
                      </div>
                    </div>
                    {isToday && <span className="text-xs font-extrabold text-fox shrink-0">Boshlash</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
