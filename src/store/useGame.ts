import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GameState {
  solvedIds: number[]; // answered correctly at least once
  mistakeIds: number[]; // currently-wrong, cleared when later answered right
  recordAnswer: (questionId: number, correct: boolean) => void;
  reset: () => void;
}

export const useGame = create<GameState>()(
  persist(
    (set) => ({
      solvedIds: [],
      mistakeIds: [],

      recordAnswer: (questionId, correct) =>
        set((s) => {
          if (correct) {
            return {
              solvedIds: s.solvedIds.includes(questionId)
                ? s.solvedIds
                : [...s.solvedIds, questionId],
              mistakeIds: s.mistakeIds.filter((id) => id !== questionId),
            };
          }
          return {
            mistakeIds: s.mistakeIds.includes(questionId)
              ? s.mistakeIds
              : [...s.mistakeIds, questionId],
          };
        }),

      reset: () => set({ solvedIds: [], mistakeIds: [] }),
    }),
    { name: "avtotest-game" }
  )
);
