import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Grade } from "ts-fsrs";
import { reviewCard, type StoredCard } from "@/lib/fsrs";

// card key: `test:<n>` or `cat:<id>`
export const testKey = (n: number | string) => `test:${n}`;
export const catKey = (id: number | string) => `cat:${id}`;

interface ReviewState {
  cards: Record<string, StoredCard>;
  review: (key: string, grade: Grade) => void;
  getCard: (key: string) => StoredCard | undefined;
  reset: () => void;
}

export const useReview = create<ReviewState>()(
  persist(
    (set, get) => ({
      cards: {},
      review: (key, grade) =>
        set((s) => ({ cards: { ...s.cards, [key]: reviewCard(s.cards[key], grade) } })),
      getCard: (key) => get().cards[key],
      reset: () => set({ cards: {} }),
    }),
    { name: "avtotest-review" }
  )
);
