import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  examDate: string | null; // YYYY-MM-DD
  onboardingDone: boolean;
  setExamDate: (date: string | null) => void;
  markOnboardingDone: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      examDate: null,
      onboardingDone: false,
      setExamDate: (date) => set({ examDate: date, onboardingDone: true }),
      markOnboardingDone: () => set({ onboardingDone: true }),
    }),
    { name: "avtotest-settings" }
  )
);

const DAY = 86400000;

export function daysToExam(examDate: string | null): number | null {
  if (!examDate) return null;
  const diff = new Date(examDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / DAY);
}

// FSRS max_interval capped at days remaining (min 3, max 75)
export function fsrsMaxInterval(examDate: string | null): number {
  const d = daysToExam(examDate);
  if (d == null || d <= 0) return 75;
  return Math.min(75, Math.max(3, d));
}
