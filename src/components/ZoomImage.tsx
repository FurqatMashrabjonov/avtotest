import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { BlurImage } from "@/components/BlurImage";
import { cn } from "@/lib/utils";

export function ZoomImage({ src, className }: { src: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={cn("relative cursor-zoom-in group", className)}
        onClick={() => setOpen(true)}
      >
        <BlurImage src={src} className="rounded-2xl border-2 border-line" />
        <span className="absolute bottom-2 right-2 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
          <ZoomIn className="h-4 w-4" />
        </span>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={src}
            alt=""
            className="max-w-full max-h-[90dvh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
