import { useState } from "react";
import { useNavigate } from "react-router-dom";

const UZ_MONTHS = [
  "yanvar","fevral","mart","aprel","may","iyun",
  "iyul","avgust","sentyabr","oktyabr","noyabr","dekabr",
];
function formatUzDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()} yil`;
}
import {
  CalendarClock, ClipboardList, Layers, AlertTriangle,
  ChevronRight, Pencil,
} from "lucide-react";
import { categories, questions as allQuestions, testBlocks, questionsByCategory } from "@/lib/data";
import { useGame } from "@/store/useGame";
import { useReview, testKey, catKey } from "@/store/useReview";
import { useSettings, daysToExam } from "@/store/useSettings";
import { isDue } from "@/lib/fsrs";
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
                  {formatUzDate(examDate)}
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

        {/* Statistika — kompakt */}
        <Card>
          <div className="flex justify-around divide-x divide-line text-center">
            <div className="flex-1 px-2">
              <div className="font-extrabold text-xl">{solvedIds.length}</div>
              <div className="text-[11px] text-faint font-semibold">Savollar</div>
            </div>
            <div className="flex-1 px-2">
              <div className="font-extrabold text-xl">{Object.keys(cards).length}</div>
              <div className="text-[11px] text-faint font-semibold">FSRS karta</div>
            </div>
            <div className="flex-1 px-2">
              <div className="font-extrabold text-xl">{solvedPct}%</div>
              <div className="text-[11px] text-faint font-semibold">Tugallangan</div>
            </div>
          </div>
        </Card>

      </div>

      <ExamDateDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

