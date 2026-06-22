import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type State = "idle" | "selected" | "correct" | "wrong" | "missed";

export function AnswerOption({
  text,
  index,
  state,
  disabled,
  onClick,
}: {
  text: string;
  index: number;
  state: State;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const letter = String.fromCharCode(65 + index);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "btn-3d w-full rounded-2xl border-2 px-4 py-3.5 text-left flex items-center gap-3 font-semibold",
        state === "idle" && "border-swan bg-white hover:bg-polar text-eel",
        state === "selected" && "border-sky bg-sky/10 text-sky-dark",
        state === "correct" && "border-grass bg-grass/10 text-grass-dark",
        state === "wrong" && "border-cardinal bg-cardinal/10 text-cardinal-dark",
        state === "missed" && "border-grass bg-grass/5 text-grass-dark",
        disabled && state === "idle" && "opacity-60"
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 text-xs font-bold",
          state === "idle" && "border-swan text-wolf",
          state === "selected" && "border-sky text-sky-dark",
          (state === "correct" || state === "missed") && "border-grass bg-grass text-white",
          state === "wrong" && "border-cardinal bg-cardinal text-white"
        )}
      >
        {state === "correct" || state === "missed" ? (
          <Check className="h-4 w-4" />
        ) : state === "wrong" ? (
          <X className="h-4 w-4" />
        ) : (
          letter
        )}
      </span>
      <span className="flex-1 whitespace-pre-line leading-snug">{text}</span>
    </button>
  );
}
