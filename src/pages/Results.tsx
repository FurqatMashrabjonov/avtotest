import { motion } from "framer-motion";
import { Trophy, Heart, Target, RotateCcw } from "lucide-react";
import type { QuizResult } from "@/components/QuizRunner";
import { Button } from "@/components/ui/button";

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`flex-1 rounded-2xl border-2 ${color} overflow-hidden`}>
      <div className="text-[11px] font-bold uppercase tracking-wide text-white py-1 text-center bg-black/10">
        {label}
      </div>
      <div className="flex items-center justify-center gap-1.5 py-2.5 bg-white">
        {icon}
        <span className="text-lg font-extrabold">{value}</span>
      </div>
    </div>
  );
}

export function ResultScreen({
  result,
  title,
  onRetry,
  onHome,
  onReviewMistakes,
}: {
  result: QuizResult;
  title: string;
  onRetry: () => void;
  onHome: () => void;
  onReviewMistakes?: () => void;
}) {
  const win = result.passed;
  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;

  const headline =
    result.reason === "out-of-hearts"
      ? "Yuraklar tugadi 💔"
      : win
      ? "Ajoyib!"
      : "Yakunlandi";

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center max-w-xl mx-auto px-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        <Trophy className={`h-24 w-24 ${win ? "text-bee fill-bee" : "text-wolf"}`} />
      </motion.div>

      <h1 className="mt-4 text-3xl font-extrabold">{headline}</h1>
      <p className="text-wolf font-semibold mt-1">{title}</p>

      <div className="flex gap-3 w-full mt-8">
        <Stat icon={<Target className="h-5 w-5 text-sky" />} label="Aniqlik" value={`${accuracy}%`} color="border-sky" />
        <Stat icon={<Heart className="h-5 w-5 text-cardinal fill-cardinal" />} label="To'g'ri" value={`${result.correct}/${result.total}`} color="border-cardinal" />
      </div>

      <div className="w-full mt-10 space-y-3">
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
