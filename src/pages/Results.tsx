import { useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, CheckCircle2, Target, RotateCcw, CalendarClock } from "lucide-react";
import confetti from "canvas-confetti";
import type { QuizResult } from "@/components/QuizRunner";
import { Button } from "@/components/ui/button";
import { useReview } from "@/store/useReview";
import { formatDate, dueLabel } from "@/lib/fsrs";

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`flex-1 rounded-2xl border-2 ${color} overflow-hidden`}>
      <div className="text-[11px] font-bold uppercase tracking-wide text-white py-1 text-center bg-black/10">
        {label}
      </div>
      <div className="flex items-center justify-center gap-1.5 py-2.5 bg-card">
        {icon}
        <span className="text-lg font-extrabold">{value}</span>
      </div>
    </div>
  );
}

export function ResultScreen({
  result,
  title,
  reviewKey,
  onRetry,
  onHome,
  onReviewMistakes,
}: {
  result: QuizResult;
  title: string;
  reviewKey?: string;
  onRetry: () => void;
  onHome: () => void;
  onReviewMistakes?: () => void;
}) {
  const win = result.passed;
  const perfect = result.wrong === 0;
  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const card = useReview((s) => (reviewKey ? s.cards[reviewKey] : undefined));

  const headline =
    result.reason === "timeout" ? "Vaqt tugadi ⏱" : perfect ? "Mukammal! 🌟" : win ? "Ajoyib!" : "Yakunlandi";

  useEffect(() => {
    if (perfect) {
      confetti({ particleCount: 140, spread: 80, colors: ["#58cc02", "#ffc800", "#1cb0f6", "#ff9600"] });
    } else if (win) {
      confetti({ particleCount: 60, spread: 55, colors: ["#58cc02", "#89e219"] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center max-w-xl mx-auto px-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        <Trophy className={`h-24 w-24 ${win ? "text-bee fill-bee" : "text-faint"}`} />
      </motion.div>

      <h1 className="mt-4 text-3xl font-extrabold">{headline}</h1>
      <p className="text-faint font-semibold mt-1">{title}</p>

      <div className="flex gap-3 w-full mt-8">
        <Stat icon={<Target className="h-5 w-5 text-sky" />} label="Aniqlik" value={`${accuracy}%`} color="border-sky" />
        <Stat icon={<CheckCircle2 className="h-5 w-5 text-grass" />} label="To'g'ri" value={`${result.correct}/${result.total}`} color="border-grass" />
      </div>

      {card && (
        <div className="mt-5 w-full rounded-2xl border-2 border-fox bg-fox/10 px-4 py-3 flex items-center gap-3 text-left">
          <CalendarClock className="h-7 w-7 text-fox shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-fox">Keyingi takrorlash</div>
            <div className="font-extrabold">{formatDate(card)}</div>
            <div className="text-xs font-semibold text-faint">{dueLabel(card)}</div>
          </div>
        </div>
      )}

      <div className="w-full mt-8 space-y-3">
        {onReviewMistakes && (
          <Button variant="sky" size="lg" className="w-full" onClick={onReviewMistakes}>
            Xatolar ustida ishlash ({result.wrongIds.length})
          </Button>
        )}
        <Button variant="primary" size="lg" className="w-full" onClick={onRetry}>
          <RotateCcw className="h-5 w-5" /> Qayta urinish
        </Button>
        <Button variant="ghost" size="lg" className="w-full" onClick={onHome}>
          Bosh sahifa
        </Button>
      </div>
    </div>
  );
}
