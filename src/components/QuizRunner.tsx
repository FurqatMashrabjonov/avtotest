import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Clock } from "lucide-react";
import type { Question } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AnswerOption } from "@/components/AnswerOption";
import { ZoomImage } from "@/components/ZoomImage";
import { useGame } from "@/store/useGame";
import { TG } from "@/lib/telegram";
import { playCorrect, playWrong } from "@/lib/sound";
import { shuffle, cn } from "@/lib/utils";

export interface QuizConfig {
  title: string;
  questions: Question[];
  passMaxWrong?: number;
  durationSecs?: number; // timer; null = no timer
}

export interface QuizResult {
  total: number;
  correct: number;
  wrong: number;
  passed: boolean;
  reason: "completed" | "timeout";
  wrongIds: number[];
}

const CORRECT_DELAY = 600; // ms before auto-advance on correct

function useShuffledAnswers(questions: Question[]) {
  return useMemo(
    () =>
      questions.map((q) =>
        shuffle(q.answers.map((text, i) => ({ text, correct: i === q.correctIndex })))
      ),
    [questions]
  );
}

function fmt(secs: number) {
  return `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function QuizRunner({
  config, onDone, onExitClick,
}: {
  config: QuizConfig;
  onDone: (r: QuizResult) => void;
  onExitClick?: () => void;
}) {
  const { questions, passMaxWrong, durationSecs } = config;
  const nav = useNavigate();
  const recordAnswer = useGame((s) => s.recordAnswer);
  const shuffledAnswers = useShuffledAnswers(questions);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(durationSecs ?? null);

  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const wrongIdsRef = useRef<number[]>([]);
  const advTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);

  const q = questions[idx];
  const answers = shuffledAnswers[idx];
  const isCorrect = checked && picked != null && answers[picked].correct;
  const progress = (idx / questions.length) * 100;
  const urgent = timeLeft !== null && timeLeft <= 60;

  // countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || doneRef.current) return;
    const id = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  // timer expiry
  useEffect(() => {
    if (timeLeft === 0 && !doneRef.current) finish("timeout");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      if (advTimer.current) clearTimeout(advTimer.current);
    };
  }, []);

  function pickAnswer(i: number) {
    if (checked || doneRef.current) return;
    const ok = answers[i].correct;
    setPicked(i);
    setChecked(true);
    recordAnswer(q.id, ok);
    if (ok) {
      correctRef.current += 1;
      TG.hapticSuccess();
      playCorrect();
      advTimer.current = setTimeout(goNext, CORRECT_DELAY);
    } else {
      wrongRef.current += 1;
      wrongIdsRef.current.push(q.id);
      TG.hapticError();
      playWrong();
    }
  }

  function goNext() {
    if (advTimer.current) clearTimeout(advTimer.current);
    if (idx + 1 >= questions.length) {
      finish("completed");
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setChecked(false);
  }

  function finish(reason: QuizResult["reason"]) {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone({
      total: questions.length,
      correct: correctRef.current,
      wrong: wrongRef.current,
      passed: wrongRef.current <= (passMaxWrong ?? Infinity),
      reason,
      wrongIds: wrongIdsRef.current,
    });
  }

  return (
    <div className="flex flex-col min-h-dvh max-w-xl mx-auto px-4">
      {/* top bar */}
      <header className="flex items-center gap-3 py-4">
        <button onClick={() => onExitClick ? onExitClick() : nav("/")} className="text-faint hover:text-fg">
          <X className="h-7 w-7" />
        </button>
        <Progress value={progress} className="flex-1" />
        {timeLeft !== null ? (
          <span
            className={cn(
              "flex items-center gap-1 tabular-nums text-sm font-extrabold",
              urgent ? "text-cardinal animate-pulse" : "text-faint"
            )}
          >
            <Clock className="h-4 w-4" />
            {fmt(timeLeft)}
          </span>
        ) : (
          <span className="text-sm font-extrabold text-faint tabular-nums">
            {idx + 1}/{questions.length}
          </span>
        )}
      </header>

      {/* question */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.18 }}
          >
            <h1 className="text-xl font-extrabold leading-snug mb-4">{q.text}</h1>

            {q.image && <ZoomImage key={q.image} src={q.image} className="mb-4" />}

            <div className="space-y-2.5">
              {answers.map((a, i) => {
                let state: "idle" | "selected" | "correct" | "wrong" | "missed" = "idle";
                if (checked) {
                  if (a.correct) state = picked === i ? "correct" : "missed";
                  else if (picked === i) state = "wrong";
                }
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

      {/* footer: only on wrong */}
      {checked && !isCorrect && (
        <footer className="sticky bottom-0 -mx-4 px-4 py-4">
          <Button variant="danger" size="lg" className="w-full" onClick={goNext}>
            Davom etish
          </Button>
        </footer>
      )}
    </div>
  );
}
