import { fsrs, generatorParameters, createEmptyCard, Rating, type Card, type Grade } from "ts-fsrs";
import type { QuizResult } from "@/components/QuizRunner";

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

// Card stored with ISO date strings (JSON-safe for localStorage)
export interface StoredCard extends Omit<Card, "due" | "last_review"> {
  due: string;
  last_review?: string;
}

const toStored = (c: Card): StoredCard => ({
  ...c,
  due: c.due.toISOString(),
  last_review: c.last_review ? c.last_review.toISOString() : undefined,
});

const fromStored = (s: StoredCard): Card => ({
  ...s,
  due: new Date(s.due),
  last_review: s.last_review ? new Date(s.last_review) : undefined,
});

// quiz result -> FSRS grade by accuracy
export function ratingFromResult(r: QuizResult): Grade {
  const acc = r.total ? r.correct / r.total : 0;
  if (!r.passed || acc < 0.6) return Rating.Again;
  if (acc < 0.8) return Rating.Hard;
  if (acc < 0.95) return Rating.Good;
  return Rating.Easy;
}

// advance a card by one review; returns next StoredCard
export function reviewCard(prev: StoredCard | undefined, grade: Grade, now = new Date()): StoredCard {
  const card = prev ? fromStored(prev) : createEmptyCard(now);
  const { card: next } = scheduler.next(card, now, grade);
  return toStored(next);
}

// --- due helpers (uz) ---
const DAY = 86400000;

export function isDue(card: StoredCard | undefined, now = Date.now()): boolean {
  if (!card) return false;
  return new Date(card.due).getTime() <= now;
}

export function dueLabel(card: StoredCard | undefined, now = Date.now()): string {
  if (!card) return "Yangi";
  const due = new Date(card.due).getTime();
  const diff = due - now;
  if (diff <= 0) return "Takrorlash";
  const days = Math.ceil(diff / DAY);
  if (days <= 1) return "Ertaga";
  if (days < 7) return `${days} kундан keyin`;
  if (days < 30) return `${Math.round(days / 7)} haftadan keyin`;
  return `${Math.round(days / 30)} oydan keyin`;
}

export function formatDate(card: StoredCard | undefined): string {
  if (!card) return "-";
  return new Date(card.due).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
}
