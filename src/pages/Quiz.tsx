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
  const [exitConfirm, setExitConfirm] = useState(false);

  // TG back button: if result shown → home directly; else → confirm
  const requestExit = useRef(() => setExitConfirm(true));
  useEffect(() => {
    const cb = requestExit.current;
    TG.showBack(cb);
    return () => TG.hideBack(cb);
  }, []);
  // when result appears, swap back button to go home directly
  useEffect(() => {
    const cb = requestExit.current;
    TG.hideBack(cb);
    if (result) {
      const homeCb = () => nav("/");
      requestExit.current = homeCb;
      TG.showBack(homeCb);
    } else {
      const confirmCb = () => setExitConfirm(true);
      requestExit.current = confirmCb;
      TG.showBack(confirmCb);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

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
          <button className="text-sky font-bold" onClick={() => nav("/")}>Bosh sahifaga qaytish</button>
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

  return (
    <>
      <QuizRunner config={config} onDone={handleDone} onExitClick={() => setExitConfirm(true)} />

      {/* Exit confirmation overlay */}
      {exitConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setExitConfirm(false)} />
          <div className="relative bg-card w-full max-w-xl rounded-t-3xl p-6 border-t-2 border-line">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-line" />
            <h2 className="font-extrabold text-xl mb-1">Testdan chiqish?</h2>
            <p className="text-sm text-faint font-semibold mb-5">Joriy natijalar saqlanmaydi.</p>
            <button
              className="btn-3d w-full rounded-2xl border-2 border-cardinal-dark bg-cardinal text-white font-extrabold py-4 mb-2"
              onClick={() => nav("/")}
            >
              Chiqish
            </button>
            <button
              className="w-full text-sm font-semibold text-faint py-3"
              onClick={() => setExitConfirm(false)}
            >
              Davom etish
            </button>
          </div>
        </div>
      )}
    </>
  );
}
