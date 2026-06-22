import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_HEARTS = 5;
const REFILL_MS = 30 * 60 * 1000; // 1 heart / 30 min

interface GameState {
  hearts: number;
  heartsUpdatedAt: number;
  solvedIds: number[]; // answered correctly at least once
  mistakeIds: number[]; // currently-wrong, cleared when later answered right
  // derived / actions
  currentHearts: () => number;
  msToNextHeart: () => number;
  loseHeart: () => void;
  refillHearts: () => void;
  recordAnswer: (questionId: number, correct: boolean) => void;
  reset: () => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      hearts: MAX_HEARTS,
      heartsUpdatedAt: Date.now(),
      solvedIds: [],
      mistakeIds: [],

      currentHearts: () => {
        const { hearts, heartsUpdatedAt } = get();
        if (hearts >= MAX_HEARTS) return MAX_HEARTS;
        const gained = Math.floor((Date.now() - heartsUpdatedAt) / REFILL_MS);
        return Math.min(MAX_HEARTS, hearts + gained);
      },

      msToNextHeart: () => {
        const { hearts, heartsUpdatedAt } = get();
        if (hearts >= MAX_HEARTS) return 0;
        const elapsed = (Date.now() - heartsUpdatedAt) % REFILL_MS;
        return REFILL_MS - elapsed;
      },

      refillHearts: () => set({ hearts: MAX_HEARTS, heartsUpdatedAt: Date.now() }),

      loseHeart: () => {
        const cur = get().currentHearts();
        const next = Math.max(0, cur - 1);
        set({
          hearts: next,
          heartsUpdatedAt: cur >= MAX_HEARTS ? Date.now() : get().heartsUpdatedAt,
        });
      },

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

      reset: () =>
        set({
          hearts: MAX_HEARTS,
          heartsUpdatedAt: Date.now(),
          solvedIds: [],
          mistakeIds: [],
        }),
    }),
    { name: "avtotest-game" }
  )
);
