// Scrape tezkoravtotest.uz -> local JSON. lang=uz. Remote image URLs (no download).
// Run: node scripts/scrape.mjs
import { writeFile, mkdir } from "node:fs/promises";

const API = "https://api.tezkoravtotest.uz";
const IMG_BASE = `${API}/upload/`;
const LANG = "uz";
const OUT = new URL("../src/data/", import.meta.url);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(500 * (i + 1));
    }
  }
}

// full remote image url, or null
function imgUrl(raw) {
  if (!raw) return null;
  return IMG_BASE + String(raw).replace(/^\.?\//, "");
}

const clean = (s) => String(s ?? "").replace(/\r\n/g, "\n").trim();
const matchKey = (s) => clean(s).replace(/\s+/g, " ").toLowerCase();

function normalize(q) {
  // answers may be numbers; coerce to cleaned strings. match by collapsed-whitespace key.
  const answers = (Array.isArray(q.answers) ? q.answers : []).map(clean);
  const correct = clean(q.correctAnswer);
  const ck = matchKey(correct);
  return {
    id: q.id,
    text: clean(q.questionText),
    type: q.type,
    image: imgUrl(q.imageUrl),
    categoryId: q.categoryId ?? q.category?.id ?? null,
    answers,
    correctAnswer: correct,
    correctIndex: answers.findIndex((a) => matchKey(a) === ck),
  };
}

async function scrapeGeneral() {
  const first = await getJSON(`${API}/questions?page=1&lang=${LANG}`);
  const pageSize = first.pageSize || 20;
  const total = first.total || first.questions.length;
  const pages = Math.ceil(total / pageSize);
  console.log(`general: total=${total} pageSize=${pageSize} pages=${pages}`);
  const all = [...first.questions];
  for (let p = 2; p <= pages; p++) {
    const d = await getJSON(`${API}/questions?page=${p}&lang=${LANG}`);
    all.push(...d.questions);
    process.stdout.write(`\r  page ${p}/${pages} (${all.length})   `);
    await sleep(120);
  }
  console.log();
  return all;
}

async function scrapeCategories(from = 38, to = 124) {
  const all = [];
  for (let c = from; c <= to; c++) {
    const d = await getJSON(`${API}/questions/by-category/${c}?lang=${LANG}`);
    if (Array.isArray(d) && d.length) {
      all.push(...d);
      process.stdout.write(`\r  cat ${c}: +${d.length} (total ${all.length})   `);
    }
    await sleep(80);
  }
  console.log();
  return all;
}

async function main() {
  const [gen, cat] = [await scrapeGeneral(), await scrapeCategories()];

  // union dedupe by id
  const byId = new Map();
  const cats = new Map();
  for (const q of [...gen, ...cat]) {
    if (q.category && !cats.has(q.category.id)) cats.set(q.category.id, q.category);
    if (!byId.has(q.id)) byId.set(q.id, normalize(q));
  }

  const questions = [...byId.values()];
  const categories = [...cats.values()]
    .map((c) => ({ id: c.id, name: (c.name || "").trim(), description: (c.description || "").trim(), order: c.order ?? 999 }))
    .sort((a, b) => a.order - b.order);

  // count per category
  const counts = {};
  for (const q of questions) counts[q.categoryId] = (counts[q.categoryId] || 0) + 1;
  for (const c of categories) c.count = counts[c.id] || 0;

  const withImg = questions.filter((q) => q.image).length;
  const badIdx = questions.filter((q) => q.correctIndex < 0).length;

  await mkdir(OUT, { recursive: true });
  await writeFile(new URL("questions.json", OUT), JSON.stringify(questions));
  await writeFile(new URL("categories.json", OUT), JSON.stringify(categories, null, 2));

  console.log(`\nDONE`);
  console.log(`  questions: ${questions.length} (general ${gen.length}, category ${cat.length} raw)`);
  console.log(`  categories: ${categories.length}`);
  console.log(`  with image: ${withImg}`);
  console.log(`  correctAnswer not in answers[]: ${badIdx}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
