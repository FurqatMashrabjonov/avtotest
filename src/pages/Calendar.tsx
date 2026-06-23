import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ClipboardList, Layers, AlertCircle } from "lucide-react";
import { categoryById } from "@/lib/data";
import { useReview } from "@/store/useReview";
import { useSettings } from "@/store/useSettings";
import { cn } from "@/lib/utils";
import type { StoredCard } from "@/lib/fsrs";

const DAY = 86400000;

const UZ_MONTHS = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr",
];
const UZ_DAYS_SHORT = ["Du","Se","Ch","Pa","Ju","Sh","Ya"];

function sod(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function mondayOf(ms: number) {
  const d = new Date(ms);
  const dow = d.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function sundayOf(ms: number) {
  const d = new Date(ms);
  const dow = d.getDay();
  const diff = dow === 0 ? 0 : 7 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isoDay(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

interface Item {
  key: string;
  card: StoredCard;
  isTest: boolean;
  title: string;
  route: string;
}

function resolve(key: string, card: StoredCard): Item {
  const [kind, id] = key.split(":");
  if (kind === "test") {
    return { key, card, isTest: true, title: `${id}-test`, route: `/quiz/test/${id}` };
  }
  const cat = categoryById.get(Number(id));
  return { key, card, isTest: false, title: cat?.name ?? "Mavzu", route: `/quiz/category/${id}` };
}

function dayLabel(ms: number, today: number): string {
  if (ms <= today) return "Bugun";
  if (ms === today + DAY) return "Ertaga";
  const d = new Date(ms);
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]}`;
}

export default function Calendar() {
  const nav = useNavigate();
  const cards = useReview((s) => s.cards);
  const { examDate } = useSettings();

  const today = sod(Date.now());
  const examMs = examDate ? sod(new Date(examDate).getTime()) : today + 60 * DAY;

  // heatmap range: 4 weeks back → exam day
  const rangeStart = mondayOf(today - 28 * DAY);
  const rangeEnd = sundayOf(examMs);

  // build past map (last_review → count) and future map (due → count)
  const pastMap: Record<string, number> = {};
  const futureMap: Record<string, number> = {};
  for (const card of Object.values(cards)) {
    if (card.last_review) {
      const k = isoDay(new Date(card.last_review).getTime());
      pastMap[k] = (pastMap[k] ?? 0) + 1;
    }
    const dueMs = sod(new Date(card.due).getTime());
    if (dueMs >= today) {
      const k = isoDay(dueMs);
      futureMap[k] = (futureMap[k] ?? 0) + 1;
    }
  }

  // all day slots for grid
  const slots: number[] = [];
  for (let d = rangeStart; d <= rangeEnd; d += DAY) slots.push(d);

  // month label positions: first cell of each new month
  const monthLabels: Record<number, string> = {};
  let lastMonth = -1;
  for (let i = 0; i < slots.length; i++) {
    const d = new Date(slots[i]);
    if (d.getMonth() !== lastMonth) {
      monthLabels[i] = UZ_MONTHS[d.getMonth()];
      lastMonth = d.getMonth();
    }
  }

  const items = Object.entries(cards).map(([k, c]) => resolve(k, c));

  // selected day state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // items for selected / all due
  const displayDay = selectedDay ?? null;
  const buckets = new Map<number, Item[]>();
  for (const it of items) {
    let day = sod(new Date(it.card.due).getTime());
    if (day < today) day = today;
    if (!buckets.has(day)) buckets.set(day, []);
    buckets.get(day)!.push(it);
  }
  const allDays = [...buckets.keys()].sort((a, b) => a - b);
  const overdueCount = items.filter((it) => new Date(it.card.due).getTime() <= Date.now()).length;

  const selectedItems: Item[] = displayDay !== null
    ? (buckets.get(displayDay) ?? [])
    : [];

  function cellColor(ms: number) {
    const k = isoDay(ms);
    const isPast = ms < today;
    if (isPast) {
      const n = pastMap[k] ?? 0;
      if (n === 0) return "bg-line/40";
      if (n === 1) return "bg-grass/50";
      return "bg-grass/90";
    }
    if (ms === today) return ""; // handled separately
    const n = futureMap[k] ?? 0;
    if (n === 0) return "bg-line/20";
    if (n === 1) return "bg-fox/30";
    if (n === 2) return "bg-fox/60";
    return "bg-fox";
  }

  if (!items.length) {
    return (
      <div className="pt-20 text-center px-6">
        <CalendarClock className="h-16 w-16 mx-auto text-line" />
        <h1 className="mt-4 text-xl font-extrabold">Kalendar bo'sh</h1>
        <p className="text-faint font-semibold mt-1">
          Test yoki mavzu topshiring — FSRS keyingi takrorlash sanasini belgilaydi.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <h1 className="pt-5 text-2xl font-extrabold">Kalendar</h1>
      {examDate && (
        <p className="text-sm text-faint font-semibold">
          Imtihonga qadar: {UZ_MONTHS[new Date(examDate).getMonth()]} {new Date(examDate).getDate()}
        </p>
      )}

      {overdueCount > 0 && (
        <div className="mt-3 rounded-2xl border-2 border-fox bg-fox/10 px-4 py-3 flex items-center gap-2 font-extrabold text-fox">
          <AlertCircle className="h-5 w-5" /> Bugun {overdueCount} ta takrorlash kerak
        </div>
      )}

      {/* Heatmap */}
      <div className="mt-4 rounded-2xl border-2 border-line bg-card p-4 overflow-x-auto">
        {/* day-of-week header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {UZ_DAYS_SHORT.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-faint">{d}</div>
          ))}
        </div>

        {/* cells */}
        <div className="grid grid-cols-7 gap-1">
          {slots.map((ms, i) => {
            const k = isoDay(ms);
            const isToday = ms === today;
            const isExam = examDate && ms === sod(new Date(examDate).getTime());
            const isSelected = selectedDay === ms;
            const hasDue = futureMap[k] ?? 0;
            const hadReview = pastMap[k] ?? 0;

            return (
              <button
                key={ms}
                onClick={() => setSelectedDay(isSelected ? null : ms)}
                title={`${new Date(ms).getDate()} ${UZ_MONTHS[new Date(ms).getMonth()]}`}
                className={cn(
                  "aspect-square rounded-md transition-all relative flex items-center justify-center text-[10px] font-bold",
                  isToday
                    ? "bg-grass text-white ring-2 ring-grass ring-offset-1"
                    : isExam
                    ? "bg-cardinal text-white"
                    : cellColor(ms),
                  isSelected && !isToday && !isExam && "ring-2 ring-fg ring-offset-1",
                  // month label: dot above first of month
                )}
              >
                {/* month start dot */}
                {monthLabels[i] && (
                  <span className="absolute -top-3 left-0 text-[9px] font-bold text-faint whitespace-nowrap">
                    {monthLabels[i]}
                  </span>
                )}
                {isToday ? new Date(ms).getDate() :
                 isExam ? "🎯" :
                 (hasDue > 0 || hadReview > 0) ? (hasDue || hadReview) : ""}
              </button>
            );
          })}
        </div>

        {/* legend */}
        <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-semibold text-faint">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-grass/90 inline-block" /> Ko'rilgan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-fox inline-block" /> Takrorlash
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-grass inline-block" /> Bugun
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-cardinal inline-block" /> Imtihon
          </span>
        </div>
      </div>

      {/* Selected day or full list */}
      <div className="mt-5 space-y-6">
        {selectedDay !== null ? (
          selectedItems.length ? (
            <div>
              <div className="text-sm font-extrabold uppercase tracking-wide mb-2 text-fg">
                {dayLabel(selectedDay, today)}
              </div>
              <div className="grid gap-2">
                {selectedItems.map((it) => (
                  <ItemCard key={it.key} it={it} today={today} dayMs={selectedDay} nav={nav} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-faint font-semibold text-center pt-2">
              Bu kunda takrorlash yo'q.
            </p>
          )
        ) : (
          allDays.map((day) => {
            const list = buckets.get(day)!.sort((a, b) => +new Date(a.card.due) - +new Date(b.card.due));
            const isToday = day === today;
            return (
              <div key={day}>
                <div className={cn("text-sm font-extrabold uppercase tracking-wide mb-2", isToday ? "text-fox" : "text-faint")}>
                  {dayLabel(day, today)}
                </div>
                <div className="grid gap-2">
                  {list.map((it) => (
                    <ItemCard key={it.key} it={it} today={today} dayMs={day} nav={nav} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ItemCard({ it, today, dayMs, nav }: { it: Item; today: number; dayMs: number; nav: (r: string) => void }) {
  const isToday = dayMs === today;
  return (
    <button
      onClick={() => nav(it.route)}
      className={cn(
        "btn-3d rounded-2xl border-2 bg-card p-3 flex items-center gap-3 text-left hover:bg-muted w-full",
        isToday ? "border-fox" : "border-line"
      )}
    >
      <div className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-xl font-extrabold text-white",
        isToday ? "bg-fox" : "bg-sky"
      )}>
        {it.isTest ? <ClipboardList className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold leading-tight line-clamp-2">{it.title}</div>
        <div className="text-[11px] font-semibold text-faint">
          {it.isTest ? "Test" : "Mavzu"} · {Math.round(it.card.stability)} kun barqarorlik
        </div>
      </div>
      {isToday && <span className="text-xs font-extrabold text-fox shrink-0">Boshlash</span>}
    </button>
  );
}
