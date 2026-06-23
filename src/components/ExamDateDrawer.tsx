import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/store/useSettings";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ExamDateDrawer({ open, onClose }: Props) {
  const { examDate, setExamDate, markOnboardingDone } = useSettings();
  const [date, setDate] = useState(examDate ?? "");
  const today = new Date().toISOString().slice(0, 10);

  function save() {
    if (!date) return;
    setExamDate(date);
    onClose();
  }

  function skip() {
    markOnboardingDone();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={skip}
          />
          <motion.div
            className="fixed bottom-0 inset-x-0 z-50 max-w-xl mx-auto bg-card rounded-t-3xl p-6 border-t-2 border-line"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* handle */}
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-line" />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-extrabold text-xl">
                <CalendarClock className="h-6 w-6 text-fox" />
                Imtihon sanasi
              </div>
              <button onClick={skip} className="text-faint hover:text-fg p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-faint font-semibold mb-5 leading-relaxed">
              FSRS takrorlash jadvali imtihon sanasiga qarab moslashadi — takrorlashlar
              o'sha kungacha to'g'ri taqsimlanadi.
            </p>

            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border-2 border-line bg-muted px-4 py-3 font-semibold text-fg mb-4 focus:outline-none focus:border-grass text-base"
            />

            <Button size="lg" className="w-full mb-3" disabled={!date} onClick={save}>
              Saqlash
            </Button>

            <button
              className="w-full text-sm text-faint font-semibold py-2"
              onClick={skip}
            >
              O'tkazib yuborish
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
