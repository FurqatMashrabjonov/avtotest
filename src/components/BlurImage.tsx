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
    <div className={cn("relative w-full overflow-hidden bg-muted min-h-48", className)}>
      {/* skeleton — same space as image, stays until loaded */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-line/50 rounded-inherit" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full max-h-72 object-contain transition-[opacity,filter] duration-400 ease-out",
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-lg"
        )}
      />
    </div>
  );
}
