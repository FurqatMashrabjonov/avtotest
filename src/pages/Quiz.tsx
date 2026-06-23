import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuizRunner, type QuizConfig, type QuizResult } from "@/components/QuizRunner";
import { ResultScreen } from "@/pages/Results";
import {
  questionsByCategory,
  categoryById,
  getQuestion,
  getBlock,
  TEST_PASS_MAX_WRONG,
} from "@/lib/data";
import { useGame } from "@/store/useGame";
import { useReview, testKey, catKey } from "@/store/useReview";
import { ratingFromResult } from "@/lib/fsrs";
import { useSettings, fsrsMaxInterval } from "@/store/useSettings";
import { TG } from "@/lib/telegram";
import { shuffle } from "@/lib/utils";

const TEST_DURATION_SECS = 25 * 60;

export default function Quiz() {
  const { mode, id } = useParams();
  const nav = useNavigate();
  const mistakeIds = useGame((s) => s.mistakeIds);
  const reviewStore = useReview((s) => s.review);
  const examDate = useSettings((s) => s.examDate);
  const maxInterval = fsrsMaxInterval(examDate);
  const [result, setResult] = useState<QuizResult | null>(null);
  const backCb = useRef(() => nav("/"));

  // Telegram back button
  useEffect(() => {
    const cb = backCb.current;
    TG.showBack(cb);
    return () => TG.hideBack(cb);
  }, []);

  const config = useMemo<QuizConfig | null>(() => {
    if (mode === "category" && id) {
      const cat = categoryById.get(Number(id));
      const qs = shuffle(questionsByCategory(Number(id)));
      if (!qs.length) return null;
      return { title: cat?.name ?? "Mavzu", questions: qs, passMaxWrong: TEST_PASS_MAX_WRONG };
    }
    if (mode === "test" && id) {
      const block = getBlock(Number(id));
      if (!block?.length) return null;
      return {
        title: `${id}-test`,
        questions: block,
        passMaxWrong: TEST_PASS_MAX_WRONG,
        durationSecs: TEST_DURATION_SECS,
      };
    }
    if (mode === "mistakes") {
      const qs = mistakeIds
        .map(getQuestion)
        .filter((q): q is NonNullable<typeof q> => q != null);
      if (!qs.length) return null;
      return { title: "Xatolar ustida ish", questions: shuffle(qs) };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id]);

  function handleDone(r: QuizResult) {
    if (mode === "test" && id) reviewStore(testKey(id), ratingFromResult(r), maxInterval);
    else if (mode === "category" && id) reviewStore(catKey(id), ratingFromResult(r), maxInterval);
    setResult(r);
  }

  if (!config) {
    return (
      <div className="min-h-dvh grid place-items-center p-6 text-center">
        <div>
          <p className="text-lg font-bold mb-4">Bu yerda savol yo'q.</p>
          <button className="text-sky font-bold" onClick={() => nav("/")}>
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    const reviewKey =
      mode === "test" && id ? testKey(id) : mode === "category" && id ? catKey(id) : undefined;
    return (
      <ResultScreen
        result={result}
        title={config.title}
        reviewKey={reviewKey}
        onRetry={() => { setResult(null); nav(0); }}
        onHome={() => nav("/")}
        onReviewMistakes={result.wrongIds.length ? () => nav("/quiz/mistakes") : undefined}
      />
    );
  }

  return <QuizRunner config={config} onDone={handleDone} />;
}
