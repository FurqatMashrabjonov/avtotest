import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_HEARTS } from "@/store/useGame";

export function HeartsBar({ hearts, className }: { hearts: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: MAX_HEARTS }).map((_, i) => (
        <Heart
          key={i}
          className={cn(
            "h-5 w-5 transition",
            i < hearts ? "fill-cardinal text-cardinal" : "fill-swan text-swan"
          )}
        />
      ))}
    </div>
  );
}
