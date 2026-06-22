import { useMemo, useState } from "react";
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
import { shuffle } from "@/lib/utils";

export default function Quiz() {
  const { mode, id } = useParams();
  const nav = useNavigate();
  const mistakeIds = useGame((s) => s.mistakeIds);
  const [result, setResult] = useState<QuizResult | null>(null);

  const config = useMemo<QuizConfig | null>(() => {
    if (mode === "category" && id) {
      const cat = categoryById.get(Number(id));
      const qs = shuffle(questionsByCategory(Number(id)));
      if (!qs.length) return null;
      return { title: cat?.name ?? "Mavzu", questions: qs, useHearts: true };
    }
    if (mode === "test" && id) {
      const block = getBlock(Number(id));
      if (!block?.length) return null;
      // sequential order (real test), pass if <= 2 wrong
      return { title: `${id}-test`, questions: block, passMaxWrong: TEST_PASS_MAX_WRONG };
    }
    if (mode === "mistakes") {
      const qs = mistakeIds.map(getQuestion).filter(Boolean) as ReturnType<typeof getQuestion>[];
      if (!qs.length) return null;
      return { title: "Xatolar ustida ish", questions: shuffle(qs as any), useHearts: true };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id]);

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
    return (
      <ResultScreen
        result={result}
        title={config.title}
        onRetry={() => {
          setResult(null);
          nav(0); // reload to reshuffle
        }}
        onHome={() => nav("/")}
        onReviewMistakes={result.wrongIds.length ? () => nav("/quiz/mistakes") : undefined}
      />
    );
  }

  return <QuizRunner config={config} onDone={setResult} />;
}
