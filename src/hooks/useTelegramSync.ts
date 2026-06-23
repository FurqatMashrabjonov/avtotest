/**
 * Telegram CloudStorage sync.
 *
 * Game store  → keys: "gs" (solved bitmask b64), "gm" (mistakes JSON)
 * Review store → individual keys: "r:test:1" ... "r:cat:124"
 *
 * Bitmask encoding: 1208 bits (1 per question by index) → base64 ~204 chars, well under 4096 limit.
 * CloudStorage writes are fire-and-forget with localStorage as always-on backup.
 */
import { useEffect, useRef } from "react";
import { TG } from "@/lib/telegram";
import { questions } from "@/lib/data";
import { useGame } from "@/store/useGame";
import { useReview } from "@/store/useReview";
import type { StoredCard } from "@/lib/fsrs";

// ---------- bitmask helpers ----------
const idxMap = new Map(questions.map((q, i) => [q.id, i]));

function encodeBitmask(ids: number[]): string {
  const bytes = new Uint8Array(Math.ceil(questions.length / 8));
  for (const id of ids) {
    const i = idxMap.get(id);
    if (i !== undefined) bytes[i >> 3] |= 1 << (i & 7);
  }
  return btoa(String.fromCharCode(...bytes));
}

function decodeBitmask(b64: string): number[] {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const ids: number[] = [];
  for (let i = 0; i < questions.length; i++) {
    if (bytes[i >> 3] & (1 << (i & 7))) ids.push(questions[i].id);
  }
  return ids;
}

// ---------- hook ----------
export function useTelegramSync() {
  const pulled = useRef(false);
  const { recordAnswer, reset: gameReset } = useGame();
  const { importCard, reset: reviewReset } = useReview();

  // --- initial pull from CloudStorage ---
  useEffect(() => {
    if (!TG.isAvailable() || pulled.current) return;
    pulled.current = true;

    (async () => {
      try {
        // pull game state
        const game = await TG.csGet(["gs", "gm"]);
        if (game.gs) {
          const solvedIds = decodeBitmask(game.gs);
          for (const id of solvedIds) recordAnswer(id, true);
        }
        if (game.gm) {
          const mistakeIds: number[] = JSON.parse(game.gm);
          for (const id of mistakeIds) recordAnswer(id, false);
        }

        // pull FSRS review cards
        const allKeys = await TG.csGetKeys();
        const reviewKeys = allKeys.filter((k) => k.startsWith("r:"));
        if (reviewKeys.length) {
          const chunks: Record<string, string>[] = [];
          for (let i = 0; i < reviewKeys.length; i += 16) {
            chunks.push(await TG.csGet(reviewKeys.slice(i, i + 16)));
          }
          const merged = Object.assign({}, ...chunks) as Record<string, string>;
          for (const [rawKey, json] of Object.entries(merged)) {
            const storeKey = rawKey.slice(2); // strip "r:" prefix
            try {
              const card: StoredCard = JSON.parse(json);
              importCard(storeKey, card);
            } catch {}
          }
        }
      } catch (e) {
        console.warn("CloudStorage pull failed", e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- push game changes (debounced) ---
  const gameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const unsub = useGame.subscribe((state) => {
      if (!TG.isAvailable()) return;
      if (gameDebounce.current) clearTimeout(gameDebounce.current);
      gameDebounce.current = setTimeout(() => {
        const gs = encodeBitmask(state.solvedIds);
        const gm = JSON.stringify(state.mistakeIds);
        TG.csSet("gs", gs).catch(() => {});
        TG.csSet("gm", gm).catch(() => {});
      }, 1500);
    });
    return () => { unsub(); if (gameDebounce.current) clearTimeout(gameDebounce.current); };
  }, []);

  // --- push review card changes (debounced per key) ---
  const reviewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const unsub = useReview.subscribe((state) => {
      if (!TG.isAvailable()) return;
      if (reviewDebounce.current) clearTimeout(reviewDebounce.current);
      reviewDebounce.current = setTimeout(() => {
        for (const [key, card] of Object.entries(state.cards)) {
          TG.csSet(`r:${key}`, JSON.stringify(card)).catch(() => {});
        }
      }, 1500);
    });
    return () => { unsub(); if (reviewDebounce.current) clearTimeout(reviewDebounce.current); };
  }, []);

  void gameReset; void reviewReset; void importCard; // prevent unused warning
}
