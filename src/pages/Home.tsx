import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock, ClipboardList, Layers, AlertTriangle,
  ChevronRight, CheckCircle2, BarChart2, ClipboardCheck, Pencil,
} from "lucide-react";
import { categories, questions as allQuestions, testBlocks, questionsByCategory } from "@/lib/data";
import { useGame } from "@/store/useGame";
import { useReview, testKey, catKey } from "@/store/useReview";
import { useSettings, daysToExam } from "@/store/useSettings";
import { isDue, dueLabel } from "@/lib/fsrs";
import { ExamDateDrawer } from "@/components/ExamDateDrawer";
import { cn } from "@/lib/utils";

function Card({
  onClick, className, children,
}: { onClick?: () => void; className?: string; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border-2 border-line bg-card p-4",
        onClick && "cursor-pointer active:scale-[.98] transition-transform",
        className
      )}
    >
      {children}
    </div>
  );
}

function CardArrow() {
  return <ChevronRight className="h-5 w-5 text-faint shrink-0" />;
}

export default function Home() {
  const nav = useNavigate();
  const solvedIds = useGame((s) => s.solvedIds);
  const mistakeIds = useGame((s) => s.mistakeIds);
  const cards = useReview((s) => s.cards);
  const { examDate, onboardingDone } = useSettings();
  const [drawerOpen, setDrawerOpen] = useState(!onboardingDone);

  const solvedSet = new Set(solvedIds);

  // FSRS due counts
  const dueTests = testBlocks.filter((_, i) => isDue(cards[testKey(i + 1)])).length;
  const dueTopics = categories.filter((c) => isDue(cards[catKey(c.id)])).length;
  const dueTotal = dueTests + dueTopics;

  // test/topic progress
  const completedTests = testBlocks.filter((b) => b.every((q) => solvedSet.has(q.id))).length;
  const testPct = Math.round((completedTests / testBlocks.length) * 100);
  const completedTopics = categories.filter((c) => {
    const qs = questionsByCategory(c.id);
    return qs.length && qs.every((q) => solvedSet.has(q.id));
  }).length;
  const topicPct = Math.round((completedTopics / categories.length) * 100);

  const solvedPct = Math.round((solvedIds.length / allQuestions.length) * 100);

  // exam countdown
  const days = daysToExam(examDate);

  // calendar preview
  const upcoming = Object.entries(cards)
    .map(([key, card]) => ({ key, card }))
    .sort((a, b) => new Date(a.card.due).getTime() - new Date(b.card.due).getTime())
    .slice(0, 4);

  function upcomingLabel(key: string) {
    const [kind, id] = key.split(":");
    if (kind === "test") return `${id}-test`;
    const cat = categories.find((c) => String(c.id) === id);
    return cat?.name ?? "Mavzu";
  }

  return (
    <>
      <div className="pt-5 pb-6 space-y-3">

        {/* Imtihon countdown */}
        {examDate && days !== null ? (
          <Card
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "border-2",
              days <= 0 ? "border-cardinal bg-cardinal/5" :
              days <= 7 ? "border-fox bg-fox/5" :
              "border-sky bg-sky/5"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "grid h-14 w-14 shrink-0 place-items-center rounded-xl text-white flex-col",
                days <= 0 ? "bg-cardinal" : days <= 7 ? "bg-fox" : "bg-sky"
              )}>
                <span className="font-extrabold text-2xl leading-none">{Math.max(0, days)}</span>
                <span className="text-[10px] font-bold opacity-80">kun</span>
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-base leading-tight">
                  {days <= 0 ? "Imtihon kuni keldi!" :
                   days === 1 ? "Ertaga imtihon!" :
                   `Imtihonga ${days} kun qoldi`}
                </div>
                <div className="text-xs text-faint font-semibold mt-1">
                  {new Date(examDate).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
              <Pencil className="h-4 w-4 text-faint shrink-0" />
            </div>
          </Card>
        ) : (
          <button
            className="w-full rounded-2xl border-2 border-dashed border-line p-3 text-sm font-semibold text-faint flex items-center justify-center gap-2 active:bg-muted transition-colors"
            onClick={() => setDrawerOpen(true)}
          >
            <CalendarClock className="h-4 w-4" />
            Imtihon sanasini kiriting
          </button>
        )}

        {/* Bugungi takrorlash */}
        <Card
          onClick={() => nav("/calendar")}
          className={cn(
            "border-2",
            dueTotal > 0 ? "border-fox bg-fox/8" : "border-grass bg-grass/8"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
              dueTotal > 0 ? "bg-fox text-white" : "bg-grass text-white"
            )}>
              <CalendarClock className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="font-extrabold text-lg leading-tight">
                {dueTotal > 0 ? "Bugungi takrorlash" : "Bugun hammasi tayyor ✓"}
              </div>
              <div className={cn("text-sm font-semibold mt-0.5", dueTotal > 0 ? "text-fox" : "text-grass-dark")}>
                {dueTotal > 0
                  ? `${dueTests ? `${dueTests} ta test` : ""}${dueTests && dueTopics ? ", " : ""}${dueTopics ? `${dueTopics} ta mavzu` : ""} kutmoqda`
                  : "Barcha kartalar o'qilgan"}
              </div>
            </div>
            <CardArrow />
          </div>
        </Card>

        {/* Testlar + Mavzular */}
        <div className="grid grid-cols-2 gap-3">
          <Card onClick={() => nav("/tests")} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky text-white">
                <ClipboardList className="h-6 w-6" />
              </div>
              <ChevronRight className="h-5 w-5 text-faint" />
            </div>
            <div>
              <div className="font-extrabold">Testlar</div>
              <div className="text-xs text-faint font-semibold">{completedTests}/{testBlocks.length} tugallandi</div>
            </div>
            <div className="h-2 w-full rounded-full bg-line overflow-hidden">
              <div className="h-full rounded-full bg-sky transition-all" style={{ width: `${testPct}%` }} />
            </div>
          </Card>

          <Card onClick={() => nav("/topics")} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-grass text-white">
                <Layers className="h-6 w-6" />
              </div>
              <ChevronRight className="h-5 w-5 text-faint" />
            </div>
            <div>
              <div className="font-extrabold">Mavzular</div>
              <div className="text-xs text-faint font-semibold">{completedTopics}/{categories.length} tugallandi</div>
            </div>
            <div className="h-2 w-full rounded-full bg-line overflow-hidden">
              <div className="h-full rounded-full bg-grass transition-all" style={{ width: `${topicPct}%` }} />
            </div>
          </Card>
        </div>

        {/* Xatolar */}
        {mistakeIds.length > 0 && (
          <Card onClick={() => nav("/quiz/mistakes")} className="border-cardinal/40 bg-cardinal/5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cardinal text-white">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-lg">Xatolar ustida ish</div>
                <div className="text-sm font-semibold text-cardinal">{mistakeIds.length} ta xato savol kutmoqda</div>
              </div>
              <CardArrow />
            </div>
          </Card>
        )}

        {/* Kalendar preview */}
        <Card onClick={() => nav("/calendar")}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-extrabold">
              <CalendarClock className="h-5 w-5 text-fox" />
              Kalendar
            </div>
            <span className="text-xs font-bold text-faint">Barchasi →</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-faint font-semibold">Hali birorta test topshirilmagan.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(({ key, card }) => {
                const due = isDue(card);
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", due ? "bg-fox" : "bg-sky")} />
                    <span className="flex-1 font-semibold truncate">{upcomingLabel(key)}</span>
                    <span className={cn("font-bold shrink-0", due ? "text-fox" : "text-faint")}>
                      {dueLabel(card)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Statistika */}
        <Card>
          <div className="flex items-center gap-2 font-extrabold mb-3">
            <BarChart2 className="h-5 w-5 text-sky" />
            Statistika
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatCell
              icon={<ClipboardCheck className="h-5 w-5 text-grass mx-auto" />}
              value={`${solvedIds.length}`}
              label="O'rganildi"
            />
            <StatCell
              icon={<CalendarClock className="h-5 w-5 text-fox mx-auto" />}
              value={`${Object.keys(cards).length}`}
              label="FSRS karta"
            />
            <StatCell
              icon={<CheckCircle2 className="h-5 w-5 text-sky mx-auto" />}
              value={`${solvedPct}%`}
              label="Tugallangan"
            />
          </div>
        </Card>

        <p className="text-center text-xs text-faint font-semibold pt-2">
          Ma'lumotlar manbai: tezkoravtotest.uz
        </p>
      </div>

      <ExamDateDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function StatCell({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-muted p-2.5">
      {icon}
      <div className="font-extrabold text-lg mt-1">{value}</div>
      <div className="text-[11px] text-faint font-semibold leading-tight">{label}</div>
    </div>
  );
}
