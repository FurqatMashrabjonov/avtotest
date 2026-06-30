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
  durationSecs?: number;
}

export interface QuizResult {
  total: number;
  correct: number;
  wrong: number;
  passed: boolean;
  reason: "completed" | "timeout";
  wrongIds: number[];
}

const CORRECT_DELAY = 600;

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
  const idxRef = useRef(0);

  // per-question picked answer index (null = unanswered)
  const [pickedAnswers, setPickedAnswers] = useState<Array<number | null>>(
    () => Array(questions.length).fill(null)
  );
  const pickedRef = useRef<Array<number | null>>(Array(questions.length).fill(null));

  const [timeLeft, setTimeLeft] = useState<number | null>(durationSecs ?? null);
  const [clawd, setClawd] = useState<"correct" | "wrong" | null>(null);

  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const wrongIdsRef = useRef<number[]>([]);
  const advTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);
  const numBarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const q = questions[idx];
  const answers = shuffledAnswers[idx];
  const picked = pickedAnswers[idx];
  const checked = picked !== null;
  const isCorrect = checked && picked != null && answers[picked]?.correct;
  const answeredCount = pickedAnswers.filter((p) => p !== null).length;
  const progress = (answeredCount / questions.length) * 100;
  const urgent = timeLeft !== null && timeLeft <= 60;

  function syncPicked(newPicked: Array<number | null>) {
    pickedRef.current = newPicked;
    setPickedAnswers(newPicked);
  }

  function jumpTo(n: number) {
    if (advTimer.current) clearTimeout(advTimer.current);
    idxRef.current = n;
    setIdx(n);
  }

  // scroll number bar to keep current button visible
  useEffect(() => {
    const bar = numBarRef.current;
    if (!bar) return;
    const btn = bar.children[idx] as HTMLElement | undefined;
    btn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [idx]);

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
    const newPicked = [...pickedRef.current];
    newPicked[idxRef.current] = i;
    syncPicked(newPicked);
    recordAnswer(q.id, ok);
    if (ok) {
      correctRef.current += 1;
      TG.hapticSuccess();
      playCorrect();
      setClawd("correct");
      advTimer.current = setTimeout(() => {
        setClawd(null);
        advanceNext(newPicked);
      }, CORRECT_DELAY);
    } else {
      wrongRef.current += 1;
      wrongIdsRef.current.push(q.id);
      TG.hapticError();
      playWrong();
      setClawd("wrong");
    }
  }

  function advanceNext(picked: Array<number | null>) {
    const ci = idxRef.current;
    // prefer next unanswered after current, then wrap from start
    let next = picked.findIndex((p, j) => j > ci && p === null);
    if (next === -1) next = picked.findIndex((p) => p === null);
    if (next !== -1) jumpTo(next);
    else finish("completed");
  }

  function goNext() {
    setClawd(null);
    advanceNext(pickedRef.current);
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

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // ignore vertical-dominant or too-short swipes
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && idxRef.current < questions.length - 1) jumpTo(idxRef.current + 1);
    else if (dx > 0 && idxRef.current > 0) jumpTo(idxRef.current - 1);
  }

  return (
    <div
      className="flex flex-col min-h-dvh max-w-xl mx-auto px-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* top bar */}
      <header className="flex items-center gap-3 py-4">
        <button
          onClick={() => (onExitClick ? onExitClick() : nav("/"))}
          className="text-faint hover:text-fg"
        >
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

      {/* scrollable question number bar */}
      <div
        ref={numBarRef}
        className="flex gap-1.5 overflow-x-auto -mx-4 px-4 py-1 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {questions.map((_, i) => {
          const p = pickedAnswers[i];
          const isAnswered = p !== null;
          const correct = isAnswered && shuffledAnswers[i][p as number]?.correct;
          return (
            <button
              key={i}
              onClick={() => jumpTo(i)}
              className={cn(
                "h-8 w-8 shrink-0 rounded-lg text-xs font-extrabold transition-colors",
                i === idx ? "ring-2 ring-sky ring-offset-1" : "",
                isAnswered
                  ? correct
                    ? "bg-grass text-white"
                    : "bg-cardinal text-white"
                  : "bg-line text-faint"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* question */}
      <div className="flex-1 pt-4">
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

      {/* footer: only on wrong answer */}
      {checked && !isCorrect && (
        <footer className="sticky bottom-0 -mx-4 px-4 py-4">
          <Button variant="danger" size="lg" className="w-full" onClick={goNext}>
            Davom etish
          </Button>
        </footer>
      )}

      {/* clawd reaction overlay */}
      <AnimatePresence>
        {clawd && (
          <motion.div
            key={clawd}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="fixed bottom-24 right-4 z-50 pointer-events-none"
          >
            <img
              src={`https://clawd-pet.vercel.app/pets/clawd-${clawd === "correct" ? "celebrating" : "facepalm"}.svg`}
              alt=""
              className="h-24 w-24 drop-shadow-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
