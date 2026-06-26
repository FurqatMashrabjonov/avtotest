import questionsJson from "@/data/questions.json";
import categoriesJson from "@/data/categories.json";

export interface Question {
  id: number;
  text: string;
  type: string;
  image: string | null;
  categoryId: number | null;
  answers: string[];
  correctAnswer: string;
  correctIndex: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  order: number;
  count: number;
}

export const questions = questionsJson as Question[];
export const categories = categoriesJson as Category[];

const byId = new Map(questions.map((q) => [q.id, q]));
export const getQuestion = (id: number) => byId.get(id);

const byCategory = new Map<number, Question[]>();
for (const q of questions) {
  if (q.categoryId == null) continue;
  if (!byCategory.has(q.categoryId)) byCategory.set(q.categoryId, []);
  byCategory.get(q.categoryId)!.push(q);
}
export const questionsByCategory = (id: number) => byCategory.get(id) ?? [];

export const categoryById = new Map(categories.map((c) => [c.id, c]));

export const BLOCK_SIZE = 20;
export const TEST_PASS_MAX_WRONG = 2;
export const testBlocks: Question[][] = Array.from(
  { length: Math.ceil(questions.length / BLOCK_SIZE) },
  (_, i) => questions.slice(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE)
);
export const getBlock = (n: number) => testBlocks[n - 1];
