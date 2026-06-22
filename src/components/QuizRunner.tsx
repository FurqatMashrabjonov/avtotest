import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Volume2 } from "lucide-react";
import type { Question } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AnswerOption } from "@/components/AnswerOption";
import { useGame } from "@/store/useGame";
import { shuffle, cn } from "@/lib/utils";

export interface QuizConfig {
  title: string;
  questions: Question[];
  passMaxWrong?: number; // pass if wrong <= this (default: always pass on completion)
}

export interface QuizResult {
  total: number;
  correct: number;
  wrong: number;
  passed: boolean;
  reason: "completed";
  wrongIds: number[];
}

// answers shuffled once per question
function useShuffledAnswers(questions: Question[]) {
  return useMemo(
    () =>
      questions.map((q) =>
        shuffle(q.answers.map((text, i) => ({ text, correct: i === q.correctIndex })))
      ),
    [questions]
  );
}

export function QuizRunner({ config, onDone }: { config: QuizConfig; onDone: (r: QuizResult) => void }) {
  const { questions, passMaxWrong } = config;
  const nav = useNavigate();
  const recordAnswer = useGame((s) => s.recordAnswer);
  const shuffledAnswers = useShuffledAnswers(questions);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongIds, setWrongIds] = useState<number[]>([]);

  const q = questions[idx];
  const answers = shuffledAnswers[idx];
  const isCorrect = checked && picked != null && answers[picked].correct;
  const progress = (idx / questions.length) * 100;

  function check() {
    if (picked == null) return;
    const ok = answers[picked].correct;
    setChecked(true);
    recordAnswer(q.id, ok);
    if (ok) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongCount((w) => w + 1);
      setWrongIds((ids) => [...ids, q.id]);
    }
  }

  function next() {
    if (idx + 1 >= questions.length) {
      const passed = wrongCount <= (passMaxWrong ?? Infinity);
      onDone({
        total: questions.length,
        correct: correctCount,
        wrong: wrongCount,
        passed,
        reason: "completed",
        wrongIds,
      });
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setChecked(false);
  }

  function speak() {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(q.text);
    u.lang = "uz-UZ";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-xl mx-auto px-4">
      {/* top bar */}
      <header className="flex items-center gap-3 py-4">
        <button onClick={() => nav("/")} className="text-wolf hover:text-eel">
          <X className="h-7 w-7" />
        </button>
        <Progress value={progress} className="flex-1" />
        <span className="text-sm font-extrabold text-wolf tabular-nums">
          {idx + 1}/{questions.length}
        </span>
      </header>

      {/* question body */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-2 mb-4">
              <h1 className="text-xl font-extrabold leading-snug flex-1">{q.text}</h1>
              <button onClick={speak} className="text-sky shrink-0 mt-1">
                <Volume2 className="h-6 w-6" />
              </button>
            </div>

            {q.image && (
              <div className="mb-4 rounded-2xl overflow-hidden border-2 border-swan bg-polar">
                <img src={q.image} alt="" loading="lazy" className="w-full max-h-72 object-contain" />
              </div>
            )}

            <div className="space-y-2.5">
              {answers.map((a, i) => {
                let state: "idle" | "selected" | "correct" | "wrong" | "missed" = "idle";
                if (!checked) state = picked === i ? "selected" : "idle";
                else if (a.correct) state = picked === i ? "correct" : "missed";
                else if (picked === i) state = "wrong";
                return (
                  <AnswerOption
                    key={i}
                    index={i}
                    text={a.text}
                    state={state}
                    disabled={checked}
                    onClick={() => !checked && setPicked(i)}
                  />
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer */}
      <footer
        className={cn(
          "sticky bottom-0 -mx-4 px-4 py-4 border-t-2 transition-colors",
          !checked && "border-transparent",
          isCorrect && "border-grass/30 bg-grass/10",
          checked && !isCorrect && "border-cardinal/30 bg-cardinal/10"
        )}
      >
        {checked && (
          <div className={cn("mb-3 font-extrabold", isCorrect ? "text-grass-dark" : "text-cardinal-dark")}>
            {isCorrect ? "To'g'ri! 🎉" : "Noto'g'ri"}
          </div>
        )}
        {!checked ? (
          <Button variant="primary" size="lg" className="w-full" disabled={picked == null} onClick={check}>
            Tekshirish
          </Button>
        ) : (
          <Button variant={isCorrect ? "primary" : "danger"} size="lg" className="w-full" onClick={next}>
            Davom etish
          </Button>
        )}
      </footer>
    </div>
  );
}
