import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-4 w-full rounded-full bg-line overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-grass transition-all duration-300 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
