import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Grade } from "ts-fsrs";
import { reviewCard, type StoredCard } from "@/lib/fsrs";

// card key: `test:<n>` or `cat:<id>`
export const testKey = (n: number | string) => `test:${n}`;
export const catKey = (id: number | string) => `cat:${id}`;

interface ReviewState {
  cards: Record<string, StoredCard>;
  review: (key: string, grade: Grade, maxInterval?: number) => void;
  importCard: (key: string, card: StoredCard) => void; // used by CloudStorage sync
  getCard: (key: string) => StoredCard | undefined;
  reset: () => void;
}

export const useReview = create<ReviewState>()(
  persist(
    (set, get) => ({
      cards: {},
      review: (key, grade, maxInterval?: number) =>
        set((s) => ({ cards: { ...s.cards, [key]: reviewCard(s.cards[key], grade, new Date(), maxInterval) } })),
      importCard: (key, card) =>
        set((s) => ({ cards: { ...s.cards, [key]: card } })),
      getCard: (key) => get().cards[key],
      reset: () => set({ cards: {} }),
    }),
    { name: "avtotest-review" }
  )
);
