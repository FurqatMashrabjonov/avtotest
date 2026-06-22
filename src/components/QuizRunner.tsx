import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Volume2 } from "lucide-react";
import type { Question } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AnswerOption } from "@/components/AnswerOption";
import { BlurImage } from "@/components/BlurImage";
import { useGame } from "@/store/useGame";
import { shuffle } from "@/lib/utils";

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

const CORRECT_DELAY = 650; // ms before auto-advance on correct answer

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

  // counts via refs (avoid stale closures in auto-advance timer)
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const wrongIdsRef = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const q = questions[idx];
  const answers = shuffledAnswers[idx];
  const isCorrect = checked && picked != null && answers[picked].correct;
  const progress = (idx / questions.length) * 100;

  function pickAnswer(i: number) {
    if (checked) return;
    const ok = answers[i].correct;
    setPicked(i);
    setChecked(true);
    recordAnswer(q.id, ok);
    if (ok) {
      correctRef.current += 1;
      timer.current = setTimeout(goNext, CORRECT_DELAY);
    } else {
      wrongRef.current += 1;
      wrongIdsRef.current.push(q.id);
    }
  }

  function goNext() {
    if (timer.current) clearTimeout(timer.current);
    if (idx + 1 >= questions.length) {
      onDone({
        total: questions.length,
        correct: correctRef.current,
        wrong: wrongRef.current,
        passed: wrongRef.current <= (passMaxWrong ?? Infinity),
        reason: "completed",
        wrongIds: wrongIdsRef.current,
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
        <button onClick={() => nav("/")} className="text-faint hover:text-fg">
          <X className="h-7 w-7" />
        </button>
        <Progress value={progress} className="flex-1" />
        <span className="text-sm font-extrabold text-faint tabular-nums">
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
              <BlurImage key={q.image} src={q.image} className="mb-4 rounded-2xl border-2 border-line" />
            )}

            <div className="space-y-2.5">
              {answers.map((a, i) => {
                let state: "idle" | "selected" | "correct" | "wrong" | "missed" = "idle";
                if (!checked) state = "idle";
                else if (a.correct) state = picked === i ? "correct" : "missed";
                else if (picked === i) state = "wrong";
                return (
                  <AnswerOption
                    key={i}
                    index={i}
                    text={a.text}
                    state={state}
                    disabled={checked}
                    onClick={() => pickAnswer(i)}
                  />
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer: only on wrong answer */}
      {checked && !isCorrect && (
        <footer className="sticky bottom-0 -mx-4 px-4 py-4 border-t-2 border-cardinal/30 bg-cardinal/10">
          <Button variant="danger" size="lg" className="w-full" onClick={goNext}>
            Davom etish
          </Button>
        </footer>
      )}
    </div>
  );
}
