import { useState } from "react";
import { cn } from "@/lib/utils";

export function BlurImage({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {/* skeleton shimmer until loaded */}
      {!loaded && <div className="absolute inset-0 animate-pulse bg-line/40" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "relative w-full max-h-72 object-contain transition-[filter,opacity] duration-500 ease-out",
          loaded ? "blur-0 opacity-100" : "blur-xl opacity-0"
        )}
      />
    </div>
  );
}
